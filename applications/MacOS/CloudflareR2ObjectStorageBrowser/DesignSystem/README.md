# Design System - CloudflareR2ObjectStorageBrowser

**Version:** 1.0.0
**Last Updated:** 2025-10-14
**Design Language:** Apple HIG 2025 - Liquid Glass

---

## Overview

This Design System implements Apple's 2025 Liquid Glass design language for the macOS R2 Object Storage Browser application. It provides a comprehensive set of design tokens, components, and patterns that ensure visual consistency, accessibility, and native macOS feel throughout the application.

---

## Architecture

```
DesignSystem/
├── DesignSystem.swift    # Main index & common components
├── Colors.swift          # Dynamic color system
├── Typography.swift      # San Francisco font hierarchy
├── Spacing.swift         # 8pt grid system
├── Effects.swift         # Liquid Glass & visual effects
├── Icons.swift           # SF Symbols 7 icon system
└── README.md            # This file
```

---

## Quick Start

### Import

All design system components are accessible through the `DS` namespace:

```swift
import SwiftUI

// Access design tokens
let color = DS.Colors.brandOrange
let font = DS.Typography.headline
let spacing = DS.Spacing.lg
let icon = DS.Icons.bucket
```

### Basic Usage

```swift
struct MyView: View {
    var body: some View {
        VStack(spacing: DS.Spacing.md) {
            Text("Hello World")
                .font(DS.Typography.headline)
                .foregroundColor(DS.Colors.textPrimary)

            DSIcon(name: DS.Icons.bucket, size: .large, color: DS.Colors.iconBucket)
        }
        .padding(DS.Spacing.lg)
        .styledCard()
    }
}
```

---

## 1. Colors (`Colors.swift`)

### Brand Colors

```swift
DS.Colors.brandOrange  // Cloudflare orange #FA7D35
DS.Colors.brandBlue    // Cloudflare blue #2480DD
```

### Background Colors (Liquid Glass)

```swift
DS.Colors.windowBackground    // Primary window background
DS.Colors.sidebarBackground   // Sidebar translucent background
DS.Colors.contentBackground   // Content area background
DS.Colors.cardBackground      // Card/panel elevated surface
DS.Colors.hoverBackground     // Hover state feedback
DS.Colors.selectedBackground  // Selection state
```

### Text Colors

```swift
DS.Colors.textPrimary      // Main content (highest contrast)
DS.Colors.textSecondary    // Supporting content, metadata
DS.Colors.textTertiary     // Disabled or less important
DS.Colors.textPlaceholder  // Form inputs, empty states
```

### Semantic Colors

```swift
DS.Colors.success  // Green - success states
DS.Colors.error    // Red - error states
DS.Colors.warning  // Yellow - warning states
DS.Colors.info     // Blue - informational states
```

### Icon Colors

```swift
DS.Colors.iconDefault  // Default icon tint
DS.Colors.iconActive   // Active/selected icons
DS.Colors.iconBucket   // Bucket icon color
DS.Colors.iconFolder   // Folder icon color
DS.Colors.iconFile     // File icon color
```

### File Type Colors

```swift
DS.Colors.fileTypeImage     // Pink for images
DS.Colors.fileTypeVideo     // Purple for videos
DS.Colors.fileTypeDocument  // Blue for documents
DS.Colors.fileTypeArchive   // Gray for archives
DS.Colors.fileTypeCode      // Green for code
DS.Colors.fileTypeAudio     // Orange for audio
```

**Dynamic Mode Support:** All colors automatically adapt to Light/Dark mode.

---

## 2. Typography (`Typography.swift`)

### Display Styles (Large hero text)

```swift
DS.Typography.displayLarge   // 34pt Bold - App title, hero
DS.Typography.displayMedium  // 28pt Bold - Section headers
DS.Typography.displaySmall   // 22pt Semibold - Subsection headers
```

### Headline Styles

```swift
DS.Typography.headline     // 17pt Semibold - Panel titles
DS.Typography.subheadline  // 15pt Medium - Secondary headers
```

### Body Styles

```swift
DS.Typography.body              // 13pt Regular - Default text
DS.Typography.bodyEmphasized    // 13pt Medium - Important text
DS.Typography.bodyMonospaced    // 13pt Monospaced - Code, paths
```

### Caption Styles

```swift
DS.Typography.caption            // 11pt Regular - Metadata
DS.Typography.captionEmphasized  // 11pt Medium - Important metadata
DS.Typography.caption2           // 10pt Regular - Very small text
```

### Specialized Styles

```swift
DS.Typography.monospacedLarge  // 14pt Monospaced - API responses
DS.Typography.monospacedSmall  // 11pt Monospaced - Hex viewer
DS.Typography.numeric          // 13pt Tabular - File sizes, counts
DS.Typography.button           // 13pt Regular - Buttons
DS.Typography.buttonProminent  // 13pt Semibold - Primary buttons
```

### View Modifiers

```swift
Text("Hello")
    .typographyHeadline()        // Apply headline style
    .typographyBody(emphasized: true)  // Apply emphasized body
    .typographyCaption()         // Apply caption style
    .typographyMonospaced(size: .body)  // Apply monospaced style
```

---

## 3. Spacing (`Spacing.swift`)

### Base Spacing (8pt Grid)

```swift
DS.Spacing.xxs   // 2pt - Minimal spacing
DS.Spacing.xs    // 4pt - Extra small
DS.Spacing.sm    // 8pt - Small
DS.Spacing.md    // 12pt - Medium (default)
DS.Spacing.lg    // 16pt - Large
DS.Spacing.xl    // 24pt - Extra large
DS.Spacing.xxl   // 32pt - 2X large
DS.Spacing.xxxl  // 48pt - 3X large
```

### Component Spacing

```swift
DS.Spacing.Sidebar.min        // 200
DS.Spacing.Sidebar.ideal      // 250
DS.Spacing.Sidebar.max        // 400

DS.Spacing.List.itemPadding   // EdgeInsets for list items
DS.Spacing.List.itemSpacing   // 0 (no gap between items)

DS.Spacing.Card.padding       // EdgeInsets for cards
DS.Spacing.Card.spacing       // 16 (gap between cards)

DS.Spacing.Toolbar.height     // 40
DS.Spacing.Toolbar.padding    // EdgeInsets for toolbar

DS.Spacing.Button.padding     // EdgeInsets for buttons
DS.Spacing.Button.minHeight   // 28
```

### Icon Sizes

```swift
DS.Spacing.Icon.small       // 14pt - List items, inline
DS.Spacing.Icon.regular     // 16pt - Buttons, toolbar
DS.Spacing.Icon.large       // 20pt - Prominent actions
DS.Spacing.Icon.extraLarge  // 24pt - Headers
DS.Spacing.Icon.massive     // 48pt - Hero sections
```

### Corner Radius

```swift
DS.Spacing.CornerRadius.small       // 4pt - Chips, tags
DS.Spacing.CornerRadius.medium      // 8pt - Buttons, cards
DS.Spacing.CornerRadius.large       // 12pt - Panels, modals
DS.Spacing.CornerRadius.extraLarge  // 16pt - Prominent surfaces
DS.Spacing.CornerRadius.continuous  // macOS continuous corners
```

### Border Width

```swift
DS.Spacing.Border.thin     // 0.5pt - Subtle borders
DS.Spacing.Border.regular  // 1pt - Standard borders
DS.Spacing.Border.thick    // 2pt - Emphasized borders
```

### View Modifiers

```swift
MyView()
    .cardPadding()           // Apply standard card padding
    .toolbarPadding()        // Apply toolbar padding
    .listItemPadding()       // Apply list item padding
    .buttonPadding(prominent: true)  // Apply button padding
    .cornerRadius(.medium)   // Apply corner radius
    .fullWidth(alignment: .leading)  // Full width layout
```

---

## 4. Effects (`Effects.swift`)

### Liquid Glass Materials

```swift
MyView()
    .glassEffect(thickness: .regular)  // Apply Liquid Glass effect
    .sidebarGlass()                    // Sidebar glass style
    .toolbarGlass()                    // Toolbar glass style
    .cardGlass()                       // Card glass style
    .popoverGlass()                    // Popover glass style
```

### Material Thickness Levels

```swift
DS.Effects.MaterialThickness.ultraThin   // Most transparent
DS.Effects.MaterialThickness.thin
DS.Effects.MaterialThickness.regular     // Default
DS.Effects.MaterialThickness.thick
DS.Effects.MaterialThickness.ultraThick  // Most opaque
```

### Vibrancy Levels

```swift
Text("Vibrant")
    .glassVibrancy(level: .primary)    // Primary vibrancy
    .glassVibrancy(level: .secondary)  // Secondary vibrancy
    .glassVibrancy(level: .tertiary)   // Tertiary vibrancy
    .glassVibrancy(level: .separator)  // Separator vibrancy
```

### Shadow Effects

```swift
MyView()
    .shadowEffect(.subtle)     // Minimal depth
    .shadowEffect(.medium)     // Standard elevation
    .shadowEffect(.prominent)  // High elevation
    .shadowEffect(.large)      // Maximum depth
    .innerShadow()             // Inner shadow (pressed state)
    .glowEffect(color: .blue)  // Glow effect (focus state)
```

### Interaction Effects

```swift
MyButton()
    .hoverEffect(scale: 1.05)        // Scale on hover
    .pressEffect()                    // Scale down on press
    .selectionEffect(isSelected: true)  // Selection styling
```

### Gradients

```swift
DS.Gradients.glassHighlight  // Subtle glass highlight
DS.Gradients.shimmer         // Shimmer for loading
DS.Gradients.progress        // Progress bar gradient
DS.Gradients.success         // Success gradient
DS.Gradients.error           // Error gradient
```

### Animation Presets

```swift
withAnimation(DS.Animations.quick) { ... }    // 0.3s spring
withAnimation(DS.Animations.smooth) { ... }   // 0.25s easeInOut
withAnimation(DS.Animations.bouncy) { ... }   // 0.5s spring
withAnimation(DS.Animations.gentle) { ... }   // 0.4s easeInOut
withAnimation(DS.Animations.snappy) { ... }   // 0.15s easeInOut
```

### Transitions

```swift
MyView()
    .transition(.slideFromBottom)   // Slide from bottom with fade
    .transition(.scaleAndFade)      // Scale with fade
    .transition(.slideFromTrailing) // Slide from trailing
```

---

## 5. Icons (`Icons.swift`)

### SF Symbols 7 (6,900+ icons)

#### Storage & Objects

```swift
DS.Icons.bucket          // "tray.fill"
DS.Icons.folder          // "folder.fill"
DS.Icons.file            // "doc.fill"
DS.Icons.fileImage       // "photo.fill"
DS.Icons.fileVideo       // "video.fill"
DS.Icons.fileCode        // "curlybraces"
```

#### Actions

```swift
DS.Icons.upload          // "arrow.up.doc.fill"
DS.Icons.download        // "arrow.down.doc.fill"
DS.Icons.delete          // "trash.fill"
DS.Icons.refresh         // "arrow.clockwise"
DS.Icons.rename          // "pencil"
DS.Icons.copy            // "doc.on.doc.fill"
```

#### Search & Filter

```swift
DS.Icons.search          // "magnifyingglass"
DS.Icons.filter          // "line.3.horizontal.decrease.circle"
DS.Icons.sortAscending   // "arrow.up.arrow.down"
DS.Icons.clear           // "xmark.circle.fill"
```

#### Status

```swift
DS.Icons.success         // "checkmark.circle.fill"
DS.Icons.error           // "exclamationmark.triangle.fill"
DS.Icons.info            // "info.circle.fill"
DS.Icons.loading         // "arrow.clockwise.circle.fill"
```

### Icon Components

```swift
// Basic icon
DSIcon(name: DS.Icons.bucket, size: .large, color: DS.Colors.iconBucket)

// Specialized icons
BucketIcon(size: .large)
FolderIcon(size: .large, isOpen: true)
FileIcon(fileType: .image, size: .regular)
StatusIcon(status: .success, size: .regular)
TransferIcon(direction: .upload, size: .regular)
```

### File Type Detection

```swift
// From extension
let fileType = FileIcon.FileType.from(extension: "jpg")  // .image

// From filename
let fileType = FileIcon.FileType.from(fileName: "photo.jpg")  // .image
```

---

## 6. Common Components (`DesignSystem.swift`)

### Section Header

```swift
DSSectionHeader(
    title: "Buckets",
    action: { refresh() },
    actionIcon: DS.Icons.refresh
)
```

### Empty State

```swift
DSEmptyState(
    icon: DS.Icons.bucket,
    title: "No Buckets",
    description: "Add a bucket to get started",
    action: { addBucket() },
    actionTitle: "Add Bucket"
)
```

### Loading Indicator

```swift
DSLoadingIndicator(message: "Loading buckets...")
```

### Error View

```swift
DSErrorView(
    error: "Failed to load buckets",
    retry: { loadBuckets() }
)
```

### Badge

```swift
DSBadge("3", color: DS.Colors.info)
DSBadge("New", color: DS.Colors.success)
```

### Chip (Filter)

```swift
DSChip(text: "Images", isSelected: true) {
    toggleFilter(.images)
}
```

### Divider with Text

```swift
DSDividerWithText(text: "OR")
```

---

## Design Patterns

### Card Layout

```swift
VStack(spacing: DS.Spacing.md) {
    Text("Card Title")
        .font(DS.Typography.headline)

    Text("Card content here")
        .font(DS.Typography.body)
}
.styledCard()
```

### List Item

```swift
HStack(spacing: DS.Spacing.md) {
    BucketIcon(size: .regular)
    Text("my-bucket")
        .font(DS.Typography.body)
}
.styledListItem(isSelected: isSelected)
```

### Button

```swift
Button(action: upload) {
    Label("Upload", systemImage: DS.Icons.upload)
}
.styledButton(prominent: true)
```

### Toolbar

```swift
HStack(spacing: DS.Spacing.Toolbar.itemSpacing) {
    Button(action: back) {
        DSIcon(name: DS.Icons.back, size: .regular)
    }
    .styledToolbarItem()

    Button(action: forward) {
        DSIcon(name: DS.Icons.forward, size: .regular)
    }
    .styledToolbarItem()
}
.toolbarPadding()
.toolbarGlass()
```

---

## Accessibility

### Color Contrast

All text colors meet WCAG AA contrast requirements:
- Primary text: 7:1 contrast ratio
- Secondary text: 4.5:1 contrast ratio
- Tertiary text: 3:1 contrast ratio (large text only)

### VoiceOver Support

Add accessibility labels to all interactive elements:

```swift
Button(action: delete) {
    DSIcon(name: DS.Icons.delete, size: .regular)
}
.accessibilityLabel("Delete selected items")
.accessibilityHint("Deletes the currently selected items")
```

### Keyboard Navigation

Support standard macOS keyboard shortcuts:
- `Cmd+F` - Focus search
- `Cmd+R` - Refresh
- `Cmd+[` / `Cmd+]` - Back/Forward
- `Cmd+↑` - Go up to parent
- `Space` - Quick Look
- `Cmd+Delete` - Delete selected

### Reduced Motion

Respect user's reduced motion preference:

```swift
@Environment(\.accessibilityReduceMotion) var reduceMotion

withAnimation(reduceMotion ? .none : DS.Animations.smooth) {
    // Animate
}
```

### High Contrast Mode

Colors automatically adapt to high contrast mode through system color APIs.

---

## Best Practices

### ✅ Do

- Use semantic color names (`DS.Colors.success` not `Color.green`)
- Apply spacing from the 8pt grid system
- Use SF Symbols for all icons
- Apply Liquid Glass effects to panels and sidebars
- Support Light/Dark mode automatically
- Add accessibility labels to interactive elements
- Use standard animation durations (0.2-0.3s)

### ❌ Don't

- Hardcode color values (`Color.red` instead of `DS.Colors.error`)
- Use arbitrary spacing values (13, 19, etc.)
- Use custom icons when SF Symbols exist
- Apply excessive blur or transparency
- Override system accent color
- Ignore VoiceOver support
- Create jarring animations (>0.5s or abrupt)

---

## Performance Tips

1. **Lazy Loading**: Use `LazyVStack`/`LazyHStack` for long lists
2. **Image Caching**: Cache thumbnail images to avoid reloading
3. **Debounce Search**: Use 300ms debounce for search input
4. **State Management**: Use proper `@State`, `@Binding`, `@StateObject`
5. **View Updates**: Minimize view body re-evaluations with `.equatable()`

---

## Testing Checklist

- [ ] Test in Light mode
- [ ] Test in Dark mode
- [ ] Test with different system accent colors
- [ ] Test with VoiceOver enabled
- [ ] Test with keyboard navigation only
- [ ] Test with reduced motion enabled
- [ ] Test with high contrast mode
- [ ] Test on Retina and non-Retina displays
- [ ] Test with Dynamic Type (larger text sizes)
- [ ] Test on Intel and Apple Silicon Macs

---

## Updates & Versioning

**Version 1.0.0** (2025-10-14)
- Initial release
- Full Liquid Glass implementation
- SF Symbols 7 support
- 8pt grid system
- Accessibility support

---

## Resources

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/macos)
- [SF Symbols 7](https://developer.apple.com/sf-symbols/)
- [SwiftUI Documentation](https://developer.apple.com/documentation/swiftui)
- [WWDC 2025: Meet Liquid Glass](https://developer.apple.com/videos/play/wwdc2025/219/)
- [Accessibility Guidelines](https://developer.apple.com/accessibility/)

---

## Support

For questions or issues with the Design System:
1. Check this README
2. Review code comments in individual files
3. Examine preview examples in each file
4. Consult Apple HIG for macOS

---

**Maintained by:** Development Team
**Last Updated:** 2025-10-14
