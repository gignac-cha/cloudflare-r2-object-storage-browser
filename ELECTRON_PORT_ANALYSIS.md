# macOS to Electron Port Analysis
# Cloudflare R2 Object Storage Browser

**Generated:** 2025-10-15
**Source:** `/applications/MacOS/CloudflareR2ObjectStorageBrowser/`
**Target:** Electron Application

---

## Executive Summary

This document provides a comprehensive analysis of the macOS SwiftUI application and identifies all UI features, components, and functionalities that need to be ported to Electron. The application is a full-featured R2 object storage browser with file management, transfer queues, debugging capabilities, and macOS-specific integrations.

---

## Table of Contents

1. [Application Architecture](#application-architecture)
2. [View Components](#view-components)
3. [State Management](#state-management)
4. [macOS-Specific Features](#macos-specific-features)
5. [Data Models](#data-models)
6. [Services & API Integration](#services--api-integration)
7. [Design System](#design-system)
8. [Electron Implementation Recommendations](#electron-implementation-recommendations)

---

## Application Architecture

### Main Application Entry Point

**Component:** `CloudflareR2ObjectStorageBrowserApp`
**File:** `/CloudflareR2ObjectStorageBrowserApp.swift`

**Functionality:**
- SwiftUI App lifecycle management
- Initializes `ServerManager` and `SettingsManager` as StateObjects
- Starts Node.js API server on launch (0.5s delay)
- Custom quit command that stops server before termination

**macOS-Specific APIs:**
- `@StateObject` for state management
- `WindowGroup` for window management
- `.commands` modifier for menu customization
- `NSApplication.shared.terminate()`

**Electron Equivalent:**
- Use Electron's `app.whenReady()` for initialization
- Child process management for Node.js server
- IPC between main and renderer processes
- Custom menu with `Menu.buildFromTemplate()`
- `app.quit()` with cleanup hooks

---

## View Components

### 1. ContentView (Main Window)

**Component:** `ContentView`
**File:** `/ContentView.swift`
**Lines:** 880

**Functionality:**
- Main application window with split-pane layout
- Manages all application state
- Coordinates between sidebar, toolbar, file list, and panels
- Handles navigation history (back/forward)
- Server connection status display
- Modal sheets for settings and QuickLook

**UI Structure:**
```
┌─────────────────────────────────────────┐
│ Header (Server Status)                  │
├─────────────┬───────────────────────────┤
│             │ Toolbar (Navigation/Actions)
│  Bucket     ├───────────────────────────┤
│  Sidebar    │ Breadcrumb Navigation     │
│             ├───────────────────────────┤
│             │                           │
│             │  File List (Table)        │
│             │                           │
├─────────────┴───────────────────────────┤
│ Transfer Queue Panel (Collapsible)      │
├─────────────────────────────────────────┤
│ Debug Panel (Collapsible)               │
└─────────────────────────────────────────┘
```

**State Management:**
- `@EnvironmentObject` for shared managers
- 20+ `@State` properties for local state
- Navigation history array with index tracking
- Selection tracking with `Set<String>`

**macOS-Specific APIs:**
- `HSplitView` and `VSplitView` for resizable panes
- `Material.thin` and `Material.regular` for blur effects
- `.toolbar` modifier for window toolbar
- `.sheet` modifier for modal presentations
- `.overlay` for loading overlay
- `NSAlert` for dialogs
- `NSSavePanel` and `NSOpenPanel` for file dialogs

**Key Features:**
1. **Auto-loading:** Buckets load automatically when server ready + credentials configured
2. **Loading Overlay:** Full-screen overlay with progress and cancel
3. **Navigation History:** Browser-style back/forward navigation
4. **File Operations:** Download (to cache), Save As, Preview, Delete
5. **Batch Operations:** Multi-select and batch delete with confirmation
6. **Transfer Queue:** Shows/hides transfer panel with animation
7. **Debug Panel:** Shows/hides debug panel with animation

**Electron Equivalent:**
- React/Vue component with split-pane library
- Use CSS `backdrop-filter` for blur effects
- Electron dialog API (`dialog.showOpenDialog`, `dialog.showSaveDialog`)
- Custom modal overlays with React portals
- State management with React hooks or Vuex/Pinia

---

### 2. ToolbarView

**Component:** `ToolbarView` + `ToolbarButton`
**File:** `/Views/ToolbarView.swift`
**Lines:** 268

**Functionality:**
- Navigation controls (Back, Forward, Up)
- Action buttons (Upload, Download, Delete, Refresh)
- Selection counter badge
- Keyboard shortcuts support
- Hover effects and disabled states

**UI Elements:**
- **Navigation:** Back (⌘[), Forward (⌘]), Up (⌘↑)
- **Actions:** Upload, Download, Delete, Refresh (⌘R)
- **Visual Feedback:** Hover states, disabled states, badges

**macOS-Specific APIs:**
- `Material.thin` background
- `.onHover` modifier for hover effects
- `.keyboardShortcut` for shortcuts
- `.help()` for tooltips
- `Color.accentColor` and `.primary`
- `RoundedRectangle` with continuous corners

**Electron Equivalent:**
- HTML/CSS toolbar with flexbox layout
- CSS `:hover` pseudo-class
- Electron `globalShortcut` API or keyboard event handlers
- HTML `title` attribute for tooltips
- CSS variables for theme colors
- CSS `border-radius` for rounded corners

---

### 3. BucketSidebarView

**Component:** `BucketSidebarView` + `BucketRowView`
**File:** `/Views/BucketSidebarView.swift`
**Lines:** 231

**Functionality:**
- Lists all R2 buckets
- Shows loading, error, and empty states
- Refresh button with loading indicator
- Selection highlighting
- Bucket creation date display

**UI States:**
1. **Loading:** Progress indicator + "Loading buckets..."
2. **Error:** Error icon + message + "Try Again" button
3. **Empty:** Tray icon + "No buckets found" message
4. **Loaded:** List of buckets with icons and dates

**macOS-Specific APIs:**
- `LazyVStack` for list performance
- `ScrollView` for scrollable content
- `Material.regular` background
- `.onHover` for row hover effects
- SF Symbols icons (`tray.fill`)
- Accessibility traits (`.isSelected`, `.isHeader`)

**Electron Equivalent:**
- Virtual scrolling list (react-window or similar)
- CSS overflow scrolling
- CSS hover effects with transitions
- Icon font or SVG icons
- ARIA attributes for accessibility

---

### 4. FileListView

**Component:** `FileListView`
**File:** `/Views/FileListView.swift`
**Lines:** 405

**Functionality:**
- Multi-column table view (Icon, Name, Size, Modified, Type)
- Folders displayed before files
- Multi-select support
- Context menus (right-click)
- Double-click to open folders/preview files
- Drag-and-drop support (itemProvider)
- File type icons
- Cached file indicators
- Empty state

**Table Columns:**
1. **Icon:** 40px - File type icon or folder icon
2. **Name:** 200-∞px - File/folder name + cache indicator
3. **Size:** 100px - Human-readable size (or "—" for folders)
4. **Modified:** 150px - Relative time (e.g., "2h ago")
5. **Type:** 120px - File type category

**Context Menu Features:**
- **Folder:** Open, Delete Folder and Contents
- **File:** Quick Look, Download, Save As (if cached), Open in Browser, Copy Path, Copy URL, Get Info, Delete
- **Multi-select:** Download Selected, Delete Selected (N items)

**macOS-Specific APIs:**
- `Table` view with `TableColumn`
- `.contextMenu` with `primaryAction`
- `NSPasteboard` for clipboard
- SF Symbols for file type icons
- `ByteCountFormatter` for file sizes
- `RelativeDateTimeFormatter` for dates

**File Type Icons Mapping:**
```swift
Images:      photo
Videos:      video
Documents:   doc.richtext, doc.text, doc.plaintext
Archives:    doc.zipper
Code:        curlybraces, chevron.left.forwardslash.chevron.right, swift
Audio:       waveform
Default:     doc
```

**Electron Equivalent:**
- React Table library (TanStack Table, AG Grid, etc.)
- Context menu library or custom implementation
- Electron clipboard API
- Icon library (Lucide, Heroicons, etc.)
- JavaScript `Intl.NumberFormat` and `Intl.RelativeTimeFormat`
- HTML5 drag-and-drop API

---

### 5. BreadcrumbView

**Component:** `BreadcrumbView`
**File:** `/Views/BreadcrumbView.swift`
**Lines:** 133

**Functionality:**
- Clickable path navigation (bucket > folder1 > folder2)
- Home icon for root bucket
- Chevron separators
- Horizontal scrolling for long paths
- Hover effects on segments
- Accessibility support

**UI Structure:**
```
🗂️ my-bucket > projects > 2024 > reports
```

**macOS-Specific APIs:**
- `ScrollView(.horizontal)` for overflow
- `NSCursor.pointingHand` for hover cursor
- Monospaced font for path display
- `Material.thin` background

**Electron Equivalent:**
- Horizontal scrolling div with CSS
- CSS `cursor: pointer` on hover
- Monospace font via CSS
- CSS blur effect or solid background

---

### 6. TransferQueuePanel

**Component:** `TransferQueuePanel` + `TransferTaskRow` + `StatusBadge` + `SectionHeader`
**File:** `/Views/TransferQueuePanel.swift`
**Lines:** 431

**Functionality:**
- Shows active, completed, and failed transfers
- Upload, download, and delete operations
- Progress bars and percentage indicators
- Speed and time remaining estimates
- Pause, resume, cancel, retry actions
- Clear completed/failed buttons
- Empty state

**Transfer Task Information:**
- **Icon:** Colored circle (blue=upload, green=download, red=delete)
- **File Name:** Display name or "N folders, M files"
- **Status Badge:** Queued, Uploading, Downloading, Deleting, Paused, Completed, Failed, Cancelled
- **Progress:** Percentage + transferred/total size
- **Speed:** MB/s or items/s
- **Time Remaining:** Estimated time (e.g., "2m 30s")

**Sections:**
1. **Active:** Currently running transfers with progress bars
2. **Completed:** Successful transfers (limited to 50)
3. **Failed:** Failed transfers with error messages (limited to 50)

**macOS-Specific APIs:**
- `@ObservedObject` for ViewModel binding
- `GeometryReader` for progress bar width
- `.blue.gradient` for progress fill
- Menu for clear actions

**Electron Equivalent:**
- React/Vue components with props
- CSS grid/flexbox for layout
- CSS linear-gradient for progress bars
- Dropdown menu component

---

### 7. DebugPanelView

**Component:** `DebugPanelView` + `APIResponseView` + `ServerLogsView` + `TabButton`
**File:** `/Views/DebugPanelView.swift`
**Lines:** 443

**Functionality:**
- Two tabs: API Response and Server Logs
- **API Response Tab:**
  - Shows all API requests/responses
  - Method badges (GET, POST, PUT, DELETE) with colors
  - Endpoint paths
  - JSON response bodies
  - Timestamps
  - Copy to clipboard
  - Clear history
  - Auto-scroll to latest

- **Server Logs Tab:**
  - Real-time server logs
  - Search/filter functionality
  - Auto-scroll toggle
  - Export logs to file
  - Clear logs
  - Line numbers

**macOS-Specific APIs:**
- `ScrollViewReader` for programmatic scrolling
- `TextField` with search icon
- `Toggle` for auto-scroll
- `NSPasteboard` for copy
- `NSSavePanel` for export
- Monospaced font for logs
- `.textSelection(.enabled)` for copy

**Electron Equivalent:**
- Tab component with state
- Search input with filter logic
- Electron dialog API for file export
- CSS monospace font
- User-select CSS property
- Virtualized list for performance

---

### 8. QuickLookPanel

**Component:** `QuickLookPanel` + `QuickLookView`
**File:** `/Views/QuickLookPanel.swift`
**Lines:** 72

**Functionality:**
- File preview modal
- Uses macOS QuickLook framework
- Preview for images, PDFs, videos, documents, code, etc.
- Close button
- File name header

**macOS-Specific APIs:**
- `QLPreviewView` from Quartz framework
- `NSViewRepresentable` for AppKit integration
- `QLPreviewItem` protocol

**Electron Equivalent:**
- **Challenge:** QuickLook is macOS-only
- **Solutions:**
  - Implement custom preview for each file type:
    - Images: `<img>` tag
    - PDFs: PDF.js library
    - Videos: `<video>` tag
    - Text/Code: Syntax-highlighted code viewer (Monaco Editor, CodeMirror)
    - Documents: Convert to HTML or use viewer libraries
  - Alternatively: Open with system default application

---

### 9. LoadingOverlayView

**Component:** `LoadingOverlayView`
**File:** `/Views/LoadingOverlayView.swift`
**Lines:** 103

**Functionality:**
- Full-screen modal overlay
- Blocks user interaction
- Two modes: determinate (with progress) and indeterminate (spinner)
- Loading message
- Optional cancel button

**UI Elements:**
- Semi-transparent black background (40% opacity)
- Centered card with blur material
- Progress indicator (spinner or progress bar)
- Message text (up to 5 lines)
- Cancel button (if cancellable)

**macOS-Specific APIs:**
- `ZStack` for layering
- `ProgressView` (circular and linear)
- `.regularMaterial` for blur
- `.shadow()` for card elevation
- `.transition()` and `.animation()`

**Electron Equivalent:**
- Fixed position overlay with CSS
- CSS `backdrop-filter: blur()` or rgba background
- HTML5 `<progress>` element or CSS progress bar
- CSS transitions and animations
- Modal component pattern

---

### 10. SettingsView

**Component:** `SettingsView`
**File:** `/Views/SettingsView.swift`
**Lines:** 166

**Functionality:**
- Modal settings sheet
- R2 credential configuration
- Three input fields: Account ID, Access Key ID, Secret Access Key
- Help text for each field
- Save and Clear actions
- Success alert after save
- Server restart on credential change

**Form Fields:**
1. **Account ID:** Text field + help text "Found in Cloudflare dashboard → R2"
2. **Access Key ID:** Text field + help text "Create API token in R2 settings"
3. **Secret Access Key:** Secure field + help text "Shown only once when creating the API token"

**macOS-Specific APIs:**
- `.sheet` modifier for modal presentation
- `@Environment(\.dismiss)` to close sheet
- `Form` with `Section`
- `SecureField` for password input
- `.alert()` modifier for success message

**Electron Equivalent:**
- Modal dialog component
- HTML form inputs
- Input type="password" for secret field
- Electron dialog API for alerts
- IPC to trigger server restart

---

## State Management

### 1. ServerManager

**Component:** `ServerManager`
**File:** `/ServerManager.swift`
**Type:** ObservableObject class

**Responsibilities:**
- Start/stop Node.js API server as child process
- Parse server port from logs
- Collect and publish server logs
- Pass credentials via command-line arguments
- Graceful shutdown with fallback to force kill

**Published Properties:**
```swift
@Published var isRunning: Bool
@Published var logs: [String]
@Published var serverPort: Int?
```

**Key Methods:**
- `startServer()`: Launch Node.js process with credentials
- `stopServer()`: Graceful shutdown via /shutdown endpoint, then force kill
- `restartServer()`: Stop and restart after 2.5s delay
- `getNodePath()`: Auto-detect Node.js installation (nvm, homebrew, system)
- `getServerScriptPath()`: Find server.js in bundle or dev path

**Process Management:**
- Uses `Process` (NSTask) to spawn child process
- Pipes for stdout/stderr capture
- Termination handler for cleanup
- Port detection from server logs (parsing "PORT=XXXX")

**Electron Equivalent:**
- Use Node.js `child_process.spawn()`
- Stream parsing for stdout/stderr
- Port detection from logs
- SIGTERM for graceful shutdown, SIGKILL for force
- IPC events for server status updates

---

### 2. SettingsManager

**Component:** `SettingsManager`
**File:** `/Services/SettingsManager.swift`
**Type:** ObservableObject class

**Responsibilities:**
- Manage R2 credentials
- Save to JSON file in `~/.cloudflare-r2-object-storage-browser/settings.json`
- Secure file permissions (0600)
- Validate credentials

**Published Properties:**
```swift
@Published var hasCredentials: Bool
```

**Computed Properties:**
```swift
var accountId: String?
var accessKeyId: String?
var secretAccessKey: String?
```

**Storage Format:**
```json
{
  "accountId": "...",
  "accessKeyId": "...",
  "secretAccessKey": "...",
  "endpoint": "https://<accountId>.r2.cloudflarestorage.com",
  "lastUpdated": "2025-10-15T12:00:00Z"
}
```

**Security:**
- Config directory permissions: 0700
- Config file permissions: 0600
- JSON file in home directory (not Keychain)

**Electron Equivalent:**
- Use `electron-store` for encrypted storage
- Or write to JSON with `fs.chmod()` for permissions
- Store in app data directory (`app.getPath('userData')`)
- Consider OS keychain integration (electron-keytar)

---

### 3. TransferManagerViewModel

**Component:** `TransferManagerViewModel`
**File:** `/ViewModels/TransferManagerViewModel.swift`
**Type:** ObservableObject class (MainActor)

**Responsibilities:**
- Manage upload/download/delete transfer queue
- Track transfer progress and status
- Concurrent transfer limits
- Retry logic
- Progress callbacks

**Published Properties:**
```swift
@Published var activeTasks: [TransferTask]
@Published var completedTasks: [TransferTask]
@Published var failedTasks: [TransferTask]
@Published var maxConcurrentUploads: Int = 3
@Published var maxConcurrentDownloads: Int = 5
@Published var autoRetryOnFailure: Bool = true
@Published var maxRetryAttempts: Int = 1
```

**Computed Properties:**
```swift
var allTasks: [TransferTask]
var queuedTasks: [TransferTask]
var inProgressTasks: [TransferTask]
var uploadingCount: Int
var downloadingCount: Int
var totalProgress: Double
var totalProgressPercentage: Int
```

**Key Methods:**
- `uploadFile()`: Queue single file upload
- `uploadFiles()`: Queue multiple uploads
- `downloadFile()`: Queue single download
- `downloadFiles()`: Queue multiple downloads
- `deleteObjects()`: Batch delete with progress
- `pauseTransfer()`, `resumeTransfer()`, `cancelTransfer()`
- `retryTransfer()`: Retry failed transfer
- `clearCompletedTasks()`, `clearFailedTasks()`

**Transfer Processing:**
- Queue-based concurrency control
- Batch API for deletes (max 1000 per batch)
- Folder deletion with recursive listing
- Progress tracking via callbacks
- Speed calculation (bytes/sec or items/sec)
- Time remaining estimation

**Electron Equivalent:**
- React/Vue store (Zustand, Pinia, etc.)
- Queue management with async/await
- Node.js streams for upload/download progress
- Worker threads for concurrent operations
- Event emitters for progress updates

---

## macOS-Specific Features

### 1. NSAlert (Native Alerts)

**Usage Locations:**
- Download complete confirmation
- Download/upload/delete error dialogs
- Delete confirmation dialogs
- Settings save success

**Features:**
- Title and message text
- Alert styles: informational, warning, critical
- Button customization
- Modal and sheet presentation

**Example:**
```swift
let alert = NSAlert()
alert.messageText = "Delete Items"
alert.informativeText = "Are you sure you want to delete 3 items?"
alert.alertStyle = .critical
alert.addButton(withTitle: "Delete")
alert.addButton(withTitle: "Cancel")
alert.beginSheetModal(for: window) { response in
    // Handle response
}
```

**Electron Equivalent:**
```javascript
const { dialog } = require('electron');
const result = await dialog.showMessageBox({
  type: 'warning',
  title: 'Delete Items',
  message: 'Are you sure you want to delete 3 items?',
  buttons: ['Delete', 'Cancel'],
  defaultId: 1,
  cancelId: 1
});
```

---

### 2. NSSavePanel (Save Dialog)

**Usage Locations:**
- Save cached file to custom location
- Export server logs

**Features:**
- Default filename
- File type filters
- Directory creation
- Filename field
- Async completion handler

**Example:**
```swift
let savePanel = NSSavePanel()
savePanel.nameFieldStringValue = "document.pdf"
savePanel.canCreateDirectories = true
savePanel.title = "Save File"
savePanel.begin { response in
    if response == .OK, let url = savePanel.url {
        // Save to url
    }
}
```

**Electron Equivalent:**
```javascript
const { dialog } = require('electron');
const result = await dialog.showSaveDialog({
  title: 'Save File',
  defaultPath: 'document.pdf',
  filters: [
    { name: 'PDF', extensions: ['pdf'] }
  ]
});
if (!result.canceled) {
  // Save to result.filePath
}
```

---

### 3. NSOpenPanel (File/Folder Picker)

**Usage Locations:**
- Upload file selection (multi-select)
- Download destination folder selection

**Features:**
- File vs directory selection
- Multi-select support
- File type filtering

**Examples:**
```swift
// Upload files
let openPanel = NSOpenPanel()
openPanel.canChooseFiles = true
openPanel.canChooseDirectories = false
openPanel.allowsMultipleSelection = true
openPanel.begin { response in
    if response == .OK {
        for url in openPanel.urls {
            // Upload file
        }
    }
}

// Download folder
let openPanel = NSOpenPanel()
openPanel.canChooseFiles = false
openPanel.canChooseDirectories = true
openPanel.canCreateDirectories = true
openPanel.begin { response in
    if response == .OK, let url = openPanel.url {
        // Download to url
    }
}
```

**Electron Equivalent:**
```javascript
// Upload files
const result = await dialog.showOpenDialog({
  properties: ['openFile', 'multiSelections']
});

// Download folder
const result = await dialog.showOpenDialog({
  properties: ['openDirectory', 'createDirectory']
});
```

---

### 4. QuickLook (File Preview)

**Usage:** File preview modal
**Framework:** Quartz.framework

**Features:**
- Native preview for many file types
- Images, PDFs, videos, documents, code, etc.
- Zoom, pan, play controls built-in
- Consistent with macOS Finder

**Implementation:**
```swift
import Quartz

struct QuickLookView: NSViewRepresentable {
    let url: URL

    func makeNSView(context: Context) -> QLPreviewView {
        let preview = QLPreviewView()
        preview.autostarts = true
        return preview
    }

    func updateNSView(_ nsView: QLPreviewView, context: Context) {
        nsView.previewItem = url as QLPreviewItem
    }
}
```

**Electron Equivalent:**
- **No direct equivalent** - QuickLook is macOS-only
- Options:
  1. Implement custom viewers per file type
  2. Use libraries (PDF.js, Monaco Editor, etc.)
  3. Shell out to system default app
  4. Embed file in iframe (limited support)

---

### 5. NSCursor (Custom Cursors)

**Usage:** Breadcrumb hover (pointing hand cursor)

**Example:**
```swift
.onHover { hovering in
    NSCursor.pointingHand.set()
}
```

**Electron Equivalent:**
```css
.breadcrumb-segment:hover {
  cursor: pointer;
}
```

---

### 6. Material Blur Effects

**Usage:** Backgrounds, panels, overlays

**Types:**
- `Material.thin`: Light blur
- `Material.regular`: Medium blur
- `.regularMaterial`: System material

**Example:**
```swift
.background(Material.thin)
.background(.regularMaterial)
```

**Electron Equivalent:**
```css
.panel {
  backdrop-filter: blur(20px);
  background-color: rgba(255, 255, 255, 0.7);
}

/* Dark mode */
.panel.dark {
  background-color: rgba(0, 0, 0, 0.5);
}
```

**Note:** `backdrop-filter` requires Chromium flag or is enabled by default in recent versions.

---

### 7. SF Symbols (Icon System)

**Usage:** All icons throughout the app

**Examples:**
- `tray.fill`: Bucket icon
- `arrow.up.doc`: Upload
- `arrow.down.doc`: Download
- `trash`: Delete
- `photo`: Image file
- `video`: Video file
- `doc`: Document

**Total Unique Icons:** 50+

**Electron Equivalent:**
- Use icon libraries:
  - **Lucide Icons:** Close match to SF Symbols
  - **Heroicons:** Tailwind-designed
  - **Material Icons:** Google's icon set
  - **Feather Icons:** Minimal style
- Or use SVG sprite sheets

---

### 8. Accessibility Features

**SwiftUI Accessibility:**
- `.accessibilityLabel()`: Screen reader labels
- `.accessibilityHint()`: Action descriptions
- `.accessibilityTraits()`: Element roles (.isButton, .isSelected, .isHeader)
- `.accessibilityElement()`: Grouping
- `.accessibilityValue()`: Dynamic values

**Electron Equivalent:**
```html
<button
  aria-label="Upload files"
  aria-disabled="false"
  role="button">
  Upload
</button>

<div role="navigation" aria-label="Bucket list">
  <!-- Bucket items -->
</div>
```

---

## Data Models

### 1. Bucket

**File:** `/Models/Bucket.swift`

**Structure:**
```swift
struct Bucket: Codable, Identifiable, Equatable {
    let name: String
    let creationDate: String?

    var id: String { name }
    var displayName: String
    var formattedCreationDate: String?
    var relativeCreationDate: String?
}
```

**API Response:**
```json
{
  "status": "success",
  "data": {
    "buckets": [
      {
        "name": "my-bucket",
        "creationDate": "2024-01-15T10:30:00Z"
      }
    ],
    "count": 1
  },
  "meta": {
    "timestamp": "2025-10-15T12:00:00Z",
    "requestId": "abc-123"
  }
}
```

---

### 2. R2Object

**File:** `/Models/R2Object.swift`

**Structure:**
```swift
struct R2Object: Codable, Identifiable, Equatable {
    let key: String
    let size: Int64
    let lastModified: String
    let etag: String?
    let storageClass: String?

    var id: String { key }
    var name: String
    var isFolder: Bool
    var fileExtension: String?
    var fileType: FileType
    var humanReadableSize: String
    var formattedLastModified: String?
    var relativeLastModified: String?
    var lastModifiedDate: Date?
}

enum FileType: String, CaseIterable {
    case folder, image, video, audio, document,
         archive, code, data, unknown
}
```

**API Response:**
```json
{
  "status": "success",
  "data": [
    {
      "key": "folder/subfolder/file.pdf",
      "size": 1048576,
      "lastModified": "2025-10-15T12:00:00.000Z",
      "etag": "\"abc123\"",
      "storageClass": "STANDARD"
    }
  ],
  "pagination": {
    "isTruncated": false,
    "maxKeys": 1000,
    "keyCount": 1,
    "delimiter": "/",
    "commonPrefixes": ["folder/", "another-folder/"],
    "continuationToken": null,
    "prefix": ""
  },
  "meta": {
    "timestamp": "2025-10-15T12:00:00Z",
    "requestId": "xyz-789"
  }
}
```

---

### 3. TransferTask

**File:** `/Models/TransferTask.swift`

**Structure:**
```swift
struct TransferTask: Identifiable, Equatable {
    let id: UUID
    let type: TransferType // upload, download, delete
    let fileName: String
    let localPath: URL?
    let remotePath: String
    let bucketName: String
    let totalSize: Int64
    var transferredSize: Int64
    var status: TransferStatus
    var speed: Double // bytes/sec
    var error: String?
    let createdAt: Date
    var startedAt: Date?
    var completedAt: Date?

    var progress: Double
    var progressPercentage: Int
    var humanReadableSpeed: String
    var estimatedTimeRemaining: TimeInterval?
    var humanReadableTimeRemaining: String?
    var humanReadableTotalSize: String
    var humanReadableTransferredSize: String
    var duration: TimeInterval?
    var canPause: Bool
    var canResume: Bool
    var canCancel: Bool
    var canRetry: Bool
}

enum TransferType: String {
    case upload, download, delete
}

enum TransferStatus: String {
    case queued, uploading, downloading, deleting,
         paused, completed, failed, cancelled

    var isActive: Bool
    var isInProgress: Bool
    var isFinished: Bool
}
```

---

### 4. Account (Unused)

**File:** `/Models/Account.swift`

**Note:** This model exists but is not used in the current implementation. Credentials are managed directly by `SettingsManager`.

---

## Services & API Integration

### 1. APIClient

**File:** `/Services/APIClient.swift`
**Type:** MainActor class

**Responsibilities:**
- HTTP client for local API server
- All R2 operations via REST API
- Error handling and response parsing

**Endpoints:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/buckets` | List all buckets |
| GET | `/buckets/:bucket/objects` | List objects (with prefix, delimiter, pagination) |
| GET | `/buckets/:bucket/objects/:key` | Download object |
| PUT | `/buckets/:bucket/objects/:key` | Upload object |
| DELETE | `/buckets/:bucket/objects/:key` | Delete single object |
| DELETE | `/buckets/:bucket/objects/batch` | Delete multiple objects (max 1000) |
| GET | `/buckets/:bucket/search` | Search objects by name |

**Key Methods:**
```swift
func listBuckets() async throws -> [Bucket]
func listObjects(bucket:prefix:delimiter:maxKeys:continuationToken:) async throws -> ObjectsResponse
func downloadObject(bucket:key:) async throws -> (Data, HTTPURLResponse)
func uploadObject(bucket:key:data:) async throws -> ObjectUploadResponse
func deleteObject(bucket:key:) async throws -> ObjectDeleteResponse
func deleteBatch(bucket:keys:) async throws
func deleteObjects(bucket:keys:onProgress:) async throws
func deleteFolder(bucket:prefix:onProgress:) async throws -> Int
func searchObjects(bucket:query:) async throws -> [R2Object]
```

**Error Types:**
```swift
enum R2Error: Error {
    case configurationError(String)
    case networkError(String)
    case invalidResponse
    case unauthorized
    case notFound(String)
    case serverError(Int, String)
    case decodingError(String)
}
```

**Electron Equivalent:**
- Use `axios` or `fetch` API
- Same endpoint structure
- TypeScript interfaces for type safety
- Error handling with try/catch

---

### 2. CacheManager

**File:** `/Services/CacheManager.swift`
**Type:** Singleton class

**Responsibilities:**
- Manage local file cache
- Save downloaded files to `~/.cloudflare-r2-object-storage-browser/cache/`
- Move/copy cached files
- Track cache size
- Clean up empty directories

**Cache Directory Structure:**
```
~/.cloudflare-r2-object-storage-browser/
├── settings.json
└── cache/
    ├── folder1/
    │   └── file1.pdf
    └── folder2/
        └── subfolder/
            └── file2.jpg
```

**Key Methods:**
```swift
func saveToCache(data:forKey:) throws -> URL
func cacheFileURL(forKey:) -> URL
func isCached(key:) -> Bool
func getCachedFileURL(forKey:) -> URL?
func moveCachedFile(forKey:to:) throws
func copyCachedFile(forKey:to:) throws
func removeCachedFile(forKey:) throws
func clearCache() throws
func getCacheSize() -> UInt64
func getCachedFileKeys() -> [String]
```

**Electron Equivalent:**
- Use Node.js `fs` module
- Cache in `app.getPath('userData')/cache`
- Same directory structure
- File operations with promises

---

### 3. FolderCache (Not Found)

**File:** `/Services/FolderCache.swift`

**Note:** File listed in glob but not read. Likely used for caching folder listings.

---

## Design System

### Colors

**File:** `/DesignSystem/Colors.swift`

**Color Palette:**
- Primary: `.blue` (SF Blue)
- Secondary: `.gray`
- Success: `.green`
- Warning: `.orange`
- Error/Destructive: `.red`
- Accent: `.accentColor` (system accent)

**Semantic Colors:**
- `.primary`, `.secondary`, `.tertiary`: Text hierarchy
- `.quaternary`: Very subtle elements

---

### Typography

**File:** `/DesignSystem/Typography.swift`

**Font Styles:**
- `.title`, `.title2`, `.title3`: Headings
- `.headline`: Section headers
- `.body`: Default text
- `.caption`, `.caption2`: Small text
- Monospaced: `.system(.body, design: .monospaced)` for file names, paths, logs

---

### Spacing

**File:** `/DesignSystem/Spacing.swift`

**Spacing Scale:**
- 4, 6, 8, 12, 16, 20, 24, 32, 40, 60px

---

### Effects

**File:** `/DesignSystem/Effects.swift`

**Visual Effects:**
- Blur materials
- Shadows
- Corner radius (6px for buttons, 12px for cards)
- Transitions and animations

---

### Icons

**File:** `/DesignSystem/Icons.swift`

**Icon Set:** SF Symbols (see macOS-Specific Features section)

---

## Electron Implementation Recommendations

### Technology Stack

**Frontend:**
- **Framework:** React 18+ or Vue 3+
- **State Management:**
  - React: Zustand, Redux Toolkit, or Context API
  - Vue: Pinia or Vuex
- **Styling:**
  - Tailwind CSS (for rapid development)
  - Or Styled Components / CSS Modules
- **UI Library:**
  - Headless UI (React/Vue)
  - Radix UI (React)
  - shadcn/ui (React + Tailwind)
  - Naive UI (Vue)
- **Table:** TanStack Table (React) or AG Grid
- **Icons:** Lucide Icons or Heroicons
- **Code Editor:** Monaco Editor (for code preview)

**Backend (in renderer process):**
- **HTTP Client:** Axios or Fetch API
- **File Operations:** Via Electron IPC to main process

**Main Process:**
- **Server Management:** child_process.spawn()
- **File Dialogs:** Electron dialog API
- **Settings Storage:** electron-store or custom JSON
- **IPC:** Electron IPC for renderer ↔ main communication

---

### Architecture

```
┌─────────────────────────────────────────┐
│         Electron Main Process           │
│  - Server lifecycle management          │
│  - File system operations               │
│  - Native dialogs (open/save)           │
│  - Settings persistence                 │
│  - IPC handlers                         │
└────────────┬────────────────────────────┘
             │ IPC
             │
┌────────────┴────────────────────────────┐
│       Electron Renderer Process         │
│  ┌─────────────────────────────────┐   │
│  │  React/Vue Application          │   │
│  │  - State management (stores)    │   │
│  │  - UI components                │   │
│  │  - API client (HTTP)            │   │
│  │  - Cache tracking               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Local API Server (Node.js)     │   │
│  │  - R2 SDK integration           │   │
│  │  - REST endpoints               │   │
│  │  - Managed by main process      │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

### Component Mapping

| SwiftUI Component | Electron/React Equivalent |
|-------------------|---------------------------|
| `ContentView` | Main App component with layout |
| `HSplitView` / `VSplitView` | `react-split-pane` or `allotment` |
| `ToolbarView` | Custom toolbar component |
| `BucketSidebarView` | Sidebar component with `react-window` |
| `FileListView` | TanStack Table or AG Grid |
| `BreadcrumbView` | Breadcrumb component (Headless UI) |
| `TransferQueuePanel` | Drawer/Panel with task list |
| `DebugPanelView` | Tabbed panel with search |
| `QuickLookPanel` | Custom preview modal (file-type specific) |
| `LoadingOverlayView` | Modal overlay with progress |
| `SettingsView` | Modal form dialog |

---

### File Dialog Mapping

| macOS API | Electron API |
|-----------|--------------|
| `NSOpenPanel` (files) | `dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'] })` |
| `NSOpenPanel` (folder) | `dialog.showOpenDialog({ properties: ['openDirectory'] })` |
| `NSSavePanel` | `dialog.showSaveDialog({ defaultPath, filters })` |
| `NSAlert` | `dialog.showMessageBox({ type, message, buttons })` |

---

### State Management

**Recommended: Zustand (React) or Pinia (Vue)**

**Stores:**
1. **ServerStore:**
   - `isRunning: boolean`
   - `port: number | null`
   - `logs: string[]`
   - `startServer()`, `stopServer()`, `restartServer()`

2. **SettingsStore:**
   - `accountId: string | null`
   - `accessKeyId: string | null`
   - `secretAccessKey: string | null`
   - `hasCredentials: boolean`
   - `saveCredentials()`, `clearCredentials()`

3. **BucketStore:**
   - `buckets: Bucket[]`
   - `selectedBucket: Bucket | null`
   - `isLoading: boolean`
   - `error: string | null`
   - `loadBuckets()`, `selectBucket()`

4. **FileStore:**
   - `objects: R2Object[]`
   - `folders: string[]`
   - `selectedObjects: Set<string>`
   - `currentPath: string`
   - `navigationHistory: string[]`
   - `historyIndex: number`
   - `sortColumn: string`
   - `sortOrder: 'asc' | 'desc'`
   - `loadObjects()`, `navigateToPath()`, `goBack()`, `goForward()`

5. **TransferStore:**
   - `activeTasks: TransferTask[]`
   - `completedTasks: TransferTask[]`
   - `failedTasks: TransferTask[]`
   - `uploadFile()`, `downloadFile()`, `deleteObjects()`
   - `pauseTransfer()`, `resumeTransfer()`, `cancelTransfer()`, `retryTransfer()`

6. **UIStore:**
   - `isTransferQueueVisible: boolean`
   - `isDebugPanelVisible: boolean`
   - `isSettingsVisible: boolean`
   - `isQuickLookVisible: boolean`
   - `quickLookFileURL: string | null`
   - `showLoadingOverlay: boolean`
   - `loadingMessage: string`
   - `loadingProgress: number | null`

---

### QuickLook Alternative

**Implement custom preview per file type:**

```typescript
// Preview component
function FilePreview({ fileURL, fileName, fileType }) {
  switch (fileType) {
    case 'image':
      return <ImagePreview src={fileURL} />;
    case 'video':
      return <VideoPreview src={fileURL} />;
    case 'audio':
      return <AudioPreview src={fileURL} />;
    case 'pdf':
      return <PDFPreview src={fileURL} />; // Use PDF.js
    case 'code':
    case 'data':
      return <CodePreview src={fileURL} />; // Use Monaco Editor
    case 'document':
      return <DocumentPreview src={fileURL} />; // Convert to HTML or use viewer
    default:
      return <UnsupportedPreview fileName={fileName} />;
  }
}
```

**Libraries:**
- **PDF.js:** PDF rendering
- **Monaco Editor:** Code/text with syntax highlighting
- **react-pdf:** React wrapper for PDF.js
- **react-player:** Video/audio player

---

### Keyboard Shortcuts

**Use Electron's globalShortcut or component-level handlers:**

| Shortcut | Action |
|----------|--------|
| `Cmd+[` | Navigate back |
| `Cmd+]` | Navigate forward |
| `Cmd+↑` | Navigate up (parent folder) |
| `Cmd+R` | Refresh |
| `Cmd+Shift+D` | Toggle debug panel |
| `Cmd+Q` | Quit (with server cleanup) |

**Implementation:**
```javascript
// Main process (global shortcuts)
const { globalShortcut } = require('electron');

globalShortcut.register('CommandOrControl+Q', () => {
  // Stop server and quit
  stopServer();
  app.quit();
});

// Renderer process (component shortcuts)
useEffect(() => {
  const handler = (e) => {
    if (e.metaKey && e.key === '[') {
      goBack();
    } else if (e.metaKey && e.key === ']') {
      goForward();
    }
    // etc.
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, []);
```

---

### Performance Considerations

1. **Virtual Scrolling:** Use `react-window` or `react-virtualized` for large file lists
2. **Debounce Search:** Debounce search input to avoid excessive filtering
3. **Lazy Loading:** Load thumbnails/previews on demand
4. **Worker Threads:** Offload heavy operations (large file processing) to workers
5. **Pagination:** Support pagination for buckets with 1000+ objects
6. **Caching:** Cache API responses with expiration
7. **Memoization:** Use React.memo or Vue computed for expensive renders

---

### Accessibility

**Ensure ARIA attributes and keyboard navigation:**

```html
<!-- Example: File list table -->
<table role="grid" aria-label="File and folder list">
  <thead>
    <tr role="row">
      <th role="columnheader">Name</th>
      <th role="columnheader">Size</th>
      <!-- ... -->
    </tr>
  </thead>
  <tbody>
    <tr role="row" aria-selected="false" tabindex="0">
      <td role="gridcell">file.pdf</td>
      <td role="gridcell">1.5 MB</td>
      <!-- ... -->
    </tr>
  </tbody>
</table>

<!-- Example: Button with label -->
<button aria-label="Upload files" disabled={false}>
  <UploadIcon />
  Upload
</button>

<!-- Example: Progress bar -->
<div role="progressbar" aria-valuenow={50} aria-valuemin={0} aria-valuemax={100}>
  <div style={{ width: '50%' }} />
</div>
```

---

### Testing Strategy

**Unit Tests:**
- Store actions and state updates
- Utility functions (formatters, validators)
- Component logic

**Integration Tests:**
- API client methods
- File operations (upload/download)
- Transfer queue management

**E2E Tests (Spectron or Playwright):**
- Launch app and verify server starts
- Load buckets and navigate folders
- Upload/download files
- Delete files with confirmation
- Settings modal flow

---

## Feature Parity Checklist

### Core Features

- [ ] Server lifecycle management (start/stop/restart)
- [ ] Auto-detect Node.js installation
- [ ] Credentials management (save/load/clear)
- [ ] Bucket listing with loading/error states
- [ ] Object listing with folders and files
- [ ] Breadcrumb navigation
- [ ] Navigation history (back/forward/up)
- [ ] File icons based on type
- [ ] File size formatting
- [ ] Relative timestamps
- [ ] Multi-select support
- [ ] Context menus (right-click)
- [ ] Double-click to open folders
- [ ] File preview (QuickLook alternative)

### File Operations

- [ ] Upload single file
- [ ] Upload multiple files
- [ ] Download single file
- [ ] Download multiple files
- [ ] Download to cache
- [ ] Save cached file to custom location
- [ ] Delete single object
- [ ] Delete multiple objects
- [ ] Delete folders recursively
- [ ] Delete confirmation dialog
- [ ] Copy file path to clipboard
- [ ] Cache status indicator

### Transfer Queue

- [ ] Upload queue with progress
- [ ] Download queue with progress
- [ ] Delete queue with progress
- [ ] Concurrent transfer limits (3 uploads, 5 downloads)
- [ ] Pause/resume/cancel transfers
- [ ] Retry failed transfers
- [ ] Transfer speed calculation
- [ ] Time remaining estimation
- [ ] Completed tasks list (limit 50)
- [ ] Failed tasks list (limit 50)
- [ ] Clear completed/failed buttons
- [ ] Empty state

### Debug Panel

- [ ] Two tabs: API Response and Server Logs
- [ ] API request/response logging
- [ ] Method badges (GET/POST/PUT/DELETE)
- [ ] JSON response display
- [ ] Timestamp tracking
- [ ] Copy API response to clipboard
- [ ] Clear API history
- [ ] Server logs display
- [ ] Log search/filter
- [ ] Auto-scroll toggle
- [ ] Export logs to file
- [ ] Clear logs
- [ ] Line numbers

### UI/UX

- [ ] Split-pane layout (resizable)
- [ ] Toolbar with navigation and actions
- [ ] Bucket sidebar
- [ ] File list table with sorting
- [ ] Loading overlay (determinate and indeterminate)
- [ ] Settings modal
- [ ] Blur effects (backdrop-filter)
- [ ] Hover states
- [ ] Disabled states
- [ ] Keyboard shortcuts
- [ ] Tooltips
- [ ] Accessibility (ARIA)
- [ ] Empty states
- [ ] Error states

### Advanced Features

- [ ] Pagination support (continuationToken)
- [ ] Search functionality
- [ ] Batch delete API (max 1000)
- [ ] Folder deletion with recursive listing
- [ ] Cache management
- [ ] Cache size tracking
- [ ] Auto-retry on failure
- [ ] Progress callbacks
- [ ] Error handling
- [ ] Alert/confirmation dialogs

---

## Missing from macOS App (Potential Enhancements)

Based on the codebase analysis, here are features that are mentioned in code but not fully implemented:

1. **Search:** `SearchViewModel.swift` exists but search UI is not implemented
2. **"Open in Browser":** Context menu item exists but not implemented (presigned URLs)
3. **"Copy URL":** Context menu item exists but not implemented
4. **"Get Info":** Context menu item exists but not implemented (metadata panel)
5. **Drag-and-drop upload:** itemProvider is set up but not fully implemented
6. **Bucket creation:** No UI to create new buckets
7. **Account management:** `Account.swift` model exists but not used
8. **Multiple account switching:** Only single account supported
9. **Themes:** No dark mode toggle (uses system theme)
10. **Bucket-level operations:** No rename, delete, or settings for buckets

---

## Summary

This analysis covers **all UI components, features, and macOS-specific APIs** used in the SwiftUI application. The Electron port should:

1. **Replicate all views** using React/Vue components with similar layouts
2. **Replace macOS APIs** with Electron equivalents (dialogs, file pickers, etc.)
3. **Implement QuickLook alternative** with custom previews per file type
4. **Use CSS for blur effects** instead of Material backgrounds
5. **Adopt icon library** to replace SF Symbols
6. **Maintain state management** with Zustand/Pinia stores
7. **Preserve all functionality** including transfer queue, debug panel, and cache management
8. **Ensure accessibility** with ARIA attributes and keyboard navigation
9. **Optimize performance** with virtual scrolling and lazy loading
10. **Test thoroughly** with unit, integration, and E2E tests

**Estimated Effort:**
- **UI Components:** 2-3 weeks (10 major views + subcomponents)
- **State Management:** 1 week (5 stores)
- **File Operations:** 1 week (upload/download/delete with progress)
- **Dialogs & Modals:** 3-4 days
- **QuickLook Alternative:** 1 week (multi-format preview)
- **Testing:** 1 week
- **Polish & Bug Fixes:** 1 week

**Total:** ~7-9 weeks for feature parity

---

## Appendix: File Structure

```
/applications/MacOS/CloudflareR2ObjectStorageBrowser/
├── CloudflareR2ObjectStorageBrowserApp.swift (App entry point)
├── ContentView.swift (Main window)
├── ServerManager.swift (Node.js server lifecycle)
│
├── Views/
│   ├── ToolbarView.swift (Navigation & actions toolbar)
│   ├── BucketSidebarView.swift (Bucket list sidebar)
│   ├── FileListView.swift (File/folder table)
│   ├── BreadcrumbView.swift (Path navigation)
│   ├── TransferQueuePanel.swift (Upload/download queue)
│   ├── DebugPanelView.swift (API logs & server logs)
│   ├── QuickLookPanel.swift (File preview modal)
│   ├── LoadingOverlayView.swift (Loading overlay)
│   └── SettingsView.swift (Settings modal)
│
├── ViewModels/
│   ├── BucketListViewModel.swift
│   ├── FileListViewModel.swift
│   ├── SearchViewModel.swift
│   └── TransferManagerViewModel.swift (Transfer queue)
│
├── Models/
│   ├── Bucket.swift
│   ├── R2Object.swift
│   ├── TransferTask.swift
│   └── Account.swift (unused)
│
├── Services/
│   ├── APIClient.swift (HTTP client for local API)
│   ├── SettingsManager.swift (Credentials storage)
│   ├── CacheManager.swift (File cache)
│   └── FolderCache.swift (Folder listing cache)
│
├── Utilities/
│   └── LoadingState.swift
│
└── DesignSystem/
    ├── Colors.swift
    ├── Typography.swift
    ├── Spacing.swift
    ├── Effects.swift
    ├── Icons.swift
    ├── StyleGuide.swift
    └── DesignSystem.swift
```

---

**End of Analysis**
