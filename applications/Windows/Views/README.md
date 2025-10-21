# WinUI 3 Views - Implementation Guide

This directory contains all XAML views for the Cloudflare R2 Object Storage Browser Windows application, ported from the macOS SwiftUI design.

## Created Files

### 1. BucketSidebarView
- **Files**: `BucketSidebarView.xaml`, `BucketSidebarView.xaml.cs`
- **Purpose**: Left sidebar displaying the list of R2 buckets
- **Features**:
  - Header with refresh button
  - ListView with bucket items
  - Folder icon + bucket name (Consolas font) + creation date
  - Accent color selection highlighting
  - Loading state with ProgressRing
  - Empty state message
  - Error state with retry button
- **ViewModel**: `BucketSidebarViewModel`
- **Bindings**: `x:Bind` for performance

### 2. FileListView
- **Files**: `FileListView.xaml`, `FileListView.xaml.cs`
- **Purpose**: Main file browser displaying objects and folders
- **Features**:
  - Custom ListView with column headers (Icon, Name, Size, Modified, Type)
  - Multi-select support (Extended selection mode)
  - Context menu (Preview, Download, Copy Path, Delete)
  - Double-click to open folders
  - Loading overlay
  - Empty state
  - Consolas font for file names and paths
- **ViewModel**: `FileListViewModel`
- **Interactions**: Click handler for folder navigation

### 3. ToolbarView
- **Files**: `ToolbarView.xaml`, `ToolbarView.xaml.cs`
- **Purpose**: Top toolbar with navigation and action buttons
- **Features**:
  - Navigation group: Back, Forward, Up (with enabled states)
  - Action group: Upload (accent), Download, Delete (red text)
  - Refresh button
  - Selection counter badge (right-aligned)
  - All buttons use SubtleButtonStyle
  - Proper spacing with separators
- **ViewModel**: `FileListViewModel`
- **Height**: 56px (8pt grid aligned)

### 4. BreadcrumbView
- **Files**: `BreadcrumbView.xaml`, `BreadcrumbView.xaml.cs`
- **Purpose**: Path navigation breadcrumb
- **Features**:
  - WinUI 3 BreadcrumbBar control
  - Home icon → bucket name → folder segments
  - Clickable segments for navigation
  - Consolas font
  - Auto-updates on path changes
- **ViewModel**: `FileListViewModel`
- **Height**: 48px (8pt grid aligned)

### 5. TransferQueuePanel
- **Files**: `TransferQueuePanel.xaml`, `TransferQueuePanel.xaml.cs`
- **Purpose**: Transfer queue with progress tracking
- **Features**:
  - Header with active count badge
  - Clear Completed/Failed buttons
  - TabView with 3 tabs: Active, Completed, Failed
  - Transfer item template with:
    - Type icon (upload/download)
    - File name + remote path (Consolas)
    - Status badge (colored)
    - Progress bar (for active)
    - Speed + ETA text
    - Action buttons: Pause/Resume/Cancel/Retry
- **ViewModel**: `TransferManagerViewModel`
- **Design**: Windows 11 Fluent with rounded corners

### 6. DebugPanelView
- **Files**: `DebugPanelView.xaml`, `DebugPanelView.xaml.cs`
- **Purpose**: Debug panel for API responses and server logs
- **Features**:
  - Header with search box, copy, export, close buttons
  - TabView with 2 tabs: API Response, Server Logs
  - API Response tab:
    - Method badge (GET/POST/DELETE colored)
    - Endpoint + timestamp + duration
    - Status code
    - Response body (monospace, scrollable, selectable)
  - Server Logs tab:
    - Log lines with line numbers
    - Monospace font
    - Search filter support
- **ViewModel**: `DebugPanelViewModel`
- **Design**: Console-like appearance

## Design System

### Typography
- **Headings**: `SubtitleTextBlockStyle` (18px)
- **Body**: 14px default
- **Captions**: `CaptionTextBlockStyle` (12px)
- **Code/Paths**: Consolas font family

### Spacing (8pt Grid)
- Padding: 8, 12, 16, 24
- Spacing: 4, 8, 12, 16
- Control heights: 32, 40, 48, 56

### Colors
- **Backgrounds**:
  - `LayerFillColorDefaultBrush` (main background)
  - `CardBackgroundFillColorDefaultBrush` (elevated surfaces)
- **Borders**: `DividerStrokeColorDefaultBrush`
- **Text**:
  - `TextFillColorPrimaryBrush` (primary)
  - `TextFillColorSecondaryBrush` (secondary)
  - `TextFillColorTertiaryBrush` (disabled/hints)
- **Accent**: `AccentFillColorDefaultBrush`
- **Status Colors**:
  - Success: `SystemFillColorSuccessBrush`
  - Critical: `SystemFillColorCriticalBrush`

### Corner Radius
- Small: 4px
- Medium: 6px
- Large: 8px
- Pills: 12px

### Icons (Segoe Fluent Icons)
- Folder: `&#xE838;`
- Refresh: `&#xE72C;`
- Upload: `&#xE898;`
- Download: `&#xE896;`
- Delete: `&#xE74D;`
- Back: `&#xE72B;`
- Forward: `&#xE72A;`
- Up: `&#xE74A;`
- Success: `&#xE73E;`
- Error: `&#xE783;`

## Accessibility

All views implement proper accessibility:
- `AutomationProperties.Name` on all interactive elements
- `AutomationProperties.HeadingLevel` on section headers
- Keyboard navigation support
- VoiceOver-friendly structure
- High contrast mode compatible

## Integration Steps

### 1. Update MainWindow.xaml
Replace placeholder comments with actual views:

```xml
<!-- Left: Bucket Sidebar -->
<local:BucketSidebarView x:Name="BucketSidebar" Grid.Column="0"/>

<!-- Right: Content Area -->
<local:ToolbarView x:Name="Toolbar" Grid.Row="0"/>
<local:BreadcrumbView x:Name="Breadcrumb" Grid.Row="1"/>
<local:FileListView x:Name="FileList" Grid.Row="2"/>

<!-- Conditionally visible panels -->
<local:TransferQueuePanel x:Name="TransferQueue"
                          Grid.Row="3"
                          Visibility="{x:Bind ViewModel.IsTransferQueueVisible, Mode=OneWay}"/>
<local:DebugPanelView x:Name="DebugPanel"
                      Grid.Row="3"
                      Visibility="{x:Bind ViewModel.IsDebugPanelVisible, Mode=OneWay}"/>
```

### 2. Initialize Views in MainWindow.xaml.cs

```csharp
public MainWindow()
{
    this.InitializeComponent();

    // Get ViewModels from DI container
    var bucketViewModel = App.Services.GetRequiredService<BucketSidebarViewModel>();
    var fileListViewModel = App.Services.GetRequiredService<FileListViewModel>();
    var transferViewModel = App.Services.GetRequiredService<TransferManagerViewModel>();
    var debugViewModel = App.Services.GetRequiredService<DebugPanelViewModel>();

    // Initialize views
    BucketSidebar.Initialize(bucketViewModel);
    FileList.Initialize(fileListViewModel);
    Toolbar.Initialize(fileListViewModel);
    Breadcrumb.Initialize(fileListViewModel);
    TransferQueue.Initialize(transferViewModel);
    DebugPanel.Initialize(debugViewModel);

    // Wire up events
    bucketViewModel.BucketSelected += async (s, bucket) =>
    {
        await fileListViewModel.SetBucketAsync(bucket.Name);
    };
}
```

### 3. Add Namespace to MainWindow.xaml

```xml
xmlns:views="using:CloudflareR2Browser.Views"
```

### 4. Update Control References

```xml
<views:BucketSidebarView x:Name="BucketSidebar" Grid.Column="0"/>
<views:ToolbarView x:Name="Toolbar" Grid.Row="0"/>
<!-- etc. -->
```

## Converters Required

All converters are already implemented in `/Converters/`:
- `BoolToVisibilityConverter`
- `BytesToStringConverter`
- `DateToRelativeConverter`
- `NullToVisibilityConverter`
- `FileIconConverter`
- `StatusToColorConverter`
- `ProgressToStringConverter`

## Missing Styles

The following styles need to be defined in App.xaml or a ResourceDictionary:
- `SubtleButtonStyle` - Transparent button with hover effect
- `AccentButtonStyle` - Already exists in WinUI 3

Example SubtleButtonStyle:

```xml
<Style x:Key="SubtleButtonStyle" TargetType="Button">
    <Setter Property="Background" Value="Transparent"/>
    <Setter Property="BorderThickness" Value="0"/>
    <Setter Property="Padding" Value="8"/>
    <Setter Property="CornerRadius" Value="4"/>
</Style>
```

## Testing Checklist

- [ ] BucketSidebarView loads bucket list
- [ ] BucketSidebarView handles selection
- [ ] FileListView displays files and folders
- [ ] FileListView supports multi-select
- [ ] FileListView context menu works
- [ ] ToolbarView navigation buttons work
- [ ] ToolbarView shows selection count
- [ ] BreadcrumbView updates on navigation
- [ ] BreadcrumbView click navigation works
- [ ] TransferQueuePanel shows active transfers
- [ ] TransferQueuePanel progress updates
- [ ] DebugPanelView displays API calls
- [ ] DebugPanelView search filter works

## Performance Notes

- All views use `x:Bind` for compile-time binding (faster than `Binding`)
- ListView virtualization is enabled by default
- Large lists use incremental loading where appropriate
- Progress updates are throttled to avoid UI thread saturation

## Dark Mode Support

All views automatically support dark mode through theme-aware brushes:
- `ThemeResource` used for all colors
- No hardcoded color values
- System accent color integration

## Future Enhancements

- [ ] Add drag-and-drop upload to FileListView
- [ ] Add column sorting to FileListView
- [ ] Add keyboard shortcuts overlay
- [ ] Add preview pane for images/text files
- [ ] Add bulk operations UI
- [ ] Add search/filter bar to FileListView
