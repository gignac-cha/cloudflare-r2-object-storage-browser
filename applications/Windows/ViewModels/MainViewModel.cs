#nullable enable

using System;
using System.Collections.ObjectModel;
using System.Threading.Tasks;
using System.Windows.Input;
using CloudflareR2Browser.Helpers;
using CloudflareR2Browser.Models;
using CloudflareR2Browser.Services;
using Microsoft.Extensions.Logging;
using Microsoft.UI;
using Microsoft.UI.Xaml.Media;
using Windows.UI;

namespace CloudflareR2Browser.ViewModels;

/// <summary>
/// Main ViewModel for the application window.
/// Manages server lifecycle, credentials, and global UI state.
/// </summary>
public sealed class MainViewModel : ObservableObject, IDisposable
{
    private readonly ILogger<MainViewModel> _logger;
    private readonly NodeServerManager _serverManager;
    private readonly R2ApiClient _apiClient;
    private readonly SettingsManager _settingsManager;

    private ServerState _serverState;
    private int? _serverPort;
    private string _serverStatusText = "Disconnected";
    private SolidColorBrush _serverStatusColor = new(Colors.Gray);
    private bool _isDebugPanelVisible;
    private bool _isTransferQueueVisible;
    private bool _disposed;

    /// <summary>
    /// Initializes a new instance of the MainViewModel class.
    /// </summary>
    /// <param name="logger">Logger instance.</param>
    /// <param name="serverManager">Node server manager.</param>
    /// <param name="apiClient">R2 API client.</param>
    /// <param name="settingsManager">Settings manager.</param>
    /// <param name="bucketSidebarViewModel">Bucket sidebar view model.</param>
    /// <param name="fileListViewModel">File list view model.</param>
    /// <param name="transferManagerViewModel">Transfer manager view model.</param>
    /// <param name="debugPanelViewModel">Debug panel view model.</param>
    public MainViewModel(
        ILogger<MainViewModel> logger,
        NodeServerManager serverManager,
        R2ApiClient apiClient,
        SettingsManager settingsManager,
        BucketSidebarViewModel bucketSidebarViewModel,
        FileListViewModel fileListViewModel,
        TransferManagerViewModel transferManagerViewModel,
        DebugPanelViewModel debugPanelViewModel)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _serverManager = serverManager ?? throw new ArgumentNullException(nameof(serverManager));
        _apiClient = apiClient ?? throw new ArgumentNullException(nameof(apiClient));
        _settingsManager = settingsManager ?? throw new ArgumentNullException(nameof(settingsManager));

        // Store child ViewModels
        BucketSidebarViewModel = bucketSidebarViewModel ?? throw new ArgumentNullException(nameof(bucketSidebarViewModel));
        FileListViewModel = fileListViewModel ?? throw new ArgumentNullException(nameof(fileListViewModel));
        TransferManagerViewModel = transferManagerViewModel ?? throw new ArgumentNullException(nameof(transferManagerViewModel));
        DebugPanelViewModel = debugPanelViewModel ?? throw new ArgumentNullException(nameof(debugPanelViewModel));

        // Initialize commands
        ToggleDebugPanelCommand = new RelayCommand(ToggleDebugPanel);
        ToggleTransferQueueCommand = new RelayCommand(ToggleTransferQueue);
        ShowSettingsCommand = new AsyncRelayCommand(ShowSettingsAsync);

        // Initialize state
        ServerState = ServerState.Stopped;

        // Subscribe to server events
        _serverManager.StateChanged += OnServerStateChanged;
        _serverManager.PortDetected += OnServerPortDetected;
        _serverManager.LogReceived += OnServerLogReceived;

        _logger.LogInformation("MainViewModel initialized");
    }

    // ========================================================================
    // Properties
    // ========================================================================

    /// <summary>
    /// Gets the current server state.
    /// </summary>
    public ServerState ServerState
    {
        get => _serverState;
        private set
        {
            if (SetProperty(ref _serverState, value))
            {
                UpdateServerStatus();
                OnPropertyChanged(nameof(IsServerRunning));
            }
        }
    }

    /// <summary>
    /// Gets the server port.
    /// </summary>
    public int? ServerPort
    {
        get => _serverPort;
        private set => SetProperty(ref _serverPort, value);
    }

    /// <summary>
    /// Gets the server status text for display.
    /// </summary>
    public string ServerStatusText
    {
        get => _serverStatusText;
        private set => SetProperty(ref _serverStatusText, value);
    }

    /// <summary>
    /// Gets the server status indicator brush.
    /// </summary>
    public SolidColorBrush ServerStatusColor
    {
        get => _serverStatusColor;
        private set => SetProperty(ref _serverStatusColor, value);
    }

    /// <summary>
    /// Gets the bucket sidebar view model.
    /// </summary>
    public BucketSidebarViewModel BucketSidebarViewModel { get; }

    /// <summary>
    /// Gets the file list view model.
    /// </summary>
    public FileListViewModel FileListViewModel { get; }

    /// <summary>
    /// Gets the transfer manager view model.
    /// </summary>
    public TransferManagerViewModel TransferManagerViewModel { get; }

    /// <summary>
    /// Gets the debug panel view model.
    /// </summary>
    public DebugPanelViewModel DebugPanelViewModel { get; }

    /// <summary>
    /// Gets whether the server is currently running.
    /// </summary>
    public bool IsServerRunning => ServerState == ServerState.Running;

    /// <summary>
    /// Gets the collection of server logs.
    /// </summary>
    public ObservableCollection<string> ServerLogs { get; } = new();

    /// <summary>
    /// Gets or sets whether the debug panel is visible.
    /// </summary>
    public bool IsDebugPanelVisible
    {
        get => _isDebugPanelVisible;
        set => SetProperty(ref _isDebugPanelVisible, value);
    }

    /// <summary>
    /// Gets or sets whether the transfer queue is visible.
    /// </summary>
    public bool IsTransferQueueVisible
    {
        get => _isTransferQueueVisible;
        set => SetProperty(ref _isTransferQueueVisible, value);
    }

    // ========================================================================
    // Commands
    // ========================================================================

    /// <summary>
    /// Command to toggle the debug panel visibility.
    /// </summary>
    public ICommand ToggleDebugPanelCommand { get; }

    /// <summary>
    /// Command to toggle the transfer queue visibility.
    /// </summary>
    public ICommand ToggleTransferQueueCommand { get; }

    /// <summary>
    /// Command to show the settings dialog.
    /// </summary>
    public ICommand ShowSettingsCommand { get; }

    // ========================================================================
    // Public Methods
    // ========================================================================

    /// <summary>
    /// Initializes the application: starts server and loads credentials.
    /// </summary>
    public async Task InitializeAsync()
    {
        _logger.LogInformation("Initializing application...");

        try
        {
            // Load saved credentials
            var hasCredentials = _settingsManager.LoadCredentials();
            if (hasCredentials)
            {
                _logger.LogInformation("Loaded saved credentials");
            }
            else
            {
                _logger.LogInformation("No saved credentials found");
            }

            // Start the Node.js server
            _logger.LogInformation("Starting Node.js server...");
            var started = await _serverManager.StartServerAsync();

            if (!started)
            {
                _logger.LogError("Failed to start server");
                ServerStatusText = "Server failed to start";
                ServerStatusColor = new SolidColorBrush(Colors.Red);
                return;
            }

            _logger.LogInformation("Application initialized successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to initialize application");
            ServerStatusText = $"Error: {ex.Message}";
            ServerStatusColor = new SolidColorBrush(Colors.Red);
        }
    }

    /// <summary>
    /// Shuts down the application gracefully.
    /// </summary>
    public async Task ShutdownAsync()
    {
        _logger.LogInformation("Shutting down application...");

        try
        {
            await _serverManager.StopServerAsync();
            _logger.LogInformation("Application shut down successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during shutdown");
        }
    }

    // ========================================================================
    // Private Methods
    // ========================================================================

    /// <summary>
    /// Toggles the debug panel visibility.
    /// </summary>
    private void ToggleDebugPanel()
    {
        IsDebugPanelVisible = !IsDebugPanelVisible;
        _logger.LogDebug("Debug panel toggled: {Visible}", IsDebugPanelVisible);
    }

    /// <summary>
    /// Toggles the transfer queue visibility.
    /// </summary>
    private void ToggleTransferQueue()
    {
        IsTransferQueueVisible = !IsTransferQueueVisible;
        _logger.LogDebug("Transfer queue toggled: {Visible}", IsTransferQueueVisible);
    }

    /// <summary>
    /// Shows the settings dialog.
    /// </summary>
    private async Task ShowSettingsAsync()
    {
        _logger.LogInformation("Opening settings dialog...");

        try
        {
            // Get the main window through App.Current
            if (Microsoft.UI.Xaml.Application.Current is App app && app.MainWindow is MainWindow mainWindow)
            {
                // Get SettingsViewModel from DI
                var settingsViewModel = App.GetService<SettingsViewModel>();

                // Create and show SettingsDialog
                var dialog = new Dialogs.SettingsDialog(settingsViewModel)
                {
                    XamlRoot = mainWindow.Content.XamlRoot
                };

                await dialog.ShowAsync();

                _logger.LogInformation("Settings dialog closed");
            }
            else
            {
                _logger.LogError("Could not get main window to show settings dialog");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error showing settings dialog");
        }
    }

    /// <summary>
    /// Updates the server status text and color based on current state.
    /// </summary>
    private void UpdateServerStatus()
    {
        switch (ServerState)
        {
            case ServerState.Stopped:
                ServerStatusText = "Server stopped";
                ServerStatusColor = new SolidColorBrush(Colors.Gray);
                break;

            case ServerState.Starting:
                ServerStatusText = "Server starting...";
                ServerStatusColor = new SolidColorBrush(Colors.Orange);
                break;

            case ServerState.Running:
                ServerStatusText = ServerPort.HasValue
                    ? $"Connected on port {ServerPort}"
                    : "Server running";
                ServerStatusColor = new SolidColorBrush(Colors.Green);
                break;

            case ServerState.Stopping:
                ServerStatusText = "Server stopping...";
                ServerStatusColor = new SolidColorBrush(Colors.Orange);
                break;

            case ServerState.Error:
                ServerStatusText = "Server error";
                ServerStatusColor = new SolidColorBrush(Colors.Red);
                break;

            default:
                ServerStatusText = "Unknown state";
                ServerStatusColor = new SolidColorBrush(Colors.Gray);
                break;
        }

        _logger.LogDebug("Server status updated: {Status}", ServerStatusText);
    }

    // ========================================================================
    // Event Handlers
    // ========================================================================

    /// <summary>
    /// Handles server state changes.
    /// </summary>
    private void OnServerStateChanged(object? sender, ServerState newState)
    {
        ServerState = newState;
        _logger.LogInformation("Server state changed to: {State}", newState);
    }

    /// <summary>
    /// Handles server port detection.
    /// </summary>
    private void OnServerPortDetected(object? sender, int port)
    {
        ServerPort = port;
        _apiClient.ServerPort = port;
        _logger.LogInformation("Server port detected: {Port}", port);
    }

    /// <summary>
    /// Handles server log messages.
    /// </summary>
    private void OnServerLogReceived(object? sender, string log)
    {
        // Add to logs collection (limit to last 1000 entries)
        if (ServerLogs.Count >= 1000)
        {
            ServerLogs.RemoveAt(0);
        }

        ServerLogs.Add($"[{DateTime.Now:HH:mm:ss}] {log}");
    }

    // ========================================================================
    // IDisposable
    // ========================================================================

    /// <summary>
    /// Disposes the ViewModel and cleans up resources.
    /// </summary>
    public void Dispose()
    {
        if (_disposed) return;

        _serverManager.StateChanged -= OnServerStateChanged;
        _serverManager.PortDetected -= OnServerPortDetected;
        _serverManager.LogReceived -= OnServerLogReceived;

        _disposed = true;
        _logger.LogDebug("MainViewModel disposed");
    }
}
