# Product Requirements Document: Cloudflare R2 Object Storage Browser

## Document Information
- **Product Name**: Cloudflare R2 Object Storage Browser
- **Version**: 1.0.0
- **Last Updated**: 2025-10-14
- **Author**: Development Team
- **Status**: In Development

---

## 1. Executive Summary

### 1.1 Product Overview
Cloudflare R2 Object Storage Browser is a native macOS desktop application that provides an intuitive, Finder-like interface for managing files and folders in Cloudflare R2 storage. The application consists of a TypeScript/Fastify API backend and a SwiftUI-based macOS frontend.

### 1.2 Goals
- **Provide a truly native macOS experience**: The app must not only look beautiful but *feel* like a first-party macOS application—respecting platform conventions, system integration (Keychain, Finder, Quick Look), native controls (SF Symbols, system fonts), and expected behaviors (keyboard shortcuts, trackpad gestures, menu bar integration)
- Simplify common file operations (upload, download, delete, rename)
- Offer advanced features like multipart uploads, presigned URLs, and batch operations
- Maintain high performance with large-scale storage operations through intelligent caching and lazy loading

### 1.3 Target Users
- Developers managing application assets in R2
- Content creators storing media files
- DevOps engineers managing deployment artifacts
- Small to medium businesses using R2 for file storage

---

## 2. Current State

### 2.1 Completed Features
- ✅ API server with random port allocation
- ✅ R2 connection via S3-compatible SDK
- ✅ Bucket listing endpoint (`GET /buckets`)
- ✅ macOS app with HSplitView layout
- ✅ Server status monitoring and logging
- ✅ Basic UI with buckets sidebar

### 2.2 Technology Stack
- **Backend**: Node.js, TypeScript, Fastify, AWS SDK S3 Client
- **Frontend**: Swift, SwiftUI (macOS 13.0+)
- **Build Tools**: pnpm, Turborepo, esbuild, Xcode
- **Infrastructure**: Cloudflare R2 (S3-compatible API)

---

## 3. Feature Requirements

## 🚀 NOW: Phase 1 (Current Development Priority)

### 3.1 API Endpoints - NOW

#### 3.1.1 Object Operations (Priority: High)

**Object Listing**
- Endpoint: `GET /buckets/{bucket}/objects`
- Query Parameters:
  - `prefix` (string): Filter by folder path
  - `delimiter` (string): Path separator (default: "/")
  - `maxKeys` (number): Pagination limit (default: 1000)
  - `continuationToken` (string): For pagination
- Response: JSON with objects array (key, size, lastModified, etag, storageClass) and commonPrefixes for folders

**Object Download**
- Endpoint: `GET /buckets/{bucket}/objects/{key}`
- Response: Binary stream with appropriate Content-Type header
- Headers: Content-Disposition, Content-Length, ETag

**Object Upload**
- Endpoint: `PUT /buckets/{bucket}/objects/{key}`
- Body: Binary file data (multipart/form-data or raw binary)
- Headers: Content-Type, Content-Length
- Response: JSON with status, key, etag, size

**Object Deletion**
- Endpoint: `DELETE /buckets/{bucket}/objects/{key}`
- Response: JSON with status and confirmation message

#### 3.1.2 Folder/Prefix Operations (Priority: High)

**Folder Structure Navigation**
- Endpoint: `GET /buckets/{bucket}/objects?prefix={path}&delimiter=/`
- Returns both objects and common prefixes (folders)
- Supports hierarchical navigation

#### 3.1.3 Metadata & Properties (Priority: Medium)

**Metadata Query**
- Endpoint: `HEAD /buckets/{bucket}/objects/{key}`
- Returns: Content-Type, Content-Length, Last-Modified, ETag in headers
- No body response (HEAD request)

#### 3.1.4 Search & Filter (Priority: Medium)

**File Name Search**
- Endpoint: `GET /buckets/{bucket}/search?q={query}`
- Search across all objects in bucket
- Returns matching objects with full metadata

**Date Filter**
- Endpoint: `GET /buckets/{bucket}/objects?modified_after={date}`
- Filter by last modified timestamp
- ISO 8601 date format

**Size Filter**
- Endpoint: `GET /buckets/{bucket}/objects?size_range={min}-{max}`
- Filter by file size range (bytes)
- Support for human-readable units (KB, MB, GB)

### 3.2 macOS Application Features - NOW

#### 3.2.1 File Browser UI (Priority: Critical)

**Master-Detail Layout (Finder Style)**
- **Left Sidebar** (200-400px, resizable):
  - Bucket list with bucket icons (bucket/pail icon, not folder)
  - Expand/collapse folder tree
  - Refresh button
  - Bucket icon: Use SF Symbols "tray.fill" or custom bucket/pail icon

- **Center Panel** (Main content area):
  - Breadcrumb navigation (clickable path segments)
  - File/folder list with columns:
    - Icon (type indicator with SF Symbols)
    - Name
    - Size (human-readable: KB, MB, GB)
    - Last Modified (relative time: "2 hours ago")
    - Type (file extension)
  - View options: List (default) / Grid
  - Sort options: Name, Size, Date, Type (ascending/descending)
  - Empty state: "Drag files here to upload" message

- **Bottom Panel** (Debug Panel - Collapsible):
  - Collapsed by default
  - Two tabs: API Response, Server Logs
  - View → Show/Hide Debug Panel menu item (`Cmd+Shift+D`)
  - **API Response Tab**:
    - Shows raw API responses from backend
    - JSON syntax highlighting
    - Copy to clipboard button
    - Clear button
  - **Server Logs Tab**:
    - Real-time log streaming
    - Log level filter (Debug, Info, Warn, Error)
    - Clear logs button
    - Export logs button

**Navigation**
- Back/Forward buttons (browser-style with `Cmd+[` and `Cmd+]`)
- Up to parent folder button (`Cmd+↑`)
- Double-click folder to open
- Breadcrumb segments are clickable

#### 3.2.2 File Operations (Priority: Critical)

**Drag & Drop Upload/Download**
- Drag files from Finder into app to upload
- Drag files from app to Finder to download
- Visual feedback during drag (highlight drop zone)
- Support for multiple files and folders
- Automatic folder structure recreation on upload

**Context Menu (Right-click)**
- Download
- Delete (with confirmation)
- Rename (inline editing)
- Copy / Move
- Get Shareable Link
- Show in Finder (after download)
- Get Info
- ---
- Copy Path
- Copy URL

**Multi-select**
- `Cmd+Click`: Add/remove from selection
- `Shift+Click`: Range selection
- `Cmd+A`: Select all
- Selection counter in status bar ("3 items selected")

**Trackpad Gestures** (NEW)
- Two-finger swipe left/right: Back/Forward navigation
- Pinch to zoom: Grid view icon size adjustment
- Three-finger tap: Quick Look

#### 3.2.3 File Preview (Priority: High)

**Text Editor**
- Supported formats: TXT, JSON, MD, CSV, XML, YAML, LOG
- Syntax highlighting for code files (JS, TS, Python, Swift, etc.)
- Line numbers
- Word wrap toggle
- Read-only view (editing in future phase)
- Copy to clipboard button

**Code Syntax Highlighting**
- Use system-provided SourceEditor framework
- Support for 50+ languages
- Theme follows system appearance (Light/Dark)

**Quick Look Integration**
- Press Space bar for native Quick Look
- Supports all macOS-compatible formats
- Full-screen mode available

**Hex Viewer** (NEW)
- For binary files (executables, images, unknown formats)
- Hexadecimal + ASCII view side-by-side
- Jump to offset functionality
- Search within hex data

**Partial Loading for Large Files** (NEW)
- Files > 10MB: Load first 1MB only
- "Load More" button to fetch additional chunks
- Streaming support for very large files
- Progress indicator during load

#### 3.2.4 Search & Filter (Priority: High)

**Search Bar**
- Located at top of center panel
- Real-time search as you type (debounced 300ms)
- Search scope: Current folder or Entire bucket (toggle)
- Clear button (×)
- Keyboard shortcut: `Cmd+F`

**Filter Panel**
- Collapsible panel below search bar
- File type filter with chips:
  - All Files (default)
  - Images (jpg, png, gif, webp, heic, svg)
  - Videos (mp4, mov, avi, webm, mkv)
  - Documents (pdf, doc, docx, txt, md)
  - Archives (zip, tar, gz, rar, 7z)
  - Code (js, ts, py, swift, go, etc.)
  - Other
- Date range picker:
  - Presets: Today, Last 7 days, Last 30 days, Custom
  - Calendar picker for custom range
- Size range slider:
  - Min: 0 bytes
  - Max: Largest file in bucket
  - Dual-thumb slider for range selection
  - Display in KB/MB/GB

**Sort Options**
- Click column headers to sort
- Sort indicators (↑ ↓)
- Options:
  - Name (A-Z, Z-A)
  - Size (Smallest first, Largest first)
  - Date Modified (Newest first, Oldest first)
  - Type (A-Z, Z-A)
- Remember sort preference per bucket

#### 3.2.5 Upload/Download Manager (Priority: High)

**Transfer Queue Window**
- Floating window (can be hidden)
- Shows in Window menu
- Three tabs: Active, Completed, Failed
- Keyboard shortcut: `Cmd+Shift+T`

**Active Transfers**
- List of in-progress uploads/downloads
- Per-transfer info:
  - File name and destination path
  - Progress bar (0-100%)
  - Transfer speed (MB/s)
  - Time remaining (estimated)
  - Status badge (Uploading, Downloading, Paused, Queued)
- Controls per transfer:
  - Pause/Resume button
  - Cancel button (with confirmation)

**Completed Transfers**
- Last 50 completed transfers
- Show timestamp, file name, size
- "Open in Finder" button for downloads
- "Clear All" button

**Failed Transfers**
- List of failed transfers with error messages
- Retry button (individual or all)
- Error details on hover/click
- "Remove from list" button

**Transfer Settings**
- Max concurrent uploads: 1-10 (default: 3)
- Max concurrent downloads: 1-10 (default: 5)
- Auto-retry on failure: 0-3 times (default: 1)
- Retry delay: 5-60 seconds (default: 10s)
- Show notification on completion: Yes/No (default: Yes)

**Queue Management**
- Automatic queue management
- Priority: Smaller files first by default
- Drag to reorder in queue
- Bandwidth throttling option (future)

#### 3.2.6 Folder Listing Cache (Priority: High)

**Cache Strategy**
- Cache folder contents in memory to avoid redundant API calls
- Cache invalidation on mutation operations (upload, delete, rename, move)
- Cache key format: `{accountId}:{bucketName}:{prefix}`
- Configurable TTL (time-to-live): Default 5 minutes

**User Experience Benefits**
- **Back Navigation**: When user navigates up to parent folder (Cmd+↑ or clicking breadcrumb), cached data loads instantly without API call
- **Forward Navigation**: When user navigates forward to previously visited folder, cached data displays immediately
- **Folder Switching**: Switching between recently visited folders in same bucket is instantaneous

**Cache Behavior**
- **Cache Hit**: Display cached data immediately, optionally refresh in background (soft refresh)
- **Cache Miss**: Fetch from API, store in cache for future use
- **Manual Refresh**: User can force refresh (Cmd+R) to bypass cache and fetch latest data
- **Auto-invalidation**: Cache entry invalidated when:
  - User uploads/deletes/renames objects in that folder
  - User creates/deletes subfolder
  - TTL expires (default 5 minutes)
  - User manually refreshes

**Cache Management**
- Max cache entries: 100 folders (LRU eviction policy)
- Max cache memory: 50MB (estimated, based on 500 objects × 100 folders)
- Cache stored in-memory (not persisted across app restarts)
- Clear cache option in Preferences → Advanced

**Implementation Details**
- Cache stored in ViewModel layer (FileListViewModel)
- Cache key includes: Account ID, Bucket name, Prefix (folder path)
- Cached data includes: Object list, common prefixes (subfolders), pagination tokens
- Background refresh: If cache age > 2 minutes, fetch fresh data in background and update silently
- Visual indicator: Show refresh icon in toolbar when background refresh is in progress

**User Preferences** (in Preferences → Advanced)
- Enable folder cache: Checkbox (default: On)
- Cache TTL: Dropdown (1 min, 5 min, 10 min, 30 min, Never expire, default: 5 min)
- Cache size limit: Dropdown (25MB, 50MB, 100MB, default: 50MB)
- Background refresh: Checkbox (default: On)
- Show cache indicator: Checkbox (default: On)

#### 3.2.7 Preferences Window (Priority: Medium)

**General Tab**
- Default download location: File picker
- Ask where to save downloads: Checkbox (default: On)
- Show notifications for completed transfers: Checkbox (default: On)
- Launch at login: Checkbox (default: Off)
- Check for updates automatically: Checkbox (default: On)

**Transfers Tab**
- Max concurrent uploads: Stepper (1-10, default: 3)
- Max concurrent downloads: Stepper (1-10, default: 5)
- Auto-retry failed transfers: Stepper (0-3, default: 1)
- Retry delay: Stepper (5-60s, default: 10s)
- Chunk size for large files: Dropdown (5MB, 10MB, 25MB, 50MB, 100MB, default: 25MB)

**Appearance Tab**
- Theme: Radio buttons (Light, Dark, Auto)
- Grid view icon size: Slider (Small, Medium, Large)
- Show file extensions: Checkbox (default: On)
- Show hidden files: Checkbox (default: Off)
- Date format: Dropdown (Relative, Absolute)

**Accounts Tab** (NEW)
- List of configured accounts
- Add Account button → Opens form:
  - Account Name (friendly name)
  - Access Key ID (text field)
  - Secret Access Key (secure text field)
  - Endpoint URL (text field with validation)
  - Test Connection button (validates credentials)
  - Save button (stores in Keychain)
- Edit/Delete buttons per account
- Set as default: Radio button
- Current account shown in toolbar with dropdown to switch

**Advanced Tab**
- Cache management:
  - Cache size: Display current usage
  - Clear cache button
  - Cache location: File picker
- Debug options:
  - Enable debug panel: Checkbox (default: Off)
  - Show API responses: Checkbox (default: Off)
  - Show server logs: Checkbox (default: Off)
  - Log level: Dropdown (Debug, Info, Warn, Error, default: Info)
  - Export logs button
- Reset to defaults button

**Preferences Behavior** (NEW)
- Real-time options (no save button needed):
  - Theme
  - Grid icon size
  - Show file extensions
  - Show hidden files
- Options requiring save button:
  - Account credentials
  - Default download location
  - Transfer settings
- "Save" button only shown for tabs with non-real-time options
- "Cancel" button reverts unsaved changes

**Debug Panel - Separated as Debug Feature** (NEW)
- Not visible by default
- Accessible via: View → Show Debug Panel (or `Cmd+Shift+D`)
- Opens as bottom panel (collapsible)
- Two tabs: API Response and Server Logs
- **API Response Tab**:
  - Shows raw JSON responses from all API calls
  - JSON syntax highlighting with theme support
  - Request method and endpoint displayed
  - Timestamp for each response
  - Copy to clipboard button
  - Clear history button
  - Max 50 responses (circular buffer)
- **Server Logs Tab**:
  - Real-time log streaming from backend
  - Auto-scroll toggle
  - Log level filter (Debug, Info, Warn, Error)
  - Search within logs
  - Clear logs button
  - Export to file button
  - Max 1000 entries (circular buffer)

---

## 🔮 LATER: Future Phases (Deferred)

### Future API Endpoints

#### Presigned URLs
- `POST /buckets/{bucket}/objects/{key}/presigned-url`
- Generate temporary shareable links
- Configurable expiration time

#### Copy/Move Operations
- `POST /buckets/{bucket}/objects/{key}/copy`
- `POST /buckets/{bucket}/objects/{key}/move`
- Cross-bucket support

#### Multipart Upload
- `POST /buckets/{bucket}/objects/{key}/multipart/initiate`
- `PUT /buckets/{bucket}/objects/{key}/multipart/{uploadId}/parts/{partNumber}`
- `POST /buckets/{bucket}/objects/{key}/multipart/{uploadId}/complete`
- `DELETE /buckets/{bucket}/objects/{key}/multipart/{uploadId}/abort`
- For files > 100MB

#### Batch Operations
- `POST /batch/delete`
- `POST /batch/copy`
- `POST /batch/move`
- Operate on multiple objects at once

#### Bucket Management
- `POST /buckets` (create bucket)
- `DELETE /buckets/{bucket}` (delete bucket)
- `GET /buckets/{bucket}/settings`
- `PUT /buckets/{bucket}/settings`

#### Analytics & Stats
- `GET /buckets/{bucket}/stats`
- `GET /usage/bandwidth`
- `GET /usage/storage`
- Storage class distribution

#### Advanced Metadata
- `PUT /buckets/{bucket}/objects/{key}/metadata` (update metadata)
- `GET /buckets/{bucket}/storage-class`
- Custom metadata support

### Future macOS Features

#### Image/Video Viewer
- Built-in image viewer with zoom controls
- Video player with playback controls
- Thumbnail generation and caching
- Gallery mode (arrow keys to navigate)

#### File Editing
- Inline text editor (save changes back to R2)
- Image basic edits (crop, resize, rotate)
- Markdown live preview

#### Bucket Management UI
- Create bucket dialog with settings
- Delete bucket with confirmation
- Bucket settings panel (storage class, CORS, public access)
- Bucket statistics dashboard

#### Statistics Dashboard
- Per-bucket stats (size, object count, bandwidth)
- Account-level overview
- Cost estimate calculator
- Storage class distribution charts

#### Multi-Account Support
- Add/remove accounts from Preferences
- Quick account switcher in toolbar
- Per-account color coding
- Credentials stored in Keychain

#### Sync Feature (Experimental)
- Local folder ↔ R2 bucket sync
- Sync directions: Upload only, Download only, Bidirectional
- File watcher for auto-sync
- Conflict resolution strategies
- Exclude patterns (.DS_Store, .git, etc.)

#### Advanced File Operations
- Rename (batch rename support)
- Copy path/URL to clipboard
- Create symbolic links
- Set custom metadata
- Version history viewer (if versioning enabled)

#### Collaboration Features
- Share bucket with team members
- Activity timeline
- Comments on objects
- Access control management

#### Integrations
- Cloudflare Workers integration
- GitHub Actions workflow templates
- CLI companion tool
- AppleScript/Shortcuts support

---

## 4. User Stories - NOW Phase

### US-1.1: Browse Buckets and Folders
**As a** developer
**I want to** browse my R2 buckets in a familiar folder structure
**So that** I can easily find my files

**Acceptance Criteria:**
- User can see all buckets in left sidebar with bucket icons
- Clicking a bucket shows its contents in center panel
- Folders are displayed with "/" delimiter logic
- Double-clicking a folder navigates into it
- Breadcrumb shows current path
- Back/Forward buttons work correctly

### US-1.2: Upload Files via Drag & Drop
**As a** content creator
**I want to** upload files by dragging them from Finder
**So that** I can quickly add files to R2

**Acceptance Criteria:**
- Dragging files from Finder highlights the drop zone
- Dropping files starts upload immediately
- Progress is shown for each file in transfer manager
- Multiple files can be uploaded simultaneously
- Folders can be uploaded with structure preserved
- Success notification appears when complete

### US-1.3: Download Files
**As a** DevOps engineer
**I want to** download files to my local machine
**So that** I can use them in my workflow

**Acceptance Criteria:**
- User can select files and click download button
- User can drag files to Finder to download
- Save dialog allows choosing destination (if enabled in prefs)
- Progress is shown in transfer manager
- Downloaded file opens in Finder when complete
- Multiple files can be downloaded simultaneously

### US-1.4: Delete Files
**As a** user
**I want to** delete old files
**So that** I can save storage costs

**Acceptance Criteria:**
- User can select multiple files
- Delete button or `Cmd+Delete` triggers action
- Confirmation dialog prevents accidents
- Success message confirms deletion
- Deleted files removed from view immediately
- Failed deletions show error message

### US-1.5: Search for Files
**As a** user
**I want to** search for files by name
**So that** I can find specific files quickly

**Acceptance Criteria:**
- Search bar is always visible at top
- Results appear as user types (with 300ms debounce)
- Search works in current folder or entire bucket
- Clear button resets search
- Search highlights matching text in results
- `Cmd+F` focuses search bar

### US-1.6: Preview Text Files
**As a** developer
**I want to** preview text and code files
**So that** I can verify content before downloading

**Acceptance Criteria:**
- Clicking a text file shows preview in right panel
- Syntax highlighting works for code files
- Preview loads within 2 seconds
- Line numbers are displayed
- User can copy text to clipboard
- Large files (>10MB) show partial content with "Load More" button

### US-1.7: Filter by File Type
**As a** designer
**I want to** filter files by type
**So that** I can find images quickly

**Acceptance Criteria:**
- Filter panel shows file type chips
- Clicking a chip filters the view
- Multiple filters can be active
- File count updates with filter
- Filter persists during navigation
- Clear filter button resets view

### US-1.8: Manage Transfers
**As a** power user
**I want to** see and control ongoing transfers
**So that** I can manage bandwidth usage

**Acceptance Criteria:**
- Transfer manager window shows all active transfers
- Each transfer shows progress bar and speed
- User can pause/resume transfers
- User can cancel transfers
- Failed transfers can be retried
- Completed transfers show in separate tab

### US-1.9: Configure Preferences
**As a** user
**I want to** customize app behavior
**So that** it works the way I prefer

**Acceptance Criteria:**
- Preferences window accessible via `Cmd+,`
- Theme changes apply immediately (no save needed)
- Download location can be changed
- Transfer limits can be adjusted
- All preferences persist across app restarts
- Account credentials stored securely in Keychain

### US-1.10: Add R2 Account
**As a** user with multiple R2 accounts
**I want to** add and switch between accounts
**So that** I can manage different projects

**Acceptance Criteria:**
- "Add Account" button in Preferences → Accounts
- Form validates Access Key and Endpoint
- "Test Connection" button verifies credentials
- Account saved to Keychain on success
- Account list shows all configured accounts
- User can set default account
- Toolbar shows current account with switcher dropdown

---

## 5. Technical Specifications

### 5.1 API Architecture

#### Technology Stack
- **Runtime**: Node.js 20+
- **Framework**: Fastify 5.x
- **Language**: TypeScript 5.x
- **S3 SDK**: @aws-sdk/client-s3
- **Build Tool**: esbuild
- **Environment**: dotenv

#### API Design Principles
- RESTful conventions
- JSON request/response bodies
- Standard HTTP status codes
- Consistent error response format
- CORS enabled for development
- Request/response logging

#### Error Handling
- 400: Bad Request (validation errors)
- 401: Unauthorized (invalid credentials)
- 403: Forbidden (insufficient permissions)
- 404: Not Found (bucket/object doesn't exist)
- 409: Conflict (duplicate names)
- 429: Too Many Requests (rate limiting)
- 500: Internal Server Error
- 503: Service Unavailable (R2 downtime)

#### Security
- Never log credentials
- Validate all user inputs
- Sanitize file paths
- Use HTTPS only
- Rate limiting per endpoint
- CORS restricted to localhost

### 5.2 macOS Application Architecture

#### Architecture Pattern
- **MVVM** (Model-View-ViewModel)
- **Models**: Bucket, S3Object, TransferTask, Account
- **ViewModels**: BucketListViewModel, FileListViewModel, TransferManagerViewModel
- **Views**: SwiftUI components

#### State Management
- `@StateObject` for view models
- `@EnvironmentObject` for ServerManager
- Combine framework for reactive updates
- UserDefaults for preferences
- Keychain for credentials

#### Networking
- URLSession for HTTP requests
- Async/await for concurrent operations
- Result type for error handling
- Request timeout: 30 seconds
- Retry logic with exponential backoff

#### File System
- FileManager for local operations
- NSOpenPanel for file picker
- NSSavePanel for save dialog
- Security-scoped bookmarks for sandboxed access
- Temporary directory for downloads-in-progress

#### Background Tasks
- OperationQueue for transfer management
- URLSessionDownloadTask for background downloads
- DispatchQueue for async operations
- FileSystemWatcher for sync feature (future)

### 5.3 Performance Requirements

- **Object Listing**: Load 10,000+ objects without UI lag
- **Upload/Download Speed**: Utilize full available bandwidth (10+ MB/s)
- **UI Responsiveness**: <100ms for all interactions
- **Search**: Return results within 1 second
- **Memory Usage**: <500MB for typical workloads
- **Startup Time**: <2 seconds

### 5.4 Compatibility

- **macOS**: 13.0 (Ventura) or later
- **Architecture**: Universal (Intel + Apple Silicon)
- **Display**: Support for Retina displays
- **Dark Mode**: Full support
- **Accessibility**: VoiceOver, keyboard navigation, high contrast

---

## 6. Success Metrics

### Phase 1 (NOW) Success Criteria

**Core Functionality**
- [ ] User can view all buckets
- [ ] User can navigate folder structure
- [ ] User can upload files via drag & drop
- [ ] User can download files
- [ ] User can delete files
- [ ] User can search files by name
- [ ] User can filter by file type, date, size
- [ ] User can preview text/code files with syntax highlighting
- [ ] Transfer manager tracks all uploads/downloads
- [ ] User can add/switch between multiple R2 accounts

**Quality Metrics**
- [ ] App is stable (no crashes in normal use)
- [ ] 95% of operations succeed on first try
- [ ] Search returns results within 1 second
- [ ] File preview loads within 2 seconds
- [ ] UI responds within 100ms to interactions

**User Experience**
- [ ] Onboarding flow guides first-time users
- [ ] All error messages are actionable
- [ ] Keyboard shortcuts work as expected
- [ ] App follows macOS HIG guidelines
- [ ] Dark mode looks good

---

## 7. Non-Functional Requirements

### 7.1 Security
- Store credentials in macOS Keychain (never in plain text)
- Validate all file paths to prevent directory traversal
- Use HTTPS for all API communication
- Redact sensitive data from logs
- Request only necessary entitlements

### 7.2 Reliability
- Auto-retry failed requests (exponential backoff, max 3 attempts)
- Resume interrupted uploads/downloads
- Transaction logging for debugging
- Graceful error handling
- Crash reporting (opt-in)

### 7.3 Usability
- Follow Apple Human Interface Guidelines
- Provide contextual help tooltips
- Keyboard shortcuts for all major actions
- Consistent iconography (SF Symbols)
- Respect user's system preferences (theme, accent color)

### 7.4 Performance
- Lazy loading for large lists (virtual scrolling)
- Thumbnail caching
- Debounced search (300ms)
- Concurrent operations up to configured limit
- Memory-efficient file streaming

---

## 8. Out of Scope (Explicitly NOT Included)

- iOS/iPadOS version (future consideration)
- Windows/Linux versions (future consideration)
- Web-based version (future consideration)
- Real-time collaboration features
- Built-in image/video editing
- Encryption at rest (rely on R2 features)
- CDN integration (future consideration)
- Backup/restore functionality
- Command-line interface (future consideration)

---

## 9. Glossary

- **Bucket**: Top-level container for objects in R2 storage
- **Object**: File stored in R2 with a key (path), content, and metadata
- **Key**: Full path of an object (e.g., "folder/subfolder/file.jpg")
- **Prefix**: Folder-like structure using "/" delimiter
- **ETag**: Hash of object content used as version identifier
- **Storage Class**: Performance/cost tier (Standard, Infrequent Access)
- **Presigned URL**: Temporary URL for sharing objects without authentication
- **Multipart Upload**: Chunked upload method for large files (>100MB)

---

## 10. References

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [S3 API Compatibility](https://developers.cloudflare.com/r2/api/s3/api/)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/macos)
- [SwiftUI Documentation](https://developer.apple.com/documentation/swiftui)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)

---

## 11. Version History

- **v1.2.0** (2025-10-14): Native macOS emphasis and caching strategy
  - **Emphasized native macOS app feel**: Updated goals to stress platform integration, system behaviors, and first-party app quality (not just visual design)
  - **Added Folder Listing Cache feature (3.2.6)**: In-memory cache for folder contents to prevent redundant API calls during navigation
    - LRU cache with 100 folder limit and 50MB memory cap
    - Configurable TTL (default 5 minutes)
    - Smart invalidation on mutation operations
    - Background refresh for stale data
    - User preferences for cache control in Advanced settings
  - Rationale: Improve navigation performance and reduce API load when browsing folder hierarchies

- **v1.1.0** (2025-10-14): Reorganized into NOW/LATER phases
  - Focused NOW phase on core file operations
  - Added trackpad gesture support
  - Added hex viewer for binary files
  - Added partial loading for large files
  - Separated server logs as debug feature
  - Added real-time preferences vs save-button preferences
  - Added bucket icon specification (bucket/pail icon)
  - Moved advanced features to LATER phase

- **v1.0.0** (2025-10-14): Initial PRD created
  - Core features defined
  - User stories documented
  - Technical specifications outlined

---

**Status**: Ready for Development ✅
