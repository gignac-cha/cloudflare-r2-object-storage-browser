# Design System Integration Guide

Quick guide to integrate the new Design System into existing views.

## Step 1: Import Design System

The design system is automatically available - no imports needed! Just use the `DS` namespace.

## Step 2: Update ContentView.swift

Here's how to update your existing ContentView to use the Design System:

### Before (Old Style)
```swift
Text("Cloudflare R2 Object Storage Browser")
    .font(.title)
    .fontWeight(.semibold)
```

### After (Design System)
```swift
Text("Cloudflare R2 Object Storage Browser")
    .font(DS.Typography.displayMedium)
    .foregroundColor(DS.Colors.textPrimary)
```

---

## Quick Replacements

### Colors
```swift
// OLD → NEW
Color.green → DS.Colors.success
Color.red → DS.Colors.error
Color.blue → DS.Colors.info
Color.secondary → DS.Colors.textSecondary
Color(NSColor.windowBackgroundColor) → DS.Colors.windowBackground
Color(NSColor.controlBackgroundColor) → DS.Colors.sidebarBackground
```

### Typography
```swift
// OLD → NEW
.font(.title) → .font(DS.Typography.displayMedium)
.font(.headline) → .font(DS.Typography.headline)
.font(.body) → .font(DS.Typography.body)
.font(.caption) → .font(DS.Typography.caption)
.font(.system(.body, design: .monospaced)) → .font(DS.Typography.bodyMonospaced)
```

### Spacing
```swift
// OLD → NEW
.padding() → .padding(DS.Spacing.md)
.padding(8) → .padding(DS.Spacing.sm)
.padding(16) → .padding(DS.Spacing.lg)
spacing: 8 → spacing: DS.Spacing.sm
```

### Icons
```swift
// OLD → NEW
Image(systemName: "folder.fill") → DSIcon(name: DS.Icons.folder, size: .regular, color: DS.Colors.iconFolder)
Image(systemName: "arrow.clockwise") → DSIcon(name: DS.Icons.refresh, size: .regular)

// Or use specialized components
BucketIcon(size: .regular)
FolderIcon(size: .regular, isOpen: false)
FileIcon(fileType: .image, size: .regular)
```

---

## Example: Updated Bucket List Item

### Before
```swift
HStack {
    Image(systemName: "folder.fill")
        .foregroundColor(.blue)
        .font(.system(size: 14))
    Text(bucket.name)
        .font(.body)
        .fontWeight(.medium)
}
.padding(.horizontal)
.padding(.vertical, 8)
.background(Color(NSColor.controlBackgroundColor).opacity(0.0))
.cornerRadius(4)
```

### After
```swift
HStack(spacing: DS.Spacing.sm) {
    BucketIcon(size: .regular)
    Text(bucket.name)
        .font(DS.Typography.bodyEmphasized)
        .foregroundColor(DS.Colors.textPrimary)
}
.styledListItem(isSelected: selectedBucket == bucket)
```

---

## Example: Updated Header

### Before
```swift
VStack(spacing: 8) {
    Text("Cloudflare R2 Object Storage Browser")
        .font(.title)
        .fontWeight(.semibold)

    HStack(spacing: 8) {
        Circle()
            .fill(serverManager.isRunning ? Color.green : Color.red)
            .frame(width: 8, height: 8)
        Text("Connected on port \(port)")
            .font(.caption)
            .foregroundColor(.secondary)
    }
}
.padding()
.background(Color(NSColor.windowBackgroundColor))
```

### After
```swift
VStack(spacing: DS.Spacing.sm) {
    Text("Cloudflare R2 Object Storage Browser")
        .font(DS.Typography.displayMedium)
        .foregroundColor(DS.Colors.textPrimary)

    HStack(spacing: DS.Spacing.sm) {
        Circle()
            .fill(serverManager.isRunning ? DS.Colors.success : DS.Colors.error)
            .frame(width: 8, height: 8)
        Text("Connected on port \(port)")
            .font(DS.Typography.caption)
            .foregroundColor(DS.Colors.textSecondary)
    }
}
.padding(DS.Spacing.lg)
.toolbarGlass()
```

---

## Example: Updated Sidebar

### Before
```swift
VStack(alignment: .leading, spacing: 0) {
    HStack {
        Text("Buckets")
            .font(.headline)
        Spacer()
        Button(action: listBuckets) {
            Image(systemName: "arrow.clockwise")
        }
    }
    .padding()
    .background(Color(NSColor.controlBackgroundColor))
}
```

### After
```swift
VStack(alignment: .leading, spacing: 0) {
    DSSectionHeader(
        title: "Buckets",
        action: listBuckets,
        actionIcon: DS.Icons.refresh
    )

    // ... content
}
.sidebarGlass()
```

---

## Example: Empty State

### Before
```swift
if buckets.isEmpty {
    Text("No buckets found")
        .font(.caption)
        .foregroundColor(.secondary)
        .padding()
}
```

### After
```swift
if buckets.isEmpty {
    DSEmptyState(
        icon: DS.Icons.bucket,
        title: "No Buckets",
        description: "Connect to R2 to see your buckets",
        action: listBuckets,
        actionTitle: "Refresh"
    )
}
```

---

## Example: Error State

### Before
```swift
if let error = bucketsError {
    Text(error)
        .font(.caption)
        .foregroundColor(.red)
        .padding()
}
```

### After
```swift
if let error = bucketsError {
    DSErrorView(
        error: error,
        retry: listBuckets
    )
}
```

---

## Example: Loading State

### Before
```swift
if isLoadingBuckets {
    HStack {
        Spacer()
        ProgressView()
        Spacer()
    }
    .padding()
}
```

### After
```swift
if isLoadingBuckets {
    DSLoadingIndicator(message: "Loading buckets...")
}
```

---

## Adding Liquid Glass Effects

### Sidebar
```swift
VStack {
    // ... sidebar content
}
.sidebarGlass()  // Translucent sidebar with slight tint
```

### Toolbar
```swift
HStack {
    // ... toolbar buttons
}
.toolbarPadding()
.toolbarGlass()  // Toolbar glass effect
```

### Cards/Panels
```swift
VStack {
    // ... card content
}
.styledCard()  // Includes padding, glass effect, and shadow
```

### Custom Glass
```swift
MyView()
    .glassEffect(thickness: .regular)
    .shadowEffect(.medium)
    .cornerRadius(.medium)
```

---

## Adding Hover Effects

```swift
Button(action: doAction) {
    Label("Action", systemImage: DS.Icons.upload)
}
.styledButton(prominent: true)  // Includes hover effect
```

Or manually:
```swift
MyView()
    .hoverEffect(scale: 1.05)
    .pressEffect()
```

---

## Keyboard Shortcuts (Add to Commands)

```swift
.commands {
    CommandGroup(after: .toolbar) {
        Button("Refresh") {
            refresh()
        }
        .keyboardShortcut("r", modifiers: .command)
    }
}
```

---

## Accessibility

Always add accessibility labels:

```swift
Button(action: delete) {
    DSIcon(name: DS.Icons.delete, size: .regular)
}
.accessibilityLabel("Delete selected items")
.accessibilityHint("Deletes the currently selected items")
```

---

## Testing Your Changes

1. Run the app in Xcode
2. Test in Light mode (Appearance: Light)
3. Test in Dark mode (Appearance: Dark)
4. Test with VoiceOver (Cmd+F5)
5. Test keyboard navigation (Tab, Arrow keys)
6. Test with different accent colors (System Settings → Appearance → Accent Color)

---

## Preview StyleGuide

To see all design system components in action, open `StyleGuide.swift` and run its preview:

```swift
#Preview {
    StyleGuideView()
        .frame(width: 1200, height: 800)
}
```

This shows all colors, typography, spacing, effects, icons, and components in one place.

---

## Common Patterns

### List Item with Selection
```swift
ForEach(items) { item in
    HStack(spacing: DS.Spacing.sm) {
        FileIcon(fileType: .from(fileName: item.name), size: .regular)
        Text(item.name)
            .font(DS.Typography.body)
    }
    .styledListItem(isSelected: selectedItem == item)
    .onTapGesture {
        selectedItem = item
    }
}
```

### Toolbar with Multiple Actions
```swift
HStack(spacing: DS.Spacing.Toolbar.itemSpacing) {
    Button(action: upload) {
        DSIcon(name: DS.Icons.upload, size: .regular)
    }
    .styledToolbarItem()
    .accessibilityLabel("Upload files")

    Button(action: download) {
        DSIcon(name: DS.Icons.download, size: .regular)
    }
    .styledToolbarItem()
    .disabled(selectedItems.isEmpty)
    .accessibilityLabel("Download selected files")

    Divider()
        .frame(height: DS.Spacing.Icon.large)

    Button(action: delete) {
        DSIcon(name: DS.Icons.delete, size: .regular, color: DS.Colors.error)
    }
    .styledToolbarItem()
    .disabled(selectedItems.isEmpty)
    .accessibilityLabel("Delete selected files")
}
.toolbarPadding()
.toolbarGlass()
```

### Card with Content
```swift
VStack(alignment: .leading, spacing: DS.Spacing.md) {
    Text("Card Title")
        .font(DS.Typography.headline)
        .foregroundColor(DS.Colors.textPrimary)

    Text("Card description goes here")
        .font(DS.Typography.body)
        .foregroundColor(DS.Colors.textSecondary)

    HStack {
        Spacer()
        Button("Action") {
            // Do something
        }
        .styledButton(prominent: true)
    }
}
.styledCard()
```

---

## Next Steps

1. Update `ContentView.swift` to use Design System
2. Create new view components (BucketSidebarView, FileListView, etc.)
3. Apply Liquid Glass effects throughout
4. Add accessibility labels to all interactive elements
5. Test in Light/Dark mode
6. Test with VoiceOver
7. Verify keyboard navigation works

---

## Need Help?

- Check `README.md` for full documentation
- View `StyleGuide.swift` for visual examples
- Review individual component files for detailed comments
- Consult Apple HIG: https://developer.apple.com/design/human-interface-guidelines/macos
