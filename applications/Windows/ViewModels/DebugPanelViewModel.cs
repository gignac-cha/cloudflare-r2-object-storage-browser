#nullable enable

using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Input;
using CloudflareR2Browser.Helpers;
using CloudflareR2Browser.Models;
using CloudflareR2Browser.Services;
using Microsoft.Extensions.Logging;
using Windows.ApplicationModel.DataTransfer;

namespace CloudflareR2Browser.ViewModels;

/// <summary>
/// Enumeration for debug panel tabs.
/// </summary>
public enum DebugPanelTab
{
    /// <summary>
    /// API responses tab.
    /// </summary>
    ApiResponses,

    /// <summary>
    /// Server logs tab.
    /// </summary>
    ServerLogs
}

/// <summary>
/// ViewModel for the debug panel.
/// Manages API response tracking and server log display.
/// </summary>
public sealed class DebugPanelViewModel : ObservableObject, IDisposable
{
    private readonly ILogger<DebugPanelViewModel> _logger;
    private readonly NodeServerManager _serverManager;

    private DebugPanelTab _selectedTab = DebugPanelTab.ApiResponses;
    private string _searchQuery = "";
    private bool _isVisible;
    private bool _disposed;

    /// <summary>
    /// Initializes a new instance of the DebugPanelViewModel class.
    /// </summary>
    /// <param name="logger">Logger instance.</param>
    /// <param name="serverManager">Node server manager for logs.</param>
    public DebugPanelViewModel(
        ILogger<DebugPanelViewModel> logger,
        NodeServerManager serverManager)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _serverManager = serverManager ?? throw new ArgumentNullException(nameof(serverManager));

        // Initialize commands
        CopyResponseCommand = new RelayCommand<ApiDebugResponse>(CopyResponse);
        ClearApiResponsesCommand = new RelayCommand(ClearApiResponses);
        ClearServerLogsCommand = new RelayCommand(ClearServerLogs);
        ExportLogsCommand = new AsyncRelayCommand(ExportLogsAsync);
        CloseCommand = new RelayCommand(Close);

        // Subscribe to server logs
        _serverManager.LogReceived += OnServerLogReceived;

        _logger.LogInformation("DebugPanelViewModel initialized");
    }

    // ========================================================================
    // Properties
    // ========================================================================

    /// <summary>
    /// Gets or sets the selected tab.
    /// </summary>
    public DebugPanelTab SelectedTab
    {
        get => _selectedTab;
        set => SetProperty(ref _selectedTab, value);
    }

    /// <summary>
    /// Gets the collection of API debug responses.
    /// </summary>
    public ObservableCollection<ApiDebugResponse> ApiResponses { get; } = new();

    /// <summary>
    /// Gets the collection of server logs.
    /// </summary>
    public ObservableCollection<string> ServerLogs { get; } = new();

    /// <summary>
    /// Gets the filtered API responses based on search query.
    /// </summary>
    public IEnumerable<ApiDebugResponse> FilteredApiResponses
    {
        get
        {
            if (string.IsNullOrWhiteSpace(SearchQuery))
            {
                return ApiResponses;
            }

            var query = SearchQuery.ToLowerInvariant();
            return ApiResponses.Where(r =>
                r.Endpoint.ToLowerInvariant().Contains(query) ||
                r.Method.ToLowerInvariant().Contains(query) ||
                r.ResponseBody?.ToLowerInvariant().Contains(query) == true);
        }
    }

    /// <summary>
    /// Gets the filtered server logs based on search query.
    /// </summary>
    public IEnumerable<string> FilteredServerLogs
    {
        get
        {
            if (string.IsNullOrWhiteSpace(SearchQuery))
            {
                return ServerLogs;
            }

            var query = SearchQuery.ToLowerInvariant();
            return ServerLogs.Where(log => log.ToLowerInvariant().Contains(query));
        }
    }

    /// <summary>
    /// Gets or sets the search query for filtering.
    /// </summary>
    public string SearchQuery
    {
        get => _searchQuery;
        set
        {
            if (SetProperty(ref _searchQuery, value))
            {
                OnPropertyChanged(nameof(FilteredApiResponses));
                OnPropertyChanged(nameof(FilteredServerLogs));
            }
        }
    }

    /// <summary>
    /// Gets or sets whether the debug panel is visible.
    /// </summary>
    public bool IsVisible
    {
        get => _isVisible;
        set => SetProperty(ref _isVisible, value);
    }

    /// <summary>
    /// Gets the total number of API responses.
    /// </summary>
    public int ApiResponseCount => ApiResponses.Count;

    /// <summary>
    /// Gets the total number of server logs.
    /// </summary>
    public int ServerLogCount => ServerLogs.Count;

    // ========================================================================
    // Commands
    // ========================================================================

    /// <summary>
    /// Command to copy an API response to clipboard.
    /// </summary>
    public ICommand CopyResponseCommand { get; }

    /// <summary>
    /// Command to clear all API responses.
    /// </summary>
    public ICommand ClearApiResponsesCommand { get; }

    /// <summary>
    /// Command to clear all server logs.
    /// </summary>
    public ICommand ClearServerLogsCommand { get; }

    /// <summary>
    /// Command to export logs to a file.
    /// </summary>
    public ICommand ExportLogsCommand { get; }

    /// <summary>
    /// Command to close the debug panel.
    /// </summary>
    public ICommand CloseCommand { get; }

    // ========================================================================
    // Public Methods
    // ========================================================================

    /// <summary>
    /// Adds an API response to the debug log.
    /// </summary>
    /// <param name="method">HTTP method.</param>
    /// <param name="endpoint">API endpoint.</param>
    /// <param name="statusCode">HTTP status code.</param>
    /// <param name="responseBody">Response body JSON.</param>
    /// <param name="durationMs">Request duration in milliseconds.</param>
    public void AddApiResponse(
        string method,
        string endpoint,
        int statusCode,
        string? responseBody,
        double durationMs)
    {
        var response = new ApiDebugResponse
        {
            Method = method,
            Endpoint = endpoint,
            StatusCode = statusCode,
            ResponseBody = responseBody,
            DurationMs = durationMs,
            Timestamp = DateTime.UtcNow
        };

        // Add to beginning of collection
        ApiResponses.Insert(0, response);

        // Limit to last 500 responses
        while (ApiResponses.Count > 500)
        {
            ApiResponses.RemoveAt(ApiResponses.Count - 1);
        }

        OnPropertyChanged(nameof(ApiResponseCount));
        OnPropertyChanged(nameof(FilteredApiResponses));

        _logger.LogDebug("API response logged: {Method} {Endpoint} ({StatusCode}) - {Duration}ms",
            method, endpoint, statusCode, durationMs);
    }

    /// <summary>
    /// Shows the debug panel.
    /// </summary>
    public void Show()
    {
        IsVisible = true;
        _logger.LogDebug("Debug panel shown");
    }

    /// <summary>
    /// Hides the debug panel.
    /// </summary>
    public void Hide()
    {
        IsVisible = false;
        _logger.LogDebug("Debug panel hidden");
    }

    /// <summary>
    /// Toggles the debug panel visibility.
    /// </summary>
    public void Toggle()
    {
        IsVisible = !IsVisible;
        _logger.LogDebug("Debug panel toggled: {Visible}", IsVisible);
    }

    // ========================================================================
    // Private Methods
    // ========================================================================

    /// <summary>
    /// Copies an API response to the clipboard.
    /// </summary>
    private void CopyResponse(ApiDebugResponse? response)
    {
        if (response == null)
        {
            return;
        }

        var text = new StringBuilder();
        text.AppendLine($"Method: {response.Method}");
        text.AppendLine($"Endpoint: {response.Endpoint}");
        text.AppendLine($"Status Code: {response.StatusCode}");
        text.AppendLine($"Duration: {response.DurationMs:F2}ms");
        text.AppendLine($"Timestamp: {response.Timestamp:yyyy-MM-dd HH:mm:ss}");
        text.AppendLine();
        text.AppendLine("Response Body:");
        text.AppendLine(response.ResponseBody ?? "(empty)");

        var dataPackage = new DataPackage();
        dataPackage.SetText(text.ToString());
        Clipboard.SetContent(dataPackage);

        _logger.LogInformation("API response copied to clipboard");
    }

    /// <summary>
    /// Clears all API responses.
    /// </summary>
    private void ClearApiResponses()
    {
        var count = ApiResponses.Count;
        ApiResponses.Clear();
        OnPropertyChanged(nameof(ApiResponseCount));
        OnPropertyChanged(nameof(FilteredApiResponses));
        _logger.LogInformation("Cleared {Count} API responses", count);
    }

    /// <summary>
    /// Clears all server logs.
    /// </summary>
    private void ClearServerLogs()
    {
        var count = ServerLogs.Count;
        ServerLogs.Clear();
        OnPropertyChanged(nameof(ServerLogCount));
        OnPropertyChanged(nameof(FilteredServerLogs));
        _logger.LogInformation("Cleared {Count} server logs", count);
    }

    /// <summary>
    /// Exports logs to a file.
    /// </summary>
    private async Task ExportLogsAsync()
    {
        try
        {
            var fileName = $"r2browser-debug-{DateTime.Now:yyyyMMdd-HHmmss}.log";
            var desktopPath = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
            var filePath = Path.Combine(desktopPath, fileName);

            var content = new StringBuilder();

            // Export API responses
            content.AppendLine("=== API Responses ===");
            content.AppendLine();
            foreach (var response in ApiResponses)
            {
                content.AppendLine($"[{response.Timestamp:yyyy-MM-dd HH:mm:ss}] {response.Method} {response.Endpoint}");
                content.AppendLine($"Status: {response.StatusCode} | Duration: {response.DurationMs:F2}ms");
                content.AppendLine($"Response: {response.ResponseBody ?? "(empty)"}");
                content.AppendLine();
            }

            content.AppendLine();
            content.AppendLine("=== Server Logs ===");
            content.AppendLine();
            foreach (var log in ServerLogs)
            {
                content.AppendLine(log);
            }

            await File.WriteAllTextAsync(filePath, content.ToString());

            _logger.LogInformation("Logs exported to: {Path}", filePath);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to export logs");
        }
    }

    /// <summary>
    /// Closes the debug panel.
    /// </summary>
    private void Close()
    {
        IsVisible = false;
        _logger.LogDebug("Debug panel closed");
    }

    // ========================================================================
    // Event Handlers
    // ========================================================================

    /// <summary>
    /// Handles server log messages.
    /// </summary>
    private void OnServerLogReceived(object? sender, string log)
    {
        // Add to logs collection
        ServerLogs.Insert(0, $"[{DateTime.Now:HH:mm:ss}] {log}");

        // Limit to last 1000 entries
        while (ServerLogs.Count > 1000)
        {
            ServerLogs.RemoveAt(ServerLogs.Count - 1);
        }

        OnPropertyChanged(nameof(ServerLogCount));
        OnPropertyChanged(nameof(FilteredServerLogs));
    }

    // ========================================================================
    // IDisposable
    // ========================================================================

    /// <summary>
    /// Disposes the ViewModel and cleans up resources.
    /// </summary>
    public void Dispose()
    {
        if (_disposed)
        {
            return;
        }

        _serverManager.LogReceived -= OnServerLogReceived;

        _disposed = true;
        _logger.LogDebug("DebugPanelViewModel disposed");
    }
}
