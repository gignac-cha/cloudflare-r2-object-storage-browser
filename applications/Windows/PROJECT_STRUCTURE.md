# WinUI 3 Application Structure

## Project Information

- **Name**: CloudflareR2Browser
- **Framework**: WinUI 3 (Windows App SDK 1.5+)
- **Language**: C# 12 (.NET 8)
- **Target OS**: Windows 10 1809+ / Windows 11
- **Architecture**: MVVM with Dependency Injection

## Directory Structure

```
CloudflareR2Browser/
├── CloudflareR2Browser.csproj          # Project file
├── app.manifest                         # Windows 11 compatibility
├── Package.appxmanifest                 # MSIX packaging manifest
├── App.xaml                             # Application resources
├── App.xaml.cs                          # Application entry point
├── MainWindow.xaml                      # Main window layout
├── MainWindow.xaml.cs                   # Main window code-behind
│
├── Services/                            # Business logic layer
│   ├── NodeServerManager.cs             # Embedded Node.js server management
│   ├── R2ApiClient.cs                   # HTTP API client for local server
│   ├── SettingsManager.cs               # Credential management (Windows Credential Vault)
│   ├── CacheManager.cs                  # File download cache
│   └── FolderCache.cs                   # LRU cache for folder listings
│
├── ViewModels/                          # MVVM ViewModels
│   ├── MainViewModel.cs                 # Main window ViewModel
│   ├── BucketSidebarViewModel.cs        # Bucket list ViewModel
│   ├── FileListViewModel.cs             # File browser ViewModel
│   ├── TransferManagerViewModel.cs      # Transfer queue ViewModel
│   ├── DebugPanelViewModel.cs           # Debug panel ViewModel
│   └── SettingsViewModel.cs             # Settings dialog ViewModel
│
├── Views/                               # XAML User Controls
│   ├── BucketSidebarView.xaml/cs        # Left sidebar (bucket list)
│   ├── FileListView.xaml/cs             # Center panel (file browser)
│   ├── ToolbarView.xaml/cs              # Top toolbar (nav + actions)
│   ├── BreadcrumbView.xaml/cs           # Path navigation
│   ├── TransferQueuePanel.xaml/cs       # Transfer queue panel
│   └── DebugPanelView.xaml/cs           # Debug panel (API logs + server logs)
│
├── Dialogs/                             # ContentDialog components
│   ├── SettingsDialog.xaml/cs           # R2 credentials configuration
│   ├── PreviewDialog.xaml/cs            # File preview dialog
│   └── LoadingOverlay.xaml/cs           # Loading overlay UserControl
│
├── Models/                              # Data models
│   ├── ApiModels.cs                     # API request/response DTOs
│   ├── Bucket.cs                        # Bucket model
│   ├── R2Object.cs                      # File/folder model
│   ├── TransferTask.cs                  # Transfer queue task model
│   └── ServerState.cs                   # Server state enums
│
├── Converters/                          # Value converters for XAML binding
│   ├── BoolToVisibilityConverter.cs     # bool → Visibility
│   ├── BytesToStringConverter.cs        # long → "1.5 MB"
│   ├── DateToRelativeConverter.cs       # DateTime → "2 hours ago"
│   ├── FileIconConverter.cs             # Extension → Glyph
│   └── NullToVisibilityConverter.cs     # null → Collapsed
│
├── Helpers/                             # Utility classes
│   ├── RelayCommand.cs                  # ICommand implementation
│   ├── AsyncRelayCommand.cs             # Async ICommand
│   ├── ObservableObject.cs              # INotifyPropertyChanged base
│   └── LoadingState.cs                  # Generic loading state wrapper
│
├── Resources/                           # Application resources
│   ├── Styles/
│   │   ├── ButtonStyles.xaml            # Custom button styles
│   │   ├── ListStyles.xaml              # ListView/DataGrid styles
│   │   └── ColorBrushes.xaml            # Custom color palette
│   ├── Icons/
│   │   └── SegoeIcons.xaml              # Fluent icon definitions
│   ├── server.cjs                       # Bundled Node.js API server
│   └── Assets/
│       ├── AppIcon.png                  # Application icon
│       └── SplashScreen.png             # Splash screen
│
└── Properties/
    └── launchSettings.json              # Debug launch settings
```

## Key Technologies

### NuGet Packages

```xml
<!-- Required Packages -->
<PackageReference Include="Microsoft.WindowsAppSDK" Version="1.5.240227000" />
<PackageReference Include="Microsoft.Windows.SDK.BuildTools" Version="10.0.22621.3233" />

<!-- Community Toolkit -->
<PackageReference Include="CommunityToolkit.Mvvm" Version="8.2.2" />
<PackageReference Include="CommunityToolkit.WinUI.UI.Controls" Version="7.1.2" />
<PackageReference Include="CommunityToolkit.WinUI.UI.Controls.DataGrid" Version="7.1.2" />

<!-- Dependency Injection -->
<PackageReference Include="Microsoft.Extensions.DependencyInjection" Version="8.0.0" />
<PackageReference Include="Microsoft.Extensions.Logging" Version="8.0.0" />

<!-- JSON Serialization -->
<PackageReference Include="System.Text.Json" Version="8.0.0" />
```

## Architecture Patterns

### MVVM with Dependency Injection

```csharp
// App.xaml.cs
public IServiceProvider Services { get; }

public App()
{
    var services = new ServiceCollection();

    // Services
    services.AddSingleton<NodeServerManager>();
    services.AddSingleton<R2ApiClient>();
    services.AddSingleton<SettingsManager>();
    services.AddSingleton<CacheManager>();

    // ViewModels
    services.AddTransient<MainViewModel>();
    services.AddTransient<BucketSidebarViewModel>();
    services.AddTransient<FileListViewModel>();
    services.AddSingleton<TransferManagerViewModel>();

    Services = services.BuildServiceProvider();
}
```

### ViewModels with INotifyPropertyChanged

Use CommunityToolkit.Mvvm source generators:

```csharp
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

public partial class BucketSidebarViewModel : ObservableObject
{
    [ObservableProperty]
    private ObservableCollection<Bucket> buckets;

    [ObservableProperty]
    private Bucket selectedBucket;

    [RelayCommand]
    private async Task RefreshAsync()
    {
        // Implementation
    }
}
```

## Design System

### Windows 11 Fluent Design

- **Backdrop**: Mica (Windows 11) / Acrylic (Windows 10)
- **Icons**: Segoe Fluent Icons
- **Spacing**: 8pt grid system
- **Corner Radius**: 4pt (small), 6pt (medium), 8pt (large)
- **Colors**: System theme resources

### Theme Resources

```xaml
<!-- Backgrounds -->
<Brush x:Key="CardBackgroundBrush">{ThemeResource CardBackgroundFillColorDefaultBrush}</Brush>
<Brush x:Key="LayerBackgroundBrush">{ThemeResource LayerFillColorDefaultBrush}</Brush>

<!-- Text -->
<Brush x:Key="TextPrimaryBrush">{ThemeResource TextFillColorPrimaryBrush}</Brush>
<Brush x:Key="TextSecondaryBrush">{ThemeResource TextFillColorSecondaryBrush}</Brush>

<!-- Accent -->
<Brush x:Key="AccentBrush">{ThemeResource AccentFillColorDefaultBrush}</Brush>
```

## Application Flow

### Startup Sequence

1. **App.xaml.cs OnLaunched()**
   - Initialize DI container
   - Load credentials from Windows Credential Vault
   - Start Node.js server (NodeServerManager)
   - Wait for port detection (max 10s)
   - Initialize R2ApiClient with server port
   - Show MainWindow

2. **MainWindow OnLoaded()**
   - Bind ViewModels to UI
   - Auto-load buckets if credentials exist
   - Show settings dialog if no credentials

3. **Server Lifecycle**
   - Startup: Detect Node.js → Launch server → Parse PORT from stdout
   - Runtime: Monitor stdout/stderr → Log to debug panel
   - Shutdown: HTTP POST /shutdown → Wait 3s → Force kill if needed

### Navigation Flow

```
MainWindow
├── Header (Server status indicator)
├── Grid (2-column layout with GridSplitter)
│   ├── BucketSidebarView (left, 250px default)
│   └── Grid (right, content area)
│       ├── CommandBar (toolbar)
│       ├── BreadcrumbBar (path navigation)
│       ├── FileListView (main content)
│       └── TabView (bottom panels)
│           ├── TransferQueuePanel
│           └── DebugPanelView
├── LoadingOverlay (full-screen modal)
└── Dialogs (SettingsDialog, PreviewDialog)
```

## File Operations

### Upload Flow

1. User clicks Upload → `StorageFilePicker`
2. Create `TransferTask` with status=Queued
3. Add to `TransferManagerViewModel.ActiveTasks`
4. Process queue (max 3 concurrent uploads)
5. `R2ApiClient.UploadFileAsync()` with progress callback
6. Update task status → Completed/Failed
7. Refresh file list

### Download Flow

1. User selects files → clicks Download → `FolderPicker`
2. Create `TransferTask` for each file
3. Add to queue (max 5 concurrent downloads)
4. `R2ApiClient.DownloadObjectToFileAsync()` with progress
5. Save to destination folder
6. Update task status

### Delete Flow

1. User selects files → Confirmation dialog
2. Separate folders and files
3. Count items in folders (for progress)
4. Create `TransferTask` with totalCount
5. Delete folders → `R2ApiClient.DeleteFolderAsync()`
6. Delete files in batches (1000 max)
7. Track progress per item

## State Management

### Loading States

```csharp
public enum LoadingState<T>
{
    Idle,
    Loading,
    Loaded(T data),
    Failed(Exception error)
}
```

### Server States

```csharp
public enum ServerState
{
    Stopped,
    Starting,
    Running,
    Stopping,
    Error
}
```

### Transfer States

```csharp
public enum TransferStatus
{
    Queued,
    Uploading,
    Downloading,
    Deleting,
    Paused,
    Completed,
    Failed,
    Cancelled
}
```

## Build Configuration

### Debug Build

- Looks for `packages/api/outputs/server.cjs` relative to project
- Enables hot reload for XAML
- Console window for debugging

### Release Build

- Bundles `server.cjs` in `Resources/` directory
- MSIX packaging with self-signed certificate
- No console window
- Optimized IL code

## Deployment

### Prerequisites

- Windows 10 1809+ or Windows 11
- Node.js 18+ (detected automatically from PATH or common install locations)
- .NET 8 Runtime (bundled with MSIX)

### MSIX Package

```xml
<Identity Name="CloudflareR2Browser"
          Publisher="CN=YourName"
          Version="1.0.0.0" />

<Properties>
    <DisplayName>Cloudflare R2 Browser</DisplayName>
    <PublisherDisplayName>Your Name</PublisherDisplayName>
</Properties>

<Dependencies>
    <TargetDeviceFamily Name="Windows.Desktop" MinVersion="10.0.17763.0" MaxVersionTested="10.0.22621.0" />
</Dependencies>
```

## Security Considerations

### Credential Storage

- Use **Windows Credential Vault** (`Windows.Security.Credentials.PasswordVault`)
- Never store credentials in plain text
- Credentials encrypted at rest by Windows

### Server Communication

- Node.js server binds to `127.0.0.1` only (localhost)
- Random port selection (no fixed port conflicts)
- No authentication required (local-only access)

### Process Management

- Server process terminated on app exit
- Graceful shutdown with fallback to force kill
- Process tree cleanup (kill all child processes)

## Performance Optimizations

1. **Virtualization**: Use `ItemsRepeater` for large lists
2. **LRU Cache**: Folder listings cached for 5 minutes
3. **Concurrent Transfers**: Semaphore-based queue (3 uploads, 5 downloads)
4. **Async/Await**: All I/O operations non-blocking
5. **Compiled Bindings**: Use `x:Bind` instead of `Binding`

## Accessibility

- All interactive elements have `AutomationProperties.Name`
- Keyboard shortcuts for major actions
- Screen reader support (Narrator)
- High contrast mode support
- Focus indicators visible

## Internationalization

- All strings in resource files (future-ready)
- Culture-aware date/number formatting
- RTL layout support (not implemented)

## Testing Strategy

### Unit Tests

- ViewModels with mocked services
- API client with mocked HttpClient
- Cache manager with temp directories

### Integration Tests

- End-to-end with real Node.js server
- File upload/download scenarios
- Error handling flows

### UI Tests

- WinUI UI Automation (not implemented in v1)
- Accessibility validation

## Version History

- **1.0.0** - Initial release
  - Bucket browsing
  - File upload/download/delete
  - Transfer queue
  - Debug panel
  - Settings management

## Future Enhancements

- [ ] Multi-account support
- [ ] Drag & drop uploads
- [ ] Search functionality
- [ ] Folder creation
- [ ] Presigned URL generation
- [ ] Transfer resume after app restart
- [ ] Custom themes
- [ ] Localization (i18n)
