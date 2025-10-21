using System;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using CloudflareR2Browser.Services;
using CloudflareR2Browser.ViewModels;

namespace CloudflareR2Browser;

/// <summary>
/// Provides application-specific behavior to supplement the default Application class.
/// </summary>
public partial class App : Application
{
    private Window? _mainWindow;
    private IServiceProvider? _serviceProvider;

    /// <summary>
    /// Gets the current App instance.
    /// </summary>
    public static new App Current => (App)Application.Current;

    /// <summary>
    /// Gets the main application window.
    /// </summary>
    public Window? MainWindow => _mainWindow;

    /// <summary>
    /// Initializes the singleton application object. This is the first line of authored code
    /// executed, and as such is the logical equivalent of main() or WinMain().
    /// </summary>
    public App()
    {
        InitializeComponent();
        ConfigureServices();
    }

    /// <summary>
    /// Gets the current application instance.
    /// </summary>
    public new static App Current => (App)Application.Current;

    /// <summary>
    /// Gets the service provider for dependency injection.
    /// </summary>
    public IServiceProvider Services => _serviceProvider ?? throw new InvalidOperationException("Services not initialized");

    /// <summary>
    /// Configures dependency injection services.
    /// </summary>
    private void ConfigureServices()
    {
        var services = new ServiceCollection();

        // Logging
        services.AddLogging(builder =>
        {
            builder.AddDebug();
            builder.SetMinimumLevel(LogLevel.Debug);
        });

        // Core Services (Singletons)
        services.AddSingleton<NodeServerManager>();
        services.AddSingleton<R2ApiClient>();
        services.AddSingleton<SettingsManager>();
        services.AddSingleton<CacheManager>();
        services.AddSingleton<FolderCache>();

        // ViewModels
        services.AddSingleton<MainViewModel>();
        services.AddSingleton<TransferManagerViewModel>();
        services.AddSingleton<DebugPanelViewModel>();
        services.AddTransient<BucketSidebarViewModel>();
        services.AddTransient<FileListViewModel>();
        services.AddTransient<SettingsViewModel>();

        // Windows
        services.AddTransient<MainWindow>();

        _serviceProvider = services.BuildServiceProvider();
    }

    /// <summary>
    /// Invoked when the application is launched.
    /// </summary>
    /// <param name="args">Details about the launch request and process.</param>
    protected override async void OnLaunched(LaunchActivatedEventArgs args)
    {
        try
        {
            await InitializeApplicationAsync();
        }
        catch (Exception ex)
        {
            var logger = Services.GetService<ILogger<App>>();
            logger?.LogError(ex, "Failed to initialize application");

            // Show error dialog
            var errorDialog = new ContentDialog
            {
                Title = "Initialization Error",
                Content = $"Failed to start application: {ex.Message}",
                CloseButtonText = "Exit",
                XamlRoot = _mainWindow?.Content?.XamlRoot
            };

            if (_mainWindow?.Content?.XamlRoot != null)
            {
                await errorDialog.ShowAsync();
            }

            Exit();
        }
    }

    /// <summary>
    /// Initializes the application asynchronously.
    /// </summary>
    private async Task InitializeApplicationAsync()
    {
        var logger = Services.GetRequiredService<ILogger<App>>();
        logger.LogInformation("Initializing Cloudflare R2 Browser application");

        // Create main window first (needed for dialogs)
        _mainWindow = Services.GetRequiredService<MainWindow>();

        // Load settings
        var settingsManager = Services.GetRequiredService<SettingsManager>();
        var hasCredentials = settingsManager.LoadCredentials();

        // Start Node.js server
        var serverManager = Services.GetRequiredService<NodeServerManager>();

        if (hasCredentials)
        {
            logger.LogInformation("Starting server with saved credentials");
            await serverManager.StartServerAsync();

            // Wait for server to be ready (max 10 seconds)
            var timeout = TimeSpan.FromSeconds(10);
            var startTime = DateTime.UtcNow;

            while (!serverManager.ServerPort.HasValue && DateTime.UtcNow - startTime < timeout)
            {
                await Task.Delay(100);
            }

            if (serverManager.ServerPort.HasValue)
            {
                logger.LogInformation("Server started on port {Port}", serverManager.ServerPort.Value);

                // Set API client server port
                var apiClient = Services.GetRequiredService<R2ApiClient>();
                apiClient.ServerPort = serverManager.ServerPort.Value;
            }
            else
            {
                logger.LogWarning("Server did not start within timeout period");
            }
        }
        else
        {
            logger.LogInformation("No saved credentials found. Server will start when credentials are provided.");
        }

        // CacheManager initializes in constructor, no need to call InitializeAsync

        // Activate main window
        _mainWindow.Activate();
    }

    /// <summary>
    /// Gets a service from the service provider.
    /// </summary>
    public static T GetService<T>() where T : class
    {
        return Current.Services.GetRequiredService<T>();
    }
}
