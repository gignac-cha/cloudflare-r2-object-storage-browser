#nullable enable

using System;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using CloudflareR2Browser.Models;
using Microsoft.Extensions.Logging;

namespace CloudflareR2Browser.Services;

/// <summary>
/// Manages the lifecycle of the embedded Node.js server.
/// Handles detection, startup, monitoring, and graceful shutdown.
/// </summary>
public sealed class NodeServerManager : IDisposable
{
    private readonly ILogger<NodeServerManager> _logger;
    private readonly HttpClient _httpClient;

    private Process? _serverProcess;
    private CancellationTokenSource? _shutdownCts;
    private bool _disposed;

    /// <summary>
    /// Event raised when a log line is received from the server.
    /// </summary>
    public event EventHandler<string>? LogReceived;

    /// <summary>
    /// Event raised when the server port is detected.
    /// </summary>
    public event EventHandler<int>? PortDetected;

    /// <summary>
    /// Event raised when the server state changes.
    /// </summary>
    public event EventHandler<ServerState>? StateChanged;

    /// <summary>
    /// Gets the current server port, or null if not running.
    /// </summary>
    public int? ServerPort { get; private set; }

    /// <summary>
    /// Gets whether the server is currently running.
    /// </summary>
    public bool IsRunning => State == ServerState.Running;

    /// <summary>
    /// Gets the current server state.
    /// </summary>
    public ServerState State { get; private set; } = ServerState.Stopped;

    public NodeServerManager(ILogger<NodeServerManager> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(5) };
    }

    /// <summary>
    /// Starts the Node.js server asynchronously.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>True if server started successfully, false otherwise.</returns>
    public async Task<bool> StartServerAsync(CancellationToken cancellationToken = default)
    {
        if (State != ServerState.Stopped)
        {
            _logger.LogWarning("Server is already running or starting");
            return false;
        }

        try
        {
            SetState(ServerState.Starting);
            _shutdownCts = new CancellationTokenSource();

            // Find Node.js executable
            var nodeExePath = FindNodeExecutable();
            if (nodeExePath == null)
            {
                _logger.LogError("Node.js not found. Please install Node.js 18+ from https://nodejs.org/");
                SetState(ServerState.Error);
                return false;
            }

            _logger.LogInformation("Found Node.js at: {NodePath}", nodeExePath);

            // Find server script
            var serverScriptPath = FindServerScript();
            if (serverScriptPath == null)
            {
                _logger.LogError("Server script (server.cjs) not found");
                SetState(ServerState.Error);
                return false;
            }

            _logger.LogInformation("Found server script at: {ScriptPath}", serverScriptPath);

            // Create process
            _serverProcess = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = nodeExePath,
                    Arguments = $"\"{serverScriptPath}\"",
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    RedirectStandardInput = true,
                    CreateNoWindow = true,
                    WorkingDirectory = Path.GetDirectoryName(serverScriptPath) ?? Environment.CurrentDirectory
                },
                EnableRaisingEvents = true
            };

            // Wire up output handlers
            _serverProcess.OutputDataReceived += OnOutputDataReceived;
            _serverProcess.ErrorDataReceived += OnErrorDataReceived;
            _serverProcess.Exited += OnProcessExited;

            // Start process
            if (!_serverProcess.Start())
            {
                _logger.LogError("Failed to start Node.js process");
                SetState(ServerState.Error);
                return false;
            }

            _serverProcess.BeginOutputReadLine();
            _serverProcess.BeginErrorReadLine();

            _logger.LogInformation("Node.js process started (PID: {ProcessId})", _serverProcess.Id);

            // Wait for port detection (max 10 seconds)
            using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeoutCts.CancelAfter(TimeSpan.FromSeconds(10));

            try
            {
                while (ServerPort == null && !timeoutCts.Token.IsCancellationRequested)
                {
                    await Task.Delay(100, timeoutCts.Token);
                }

                if (ServerPort == null)
                {
                    _logger.LogError("Server failed to start within 10 seconds");
                    await StopServerAsync();
                    SetState(ServerState.Error);
                    return false;
                }

                SetState(ServerState.Running);
                _logger.LogInformation("Server started successfully on port {Port}", ServerPort);
                return true;
            }
            catch (OperationCanceledException)
            {
                _logger.LogError("Server startup was cancelled");
                await StopServerAsync();
                SetState(ServerState.Error);
                return false;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to start server");
            SetState(ServerState.Error);
            return false;
        }
    }

    /// <summary>
    /// Stops the Node.js server gracefully.
    /// </summary>
    public async Task StopServerAsync()
    {
        if (State == ServerState.Stopped || State == ServerState.Stopping)
        {
            return;
        }

        SetState(ServerState.Stopping);
        _logger.LogInformation("Stopping server...");

        try
        {
            // Try graceful shutdown via HTTP POST /shutdown
            if (ServerPort.HasValue)
            {
                try
                {
                    var shutdownUrl = $"http://127.0.0.1:{ServerPort}/shutdown";
                    _logger.LogInformation("Sending shutdown request to {Url}", shutdownUrl);

                    using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(3));
                    await _httpClient.PostAsync(shutdownUrl, null, cts.Token);

                    _logger.LogInformation("Shutdown request sent successfully");
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to send shutdown request, will force kill");
                }
            }

            // Wait for process to exit (max 3 seconds)
            if (_serverProcess != null && !_serverProcess.HasExited)
            {
                if (!_serverProcess.WaitForExit(3000))
                {
                    _logger.LogWarning("Server did not exit gracefully, forcing shutdown");
                    _serverProcess.Kill(entireProcessTree: true);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error stopping server");
        }
        finally
        {
            CleanupProcess();
            ServerPort = null;
            SetState(ServerState.Stopped);
            _logger.LogInformation("Server stopped");
        }
    }

    /// <summary>
    /// Finds the Node.js executable in common Windows paths.
    /// </summary>
    private string? FindNodeExecutable()
    {
        // 1. Check PATH environment variable
        var pathEnv = Environment.GetEnvironmentVariable("PATH");
        if (pathEnv != null)
        {
            foreach (var path in pathEnv.Split(';'))
            {
                var nodePath = Path.Combine(path.Trim(), "node.exe");
                if (File.Exists(nodePath))
                {
                    return nodePath;
                }
            }
        }

        // 2. Check Program Files
        var programFiles = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
        var nodejsPath = Path.Combine(programFiles, "nodejs", "node.exe");
        if (File.Exists(nodejsPath))
        {
            return nodejsPath;
        }

        // 3. Check nvm-windows installations
        var nvmPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "nvm");
        if (Directory.Exists(nvmPath))
        {
            var versionDirs = Directory.GetDirectories(nvmPath);
            foreach (var versionDir in versionDirs)
            {
                var nodeExe = Path.Combine(versionDir, "node.exe");
                if (File.Exists(nodeExe))
                {
                    return nodeExe;
                }
            }
        }

        return null;
    }

    /// <summary>
    /// Finds the server.cjs script in production or development locations.
    /// </summary>
    private string? FindServerScript()
    {
        var appDir = AppContext.BaseDirectory;

        // 1. Production: Resources/server.cjs
        var productionPath = Path.Combine(appDir, "Resources", "server.cjs");
        if (File.Exists(productionPath))
        {
            return productionPath;
        }

        // 2. Development: ../../packages/api/outputs/server.cjs
        var devPath = Path.GetFullPath(Path.Combine(appDir, "..", "..", "..", "..", "packages", "api", "outputs", "server.cjs"));
        if (File.Exists(devPath))
        {
            return devPath;
        }

        return null;
    }

    /// <summary>
    /// Handles stdout data from the Node.js process.
    /// </summary>
    private void OnOutputDataReceived(object sender, DataReceivedEventArgs e)
    {
        if (string.IsNullOrEmpty(e.Data))
        {
            return;
        }

        _logger.LogDebug("[Server] {Output}", e.Data);
        LogReceived?.Invoke(this, e.Data);

        // Parse PORT=XXXXX from stdout
        var portMatch = Regex.Match(e.Data, @"PORT=(\d+)");
        if (portMatch.Success && int.TryParse(portMatch.Groups[1].Value, out var port))
        {
            ServerPort = port;
            _logger.LogInformation("Server port detected: {Port}", port);
            PortDetected?.Invoke(this, port);
        }
    }

    /// <summary>
    /// Handles stderr data from the Node.js process.
    /// </summary>
    private void OnErrorDataReceived(object sender, DataReceivedEventArgs e)
    {
        if (string.IsNullOrEmpty(e.Data))
        {
            return;
        }

        _logger.LogWarning("[Server Error] {Error}", e.Data);
        LogReceived?.Invoke(this, $"[ERROR] {e.Data}");
    }

    /// <summary>
    /// Handles process exit event.
    /// </summary>
    private void OnProcessExited(object? sender, EventArgs e)
    {
        var exitCode = _serverProcess?.ExitCode ?? -1;
        _logger.LogInformation("Server process exited with code {ExitCode}", exitCode);

        CleanupProcess();
        ServerPort = null;

        if (State != ServerState.Stopping)
        {
            SetState(ServerState.Error);
        }
    }

    /// <summary>
    /// Cleans up the process resources.
    /// </summary>
    private void CleanupProcess()
    {
        if (_serverProcess != null)
        {
            _serverProcess.OutputDataReceived -= OnOutputDataReceived;
            _serverProcess.ErrorDataReceived -= OnErrorDataReceived;
            _serverProcess.Exited -= OnProcessExited;
            _serverProcess.Dispose();
            _serverProcess = null;
        }

        _shutdownCts?.Dispose();
        _shutdownCts = null;
    }

    /// <summary>
    /// Sets the server state and raises the StateChanged event.
    /// </summary>
    private void SetState(ServerState newState)
    {
        if (State != newState)
        {
            State = newState;
            _logger.LogDebug("Server state changed to {State}", newState);
            StateChanged?.Invoke(this, newState);
        }
    }

    public void Dispose()
    {
        if (_disposed)
        {
            return;
        }

        StopServerAsync().GetAwaiter().GetResult();
        _httpClient.Dispose();
        _disposed = true;
    }
}
