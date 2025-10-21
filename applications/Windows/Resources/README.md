# WinUI 3 Resource Dictionaries

This directory contains XAML resource dictionaries for the Cloudflare R2 Object Storage Browser WinUI 3 application.

## Structure

```
Resources/
├── AppResources.xaml        # Master resource dictionary (merge all resources)
├── Icons/
│   └── SegoeIcons.xaml      # Segoe Fluent Icons character codes
└── Styles/
    ├── ButtonStyles.xaml     # Button style definitions
    ├── ColorBrushes.xaml     # Color palette and brushes
    └── ListStyles.xaml       # List and data grid styles
```

## Usage

### 1. Include in App.xaml

Add the master resource dictionary to your `App.xaml` file:

```xaml
<Application
    x:Class="CloudflareR2Browser.App"
    xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">

    <Application.Resources>
        <ResourceDictionary>
            <ResourceDictionary.MergedDictionaries>
                <ResourceDictionary Source="ms-appx:///Resources/AppResources.xaml"/>
            </ResourceDictionary.MergedDictionaries>
        </ResourceDictionary>
    </Application.Resources>
</Application>
```

### 2. Using Button Styles

```xaml
<!-- Icon Button -->
<Button Style="{StaticResource IconButtonStyle}"
        ToolTipService.ToolTip="Refresh">
    <FontIcon Glyph="{StaticResource RefreshIcon}"/>
</Button>

<!-- Accent Button -->
<Button Style="{StaticResource AccentButtonStyle}"
        Content="Upload Files"/>

<!-- Text Button for Breadcrumb -->
<Button Style="{StaticResource TextButtonStyle}"
        Content="Documents"/>

<!-- Toolbar Button -->
<Button Style="{StaticResource ToolbarButtonStyle}">
    <FontIcon Glyph="{StaticResource UploadIcon}"/>
</Button>
```

### 3. Using List Styles

```xaml
<!-- File Browser List -->
<ListView ItemsStyle="{StaticResource DataGridStyle}"
          ItemContainerStyle="{StaticResource ListViewItemStyle}">
    <!-- List items -->
</ListView>

<!-- Grid View for Files -->
<GridView ItemContainerStyle="{StaticResource GridViewItemStyle}">
    <!-- Grid items -->
</GridView>

<!-- Compact List -->
<ListView ItemContainerStyle="{StaticResource CompactListViewItemStyle}">
    <!-- Compact list items -->
</ListView>
```

### 4. Using Colors and Brushes

```xaml
<!-- Brand Colors -->
<Border Background="{StaticResource CloudflareOrangeBrush}"/>
<TextBlock Foreground="{StaticResource CloudflareBlueBrush}"/>

<!-- Transfer Status -->
<ProgressBar Foreground="{StaticResource UploadActiveBrush}"
             Background="{StaticResource UploadBackgroundBrush}"/>

<ProgressBar Foreground="{StaticResource DownloadActiveBrush}"
             Background="{StaticResource DownloadBackgroundBrush}"/>

<!-- Semantic Colors -->
<InfoBar Severity="Success"
         Background="{StaticResource SuccessBackgroundBrush}"/>

<InfoBar Severity="Error"
         Background="{StaticResource ErrorBackgroundBrush}"/>

<!-- Background Layers -->
<Grid Background="{StaticResource WindowBackgroundBrush}">
    <Border Background="{StaticResource CardBackgroundBrush}"/>
</Grid>
```

### 5. Using Icons

```xaml
<!-- FontIcon with Icon Resource -->
<FontIcon FontFamily="Segoe Fluent Icons"
          Glyph="{StaticResource FolderIcon}"
          FontSize="20"/>

<!-- In Buttons -->
<Button>
    <StackPanel Orientation="Horizontal" Spacing="8">
        <FontIcon Glyph="{StaticResource UploadIcon}"/>
        <TextBlock Text="Upload"/>
    </StackPanel>
</Button>

<!-- Status Icons -->
<FontIcon Glyph="{StaticResource SuccessIcon}"
          Foreground="{StaticResource SuccessBrush}"/>

<FontIcon Glyph="{StaticResource ErrorIcon}"
          Foreground="{StaticResource ErrorActiveBrush}"/>
```

## Available Styles

### Button Styles

| Style Name | Purpose | Key Features |
|------------|---------|--------------|
| `IconButtonStyle` | Icon-only button | 32x32, transparent, hover effect |
| `AccentButtonStyle` | Primary action button | Accent color, semi-bold text |
| `TextButtonStyle` | Breadcrumb navigation | Minimal styling, text-focused |
| `ToolbarButtonStyle` | Toolbar icon button | 40x36, hover background |
| `StandardButtonStyle` | Standard button | Border, standard background |

### List Styles

| Style Name | Purpose | Key Features |
|------------|---------|--------------|
| `ListViewItemStyle` | Standard list item | Selection indicator, hover states |
| `GridViewItemStyle` | Grid view item | 120x120, border on selection |
| `DataGridStyle` | Data grid container | Transparent, extended selection |
| `CompactListViewItemStyle` | Dense list item | 32px height, minimal padding |
| `ListViewHeaderStyle` | Column headers | Semi-bold, secondary text color |

## Color Palette

### Brand Colors
- **Cloudflare Orange**: `#FF8800` (Primary brand color)
- **Cloudflare Blue**: `#0078D4` (Secondary brand color)

### Transfer Status Colors
- **Upload**: Blue (`#0078D4`)
- **Download**: Green (`#107C10`)
- **Error**: Red (`#D13438`)
- **Paused**: Orange (`#F7630C`)
- **Completed**: Gray (`#5B5B5B`)

### Semantic Colors
- **Success**: Green (`#107C10`)
- **Warning**: Yellow (`#FFC83D`)
- **Info**: Blue (`#0078D4`)

### File Type Colors
- **Folder**: `#FFB900`
- **Image**: `#E74856`
- **Video**: `#8E8CD8`
- **Audio**: `#00CC6A`
- **Document**: `#0078D4`
- **Archive**: `#CA5010`
- **Code**: `#00B7C3`
- **Generic**: `#737373`

## Theme Support

All resources use WinUI 3 theme-aware resources where possible:

- `{ThemeResource AccentFillColorDefaultBrush}` - Adapts to system accent color
- `{ThemeResource TextFillColorPrimaryBrush}` - Adapts to light/dark theme
- `{ThemeResource SubtleFillColorSecondaryBrush}` - Hover states

Custom colors include both light and dark variants:
- `WindowBackgroundColor` / `WindowBackgroundDarkColor`
- `CardBackgroundColor` / `CardBackgroundDarkColor`
- etc.

## Icon Reference

### Most Used Icons

| Icon Name | Unicode | Visual | Usage |
|-----------|---------|--------|-------|
| `FolderIcon` | E8B7 | 📁 | Folders |
| `FileIcon` | E8A5 | 📄 | Generic files |
| `UploadIcon` | E898 | ⬆️ | Upload action |
| `DownloadIcon` | E896 | ⬇️ | Download action |
| `DeleteIcon` | E74D | 🗑️ | Delete action |
| `RefreshIcon` | E72C | 🔄 | Refresh/reload |
| `SettingsIcon` | E713 | ⚙️ | Settings |
| `SearchIcon` | E721 | 🔍 | Search |
| `BackIcon` | E76B | ← | Navigate back |
| `UpIcon` | E74A | ↑ | Navigate up |

See `Icons/SegoeIcons.xaml` for the complete list of available icons.

## Best Practices

1. **Always use StaticResource** for styles and brushes (not DynamicResource in WinUI 3)
2. **Use ThemeResource** for colors that should adapt to theme changes
3. **Test both light and dark themes** when using custom colors
4. **Use semantic colors** (Success, Warning, Error) for consistent UX
5. **Prefer icon buttons** over text in toolbars for cleaner UI
6. **Apply ToolTip** to all icon-only buttons for accessibility
7. **Use CornerRadius="4"** for consistent rounded corners (Windows 11 style)

## Customization

To customize colors or styles:

1. Edit the respective `.xaml` file in `Styles/` or `Icons/`
2. Use WinUI 3 Fluent Design principles
3. Test in both light and dark themes
4. Ensure proper contrast ratios for accessibility (WCAG 2.1 AA)

## Windows 11 Fluent Design

These resources follow Windows 11 Fluent Design principles:

- **Rounded corners** (4px radius)
- **Subtle hover states** using `SubtleFillColor` brushes
- **Layered backgrounds** (Window → Layer → Card)
- **Segoe Fluent Icons** font family
- **Acrylic and Mica effects** (apply separately in code)
- **Theme-aware colors** that respect system preferences
