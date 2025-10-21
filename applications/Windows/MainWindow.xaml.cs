using System;
using Microsoft.UI;
using Microsoft.UI.Composition.SystemBackdrops;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Media;
using CloudflareR2Browser.ViewModels;
using WinRT;

namespace CloudflareR2Browser;

/// <summary>
/// The main application window.
/// </summary>
public sealed partial class MainWindow : Window
{
    private readonly MainViewModel _viewModel;
    private WindowsSystemDispatcherQueueHelper? _wsdqHelper;
    private MicaController? _micaController;
    private SystemBackdropConfiguration? _configurationSource;

    /// <summary>
    /// Initializes a new instance of the MainWindow class.
    /// </summary>
    public MainWindow(MainViewModel viewModel)
    {
        _viewModel = viewModel ?? throw new ArgumentNullException(nameof(viewModel));

        InitializeComponent();

        // Set DataContext for {Binding} to work
        DataContext = this;

        ConfigureWindow();
        SetupMicaBackdrop();

        Closed += OnWindowClosed;
    }

    /// <summary>
    /// Gets the view model for the main window.
    /// </summary>
    public MainViewModel ViewModel => _viewModel;

    /// <summary>
    /// Configures window properties.
    /// </summary>
    private void ConfigureWindow()
    {
        // Set window title
        Title = "Cloudflare R2 Object Storage Browser";

        // Set minimum window size
        var appWindow = AppWindow;
        if (appWindow != null)
        {
            appWindow.Resize(new Windows.Graphics.SizeInt32 { Width = 1200, Height = 800 });
        }

        // Center window on screen
        CenterWindow();
    }

    /// <summary>
    /// Centers the window on the screen.
    /// </summary>
    private void CenterWindow()
    {
        // Center window on screen
        // Note: In WinUI 3, window positioning is handled differently
        // For now, we'll skip centering as it requires additional P/Invoke code
    }

    /// <summary>
    /// Sets up Mica backdrop for Windows 11.
    /// </summary>
    private void SetupMicaBackdrop()
    {
        if (MicaController.IsSupported())
        {
            _wsdqHelper = new WindowsSystemDispatcherQueueHelper();
            _wsdqHelper.EnsureWindowsSystemDispatcherQueueController();

            _configurationSource = new SystemBackdropConfiguration();
            Activated += OnWindowActivated;
            Closed += OnWindowClosed;
            ((FrameworkElement)Content).ActualThemeChanged += OnThemeChanged;

            _configurationSource.IsInputActive = true;
            SetConfigurationSourceTheme();

            _micaController = new MicaController();
            _micaController.AddSystemBackdropTarget(this.As<Microsoft.UI.Composition.ICompositionSupportsSystemBackdrop>());
            _micaController.SetSystemBackdropConfiguration(_configurationSource);
        }
    }

    /// <summary>
    /// Handles window activation.
    /// </summary>
    private void OnWindowActivated(object sender, WindowActivatedEventArgs args)
    {
        if (_configurationSource != null)
        {
            _configurationSource.IsInputActive = args.WindowActivationState != WindowActivationState.Deactivated;
        }
    }

    /// <summary>
    /// Handles theme changes.
    /// </summary>
    private void OnThemeChanged(FrameworkElement sender, object args)
    {
        if (_configurationSource != null)
        {
            SetConfigurationSourceTheme();
        }
    }

    /// <summary>
    /// Sets the theme for the backdrop configuration.
    /// </summary>
    private void SetConfigurationSourceTheme()
    {
        if (_configurationSource == null) return;

        switch (((FrameworkElement)Content).ActualTheme)
        {
            case ElementTheme.Dark:
                _configurationSource.Theme = SystemBackdropTheme.Dark;
                break;
            case ElementTheme.Light:
                _configurationSource.Theme = SystemBackdropTheme.Light;
                break;
            case ElementTheme.Default:
                _configurationSource.Theme = SystemBackdropTheme.Default;
                break;
        }
    }

    /// <summary>
    /// Handles window closure.
    /// </summary>
    private void OnWindowClosed(object sender, WindowEventArgs args)
    {
        if (_micaController != null)
        {
            _micaController.Dispose();
            _micaController = null;
        }

        Activated -= OnWindowActivated;
        if (Content is FrameworkElement frameworkElement)
        {
            frameworkElement.ActualThemeChanged -= OnThemeChanged;
        }

        _configurationSource = null;
    }
}

/// <summary>
/// Helper class to ensure Windows System Dispatcher Queue is available.
/// </summary>
internal class WindowsSystemDispatcherQueueHelper
{
    private Microsoft.UI.Dispatching.DispatcherQueueController? _dispatcherQueueController;

    public void EnsureWindowsSystemDispatcherQueueController()
    {
        if (Microsoft.UI.Dispatching.DispatcherQueue.GetForCurrentThread() != null)
        {
            // Already initialized
            return;
        }

        if (_dispatcherQueueController == null)
        {
            // Create a DispatcherQueueController for this thread
            _dispatcherQueueController = Microsoft.UI.Dispatching.DispatcherQueueController.CreateOnDedicatedThread();
        }
    }
}
