# Cloudflare R2 Browser - Windows Application

A modern Windows desktop application for managing Cloudflare R2 object storage with an intuitive WinUI 3 interface.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows%2010%2F11-blue.svg)
![.NET](https://img.shields.io/badge/.NET-8.0-512BD4.svg)
![WinUI](https://img.shields.io/badge/WinUI-3-0078D4.svg)

## Screenshots

> Screenshots coming soon

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [System Requirements](#system-requirements)
- [Prerequisites Setup](#prerequisites-setup)
- [Building from Source](#building-from-source)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Configuration](#configuration)
- [Features Guide](#features-guide)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [Building for Release](#building-for-release)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## Overview

Cloudflare R2 Browser is a native Windows application that provides a file explorer-like interface for managing Cloudflare R2 object storage. Built with modern WinUI 3, it offers a familiar and intuitive experience for Windows users.

### Key Highlights

- Native Windows 11 design with Mica backdrop support
- File explorer-like interface with drag-and-drop support
- Real-time transfer queue with progress tracking
- Integrated debug panel for troubleshooting
- Secure credential storage using Windows Credential Vault
- Embedded Node.js server for API communication

## Features

### Core Features

- **Bucket Management**
  - Browse all accessible R2 buckets
  - Quick bucket switching via sidebar
  - Bucket creation and deletion (coming soon)

- **File Operations**
  - Upload files and folders
  - Download objects with progress tracking
  - Delete single or multiple objects
  - Rename and move objects (coming soon)
  - Copy/paste objects between buckets (coming soon)

- **Transfer Queue**
  - Real-time upload/download progress
  - Pause, resume, and cancel transfers
  - Transfer speed and estimated time remaining
  - Success, error, and retry status tracking
  - Concurrent transfer management

- **Debug Panel**
  - API Response tab: View all HTTP requests/responses
  - Server Logs tab: Monitor Node.js server output
  - Export logs for troubleshooting
  - Real-time log streaming

- **Navigation**
  - Breadcrumb navigation for folder hierarchy
  - Back/forward navigation history
  - "Up one level" quick navigation
  - Path copy to clipboard

- **Security**
  - Windows Credential Vault integration
  - Secure credential storage
  - No plaintext credential files
  - Encrypted credential transmission

## Technology Stack

### Frontend
- **WinUI 3** - Modern Windows UI framework
- **Windows App SDK 1.5** - Windows platform APIs
- **.NET 8** - Latest .NET runtime
- **C# 12** - Modern C# language features
- **Community Toolkit MVVM** - MVVM helpers and commands
- **Community Toolkit WinUI Controls** - Additional UI controls

### Backend
- **Node.js 18+** - JavaScript runtime (embedded)
- **Fastify** - High-performance web framework
- **AWS SDK for JavaScript v3** - S3-compatible API client

### Architecture Patterns
- **MVVM (Model-View-ViewModel)** - UI architecture pattern
- **Dependency Injection** - Service lifetime management
- **Repository Pattern** - Data access abstraction
- **Command Pattern** - User action handling

## System Requirements

### Minimum Requirements

- **Operating System**: Windows 10 version 1809 (Build 17763) or later
- **RAM**: 4 GB
- **Disk Space**: 500 MB for application + storage for cached files
- **Display**: 1280x720 or higher resolution
- **Internet**: Stable connection for R2 API access

### Recommended Requirements

- **Operating System**: Windows 11 22H2 or later (for Mica backdrop)
- **RAM**: 8 GB or more
- **Disk Space**: 1 GB or more
- **Display**: 1920x1080 or higher resolution
- **Internet**: Broadband connection (10 Mbps or faster)

### Development Requirements

- **Visual Studio 2022** version 17.8 or later
- **.NET 8 SDK** (included with Visual Studio)
- **Windows App SDK** (installed via Visual Studio)
- **Node.js 18+** (for embedded server)
- **Git** (for version control)

## Prerequisites Setup

### 1. Installing Visual Studio 2022

1. Download [Visual Studio 2022](https://visualstudio.microsoft.com/vs/) (Community, Professional, or Enterprise)
2. Run the installer
3. Select the following workloads:
   - **.NET desktop development**
   - **Universal Windows Platform development** (optional, for additional tools)
4. In the "Individual components" tab, ensure these are selected:
   - Windows App SDK C# Templates
   - Windows 10 SDK (10.0.19041.0 or later)
5. Click "Install" and wait for completion

### 2. Installing Windows App SDK

The Windows App SDK is typically included with Visual Studio 2022, but you can verify/install it separately:

1. Open Visual Studio
2. Go to **Extensions > Manage Extensions**
3. Search for "Windows App SDK"
4. Install if not already present
5. Restart Visual Studio

Alternatively, install via command line:

```bash
winget install Microsoft.WindowsAppSDK
```

### 3. Installing Node.js

The application requires Node.js 18 or later for the embedded API server.

**Option 1: Official Installer**
1. Download from [nodejs.org](https://nodejs.org/)
2. Run the installer (choose LTS version 18.x or later)
3. Check "Automatically install necessary tools" option
4. Complete installation
5. Verify: `node --version` (should show v18.x.x or higher)

**Option 2: Using winget**
```bash
winget install OpenJS.NodeJS.LTS
```

**Option 3: Using nvm-windows**
```bash
# Install nvm-windows from https://github.com/coreybutler/nvm-windows
nvm install lts
nvm use lts
```

### 4. Setting Up R2 Credentials

Before running the application, you need R2 API credentials from Cloudflare:

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2 Object Storage**
3. Click **Manage R2 API Tokens**
4. Click **Create API Token**
5. Configure token:
   - **Name**: "R2 Browser App" (or your preferred name)
   - **Permissions**: Object Read & Write
   - **Bucket**: All buckets (or specific buckets)
6. Click **Create API Token**
7. Copy the credentials (you'll need these on first launch):
   - **Account ID**: Your Cloudflare account ID
   - **Access Key ID**: Generated access key
   - **Secret Access Key**: Generated secret (only shown once!)

**Important**: Save the Secret Access Key immediately - it's only shown once. Store it securely until you enter it in the application.

## Building from Source

### Quick Start

```bash
# Clone repository
git clone https://github.com/your-org/cloudflare-r2-object-storage-browser.git
cd cloudflare-r2-object-storage-browser

# Navigate to Windows application
cd applications/Windows

# Build API server (first time only)
cd ../../packages/api
npm install
npm run build
cd ../../applications/Windows

# Restore NuGet packages
dotnet restore

# Build application
dotnet build --configuration Debug

# Run application
dotnet run
```

### Using Visual Studio

1. **Open Solution**
   ```
   File > Open > Project/Solution
   Navigate to: applications/Windows/CloudflareR2Browser.sln
   ```

2. **Restore Dependencies**
   - Right-click solution in Solution Explorer
   - Select "Restore NuGet Packages"
   - Wait for restoration to complete

3. **Build Solution**
   - Menu: `Build > Build Solution` (or press `Ctrl+Shift+B`)
   - Check Output window for build status
   - Ensure no errors

4. **Run Application**
   - Press `F5` to run with debugger
   - Or press `Ctrl+F5` to run without debugger

### Build Targets

```bash
# Debug build (development)
dotnet build --configuration Debug

# Release build (optimized)
dotnet build --configuration Release

# Build for specific architecture
dotnet build --configuration Release --runtime win-x64
dotnet build --configuration Release --runtime win-arm64

# Clean build
dotnet clean
dotnet build --configuration Release
```

## Running the Application

### First Launch

1. **Start Application**
   - Double-click `CloudflareR2Browser.exe` in `bin\Debug\net8.0-windows10.0.19041.0\win-x64\`
   - Or run from Visual Studio (`F5`)

2. **Configure Credentials**
   - On first launch, you'll see a "Settings Required" message
   - Click the **Settings** button (gear icon in top-right corner)
   - Enter your R2 credentials:
     - **Account ID**: From Cloudflare dashboard
     - **Access Key ID**: From API token creation
     - **Secret Access Key**: From API token creation
   - Click **Test Connection** to verify credentials
   - Click **Save** to store credentials securely

3. **Server Startup**
   - Application automatically detects Node.js installation
   - Embedded server starts on random available port
   - Server logs appear in Debug Panel (bottom panel)
   - Wait for "Server started on port XXXXX" message

4. **Browse Buckets**
   - Once server is running, buckets load automatically
   - Click any bucket in the left sidebar to browse contents
   - Double-click folders to navigate

### Subsequent Launches

After initial setup, the application will:
- Load saved credentials from Windows Credential Vault
- Auto-start the Node.js server
- Connect to R2 and display buckets
- No configuration needed!

### Command Line Options

```bash
# Run from command line
dotnet run

# Run with specific configuration
dotnet run --configuration Release

# Run without building
dotnet run --no-build
```

## Project Structure

```
applications/Windows/
├── Assets/                      # Application assets
│   ├── AppIcon.ico             # Application icon
│   └── ...                     # Other images/assets
├── Converters/                  # XAML value converters
│   ├── BoolToVisibilityConverter.cs
│   ├── BytesToStringConverter.cs
│   ├── DateToRelativeConverter.cs
│   ├── FileIconConverter.cs
│   ├── NullToVisibilityConverter.cs
│   ├── ProgressToStringConverter.cs
│   └── StatusToColorConverter.cs
├── Helpers/                     # Utility classes
│   ├── AsyncRelayCommand.cs    # Async command implementation
│   ├── LoadingState.cs         # Loading state enum
│   ├── ObservableObject.cs     # INotifyPropertyChanged base
│   └── RelayCommand.cs         # Synchronous command implementation
├── Models/                      # Data models
│   ├── ApiModels.cs            # API request/response models
│   ├── ServerState.cs          # Server state enum
│   ├── TransferTask.cs         # Transfer queue task model
│   └── ViewModelTypes.cs       # Shared ViewModel types
├── Resources/                   # Application resources
│   ├── Icons/                  # Icon resources
│   │   └── SegoeIcons.xaml     # Segoe MDL2 Assets icons
│   ├── Styles/                 # XAML styles
│   │   ├── ButtonStyles.xaml   # Button styles
│   │   ├── ColorBrushes.xaml   # Color palette
│   │   └── ListStyles.xaml     # List/Grid styles
│   ├── AppResources.xaml       # Resource dictionary
│   └── server.cjs              # Embedded Node.js server (bundled)
├── Services/                    # Business logic layer
│   ├── CacheManager.cs         # Application cache management
│   ├── FolderCache.cs          # Folder hierarchy caching
│   ├── NodeServerManager.cs    # Node.js server lifecycle
│   ├── R2ApiClient.cs          # R2 API HTTP client
│   └── SettingsManager.cs      # Credential vault management
├── ViewModels/                  # MVVM ViewModels
│   ├── BucketSidebarViewModel.cs
│   ├── DebugPanelViewModel.cs
│   ├── FileListViewModel.cs
│   ├── MainViewModel.cs        # Root ViewModel
│   ├── SettingsViewModel.cs
│   └── TransferManagerViewModel.cs
├── Views/                       # XAML UI components
│   ├── BreadcrumbView.xaml[.cs]
│   ├── BucketSidebarView.xaml[.cs]
│   ├── DebugPanelView.xaml[.cs]
│   ├── FileListView.xaml[.cs]
│   ├── ToolbarView.xaml[.cs]
│   └── TransferQueuePanel.xaml[.cs]
├── App.xaml[.cs]               # Application entry point
├── CloudflareR2Browser.csproj  # Project file
├── MainWindow.xaml[.cs]        # Main application window
├── Package.appxmanifest        # MSIX packaging manifest
└── app.manifest                # Windows application manifest
```

### Key Directories

#### `/Services`
Contains all business logic and external service communication:
- **NodeServerManager**: Manages embedded Node.js server lifecycle (start, stop, port detection, log streaming)
- **R2ApiClient**: HTTP client for communicating with Node.js API (buckets, objects, uploads, downloads)
- **SettingsManager**: Securely stores/retrieves credentials using Windows Credential Vault
- **CacheManager**: In-memory cache for API responses (reduces API calls)
- **FolderCache**: Specialized cache for folder hierarchies

#### `/ViewModels`
MVVM ViewModels that contain UI logic and state:
- **MainViewModel**: Root ViewModel, coordinates all other ViewModels
- **BucketSidebarViewModel**: Manages bucket list state and selection
- **FileListViewModel**: Handles file/folder display, navigation, selection
- **TransferManagerViewModel**: Manages transfer queue state and operations
- **DebugPanelViewModel**: Collects API logs and server output
- **SettingsViewModel**: Manages settings dialog state

#### `/Views`
XAML UI components (code-behind is minimal, logic in ViewModels):
- **BucketSidebarView**: Left sidebar with bucket list
- **FileListView**: Main file/folder grid view
- **ToolbarView**: Top toolbar with action buttons
- **BreadcrumbView**: Navigation breadcrumb trail
- **TransferQueuePanel**: Bottom panel showing active transfers
- **DebugPanelView**: Debug panel with API logs and server output

#### `/Converters`
XAML value converters for data binding:
- **BoolToVisibilityConverter**: Converts bool to Visibility (for showing/hiding UI)
- **BytesToStringConverter**: Formats bytes as human-readable strings (KB, MB, GB)
- **DateToRelativeConverter**: Converts DateTime to relative strings ("2 hours ago")
- **FileIconConverter**: Returns appropriate icon based on file type
- **NullToVisibilityConverter**: Shows/hides UI based on null values
- **ProgressToStringConverter**: Formats progress percentage
- **StatusToColorConverter**: Maps transfer status to color brushes

#### `/Models`
Data models and DTOs:
- **ApiModels**: Request/response models matching API schema
- **TransferTask**: Represents upload/download operation
- **ServerState**: Enum for server lifecycle states
- **ViewModelTypes**: Shared types used across ViewModels

#### `/Helpers`
Reusable utility classes:
- **ObservableObject**: Base class implementing `INotifyPropertyChanged`
- **RelayCommand**: `ICommand` implementation for synchronous operations
- **AsyncRelayCommand**: `ICommand` implementation for async operations
- **LoadingState**: Enum for loading states (Idle, Loading, Success, Error)

#### `/Resources`
Application-wide resources:
- **server.cjs**: Bundled Node.js server (auto-copied from `packages/api` during build)
- **Styles/**: XAML resource dictionaries for consistent UI styling
- **Icons/**: Segoe MDL2 Assets icon references

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Windows Application                     │
│                         (WinUI 3)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Views     │◄─┤  ViewModels  │◄─┤   Services   │      │
│  │    (XAML)    │  │   (MVVM)     │  │  (Business)  │      │
│  └──────────────┘  └──────────────┘  └──────┬───────┘      │
│                                              │               │
│                                              │ HTTP          │
└──────────────────────────────────────────────┼───────────────┘
                                               │
                                               ▼
                                    ┌─────────────────┐
                                    │  Node.js Server │
                                    │    (Fastify)    │
                                    └────────┬────────┘
                                             │ S3 API
                                             ▼
                                    ┌─────────────────┐
                                    │  Cloudflare R2  │
                                    │ Object Storage  │
                                    └─────────────────┘
```

### MVVM Pattern

The application strictly follows the MVVM (Model-View-ViewModel) pattern:

**View (XAML)**
- Pure UI markup
- Data binding expressions
- Minimal code-behind (only for UI-specific logic)
- Example: `FileListView.xaml`

**ViewModel**
- UI state management
- User interaction commands
- Business logic orchestration
- Example: `FileListViewModel.cs`

**Model**
- Data structures
- API response DTOs
- Domain entities
- Example: `ApiModels.cs`

### Dependency Injection

Services and ViewModels are registered in `App.xaml.cs`:

```csharp
// Singleton services (shared across app)
services.AddSingleton<NodeServerManager>();
services.AddSingleton<R2ApiClient>();
services.AddSingleton<SettingsManager>();

// Transient ViewModels (new instance per use)
services.AddTransient<FileListViewModel>();
services.AddTransient<SettingsViewModel>();
```

**Why Singleton vs Transient?**
- **Singleton**: Services that maintain state (server manager, API client, settings)
- **Transient**: ViewModels that are created/destroyed with their views

### Service Layer

All business logic lives in services:

1. **NodeServerManager**
   - Detects Node.js installation
   - Starts/stops embedded server process
   - Monitors server logs (stdout/stderr)
   - Parses server port from output

2. **R2ApiClient**
   - Makes HTTP calls to Node.js server
   - Handles authentication
   - Parses API responses
   - Error handling and retry logic

3. **SettingsManager**
   - Stores credentials in Windows Credential Vault
   - Retrieves credentials on startup
   - Provides secure credential access

4. **CacheManager**
   - In-memory cache for API responses
   - TTL-based expiration
   - Cache invalidation on mutations

### Data Flow Example: Loading Buckets

```
User clicks "Refresh"
      │
      ▼
BucketSidebarViewModel.RefreshCommand
      │
      ▼
R2ApiClient.GetBucketsAsync()
      │
      ▼ HTTP GET /buckets
NodeServerManager (localhost:PORT)
      │
      ▼ S3 ListBuckets API
Cloudflare R2
      │
      ▼ Response
R2ApiClient parses JSON
      │
      ▼
BucketSidebarViewModel updates Buckets collection
      │
      ▼
BucketSidebarView UI updates (via data binding)
```

### Windows Credential Vault Integration

Credentials are stored using the Windows Credential Manager API:

```csharp
// Save credentials
var vault = new PasswordVault();
var credential = new PasswordCredential(
    "CloudflareR2Browser",  // Resource name
    "AccessKeyId",          // Username field
    accessKeyId             // Password field
);
vault.Add(credential);
```

Credentials are encrypted by Windows and accessible only to the application and user account that saved them.

### Embedded Server Architecture

The Node.js server (`server.cjs`) is:
1. Bundled into `Resources/` during build
2. Extracted and started at runtime
3. Communicates via HTTP on random port
4. Logs streamed to Debug Panel
5. Gracefully shut down on app exit

**Why an embedded server?**
- Avoids CORS issues with direct R2 API calls
- Centralizes credential management
- Provides consistent API across platforms (Windows, macOS, Electron)
- Allows future API enhancements without rebuilding UI

## Configuration

### R2 Credentials

#### Via Settings UI (Recommended)

1. Click **Settings** button (gear icon) in top-right toolbar
2. Enter credentials:
   - **Account ID**: Your Cloudflare account ID (e.g., `a1b2c3d4e5f6g7h8`)
   - **Access Key ID**: R2 API token access key
   - **Secret Access Key**: R2 API token secret
3. Click **Test Connection** to verify
4. Click **Save** to store in Windows Credential Vault

#### Credential Format

- **Account ID**: 32-character hexadecimal string
- **Access Key ID**: 64-character alphanumeric string
- **Secret Access Key**: 64-character alphanumeric string (shown only once when created)

#### Security Notes

- Credentials are stored in **Windows Credential Vault** (encrypted)
- Never stored in plaintext files
- Only accessible to current Windows user account
- Cleared on uninstall (optional, user-controlled)

### Server Configuration

The Node.js server is auto-configured but can be customized:

#### Node.js Path Detection

The application automatically detects Node.js in this order:
1. `PATH` environment variable
2. `C:\Program Files\nodejs\node.exe`
3. `%AppData%\nvm\*\node.exe` (nvm-windows)

To use a specific Node.js version:
```bash
# Set Node.js path in PATH environment variable
setx PATH "%PATH%;C:\path\to\node"
```

#### Port Selection

The server selects a random available port (e.g., 54321). This:
- Avoids port conflicts
- Improves security (unpredictable)
- Allows multiple instances (if needed)

Port is detected by parsing server stdout for `PORT=XXXXX` message.

#### Server Script Location

Production: `Resources\server.cjs` (bundled in app)
Development: `..\..\packages\api\outputs\server.cjs` (monorepo path)

The build script automatically copies `server.cjs` from the API package during compilation.

## Features Guide

### Bucket Management

#### Viewing Buckets

1. Launch application
2. Buckets load automatically in left sidebar
3. Each bucket shows:
   - Bucket name
   - Creation date (hover for full timestamp)
   - Object count (coming soon)

#### Selecting a Bucket

- **Click** any bucket in sidebar
- Bucket contents load in main panel
- Breadcrumb shows current location
- URL/path displayed in address bar

#### Refreshing Buckets

- Click **Refresh** button in toolbar (or press `Ctrl+R`)
- Sidebar refreshes bucket list
- Cache is invalidated

### File Operations

#### Browsing Files

1. Select a bucket
2. Files and folders appear in grid view
3. Columns show:
   - **Name**: File/folder name with icon
   - **Size**: Human-readable size (B, KB, MB, GB)
   - **Type**: File extension or "Folder"
   - **Modified**: Relative time ("2 hours ago") or absolute date

#### Navigating Folders

**Double-Click Navigation**
- Double-click any folder to open
- Current folder shown in breadcrumb
- Back/Forward buttons enabled

**Breadcrumb Navigation**
- Click any breadcrumb segment to jump to that level
- Click "Home" (bucket icon) to return to root

**Keyboard Navigation**
- `Ctrl+[`: Navigate back
- `Ctrl+]`: Navigate forward
- `Ctrl+↑`: Go up one level

#### Uploading Files

**Via Toolbar Button**
1. Navigate to desired folder (or stay at root)
2. Click **Upload** button in toolbar
3. Select one or more files in file picker
4. Click **Open**
5. Upload begins, progress shown in Transfer Queue

**Via Drag and Drop** (Coming Soon)
1. Open Windows Explorer
2. Select files
3. Drag files into R2 Browser window
4. Drop onto file list
5. Upload starts automatically

**Upload Progress**
- Transfer appears in Transfer Queue panel (bottom)
- Shows: filename, size, progress bar, speed, ETA
- Status indicator: uploading (blue), success (green), failed (red)

#### Downloading Files

1. Select one or more files in grid
2. Click **Download** button in toolbar
3. Choose destination folder in folder picker
4. Click **Select Folder**
5. Download begins, progress shown in Transfer Queue

**Download Options**
- Single file: Original filename preserved
- Multiple files: All downloaded to selected folder
- Folders: Coming soon (will download all contents recursively)

#### Deleting Files

1. Select one or more files/folders
2. Click **Delete** button in toolbar (or press `Delete` key)
3. Confirm deletion in dialog
4. Files are permanently deleted from R2
5. Grid refreshes to show updated contents

**Deletion Notes**
- **Irreversible**: No recycle bin or undo
- **Folders**: Deleting a folder deletes all contents
- **Multiple selection**: All selected items deleted
- **Confirmation**: Always asks before deletion

#### Selecting Files

- **Single selection**: Click any file/folder
- **Multi-selection**: Hold `Ctrl` and click multiple items
- **Range selection**: Click first item, hold `Shift`, click last item
- **Select all**: Press `Ctrl+A`
- **Deselect**: Click empty space in grid

#### Sorting and Filtering

**Sorting**
- Click column headers to sort
- Click again to reverse order
- Supported columns: Name, Size, Type, Modified

**Filtering** (Coming Soon)
- Type in search box to filter by name
- Filter by type (files/folders)
- Filter by date range

### Transfer Queue

The Transfer Queue panel shows all active, completed, and failed transfers.

#### Viewing Transfers

- Panel is always visible at bottom of window
- Toggle visibility with **Show/Hide Transfers** button
- Shows up to 100 most recent transfers
- Auto-scrolls to newest transfer

#### Transfer States

Each transfer shows:
- **Queued**: Waiting to start (gray)
- **Running**: Actively transferring (blue, animated)
- **Completed**: Successfully finished (green)
- **Failed**: Error occurred (red)
- **Canceled**: User canceled (orange)

#### Managing Transfers

**Pause/Resume**
1. Hover over running transfer
2. Click **Pause** button
3. Transfer pauses, can be resumed later
4. Click **Resume** to continue

**Cancel**
1. Hover over running/paused transfer
2. Click **Cancel** button
3. Transfer stops, partial data discarded

**Retry Failed**
1. Hover over failed transfer
2. Click **Retry** button
3. Transfer restarts from beginning

**Clear Completed**
- Click **Clear** button in Transfer Queue toolbar
- Removes all completed transfers from list
- Does not affect files (already transferred)

#### Transfer Details

Each transfer row shows:
- **Icon**: File type icon
- **Name**: Filename being transferred
- **Size**: Total file size
- **Progress**: Visual progress bar with percentage
- **Speed**: Current transfer speed (KB/s, MB/s)
- **ETA**: Estimated time remaining
- **Status**: Current state (see above)

### Debug Panel

The Debug Panel helps troubleshoot issues by showing API calls and server logs.

#### Opening Debug Panel

- Click **Debug** button in top-right toolbar (bug icon)
- Panel appears at bottom (pushes Transfer Queue aside)
- Two tabs: **API Response** and **Server Logs**

#### API Response Tab

Shows all HTTP requests and responses:

**Request Information**
- HTTP method (GET, POST, DELETE)
- URL path
- Request headers
- Request body (for POST/PUT)
- Timestamp

**Response Information**
- Status code (200, 404, 500, etc.)
- Response headers
- Response body (formatted JSON)
- Duration (ms)

**Features**
- Syntax-highlighted JSON
- Collapsible request/response sections
- Filter by status code (coming soon)
- Export to JSON file

#### Server Logs Tab

Shows real-time Node.js server output:

**Log Entries**
- Timestamp (HH:MM:SS)
- Log level (INFO, WARN, ERROR)
- Message text
- Source (stdout or stderr)

**Features**
- Auto-scroll to newest log
- Filter by log level
- Search logs
- Export to text file

#### Exporting Logs

1. Open Debug Panel
2. Switch to desired tab (API Response or Server Logs)
3. Click **Export** button
4. Choose save location
5. Logs saved as JSON (API) or TXT (Server Logs)

Use exported logs to:
- Share with support team
- Debug complex issues
- Track API usage
- Audit operations

### Settings

#### Accessing Settings

- Click **Settings** button (gear icon) in top-right toolbar
- Settings dialog appears

#### Credential Management

**Viewing Current Credentials**
- Account ID is shown (partially masked)
- Access Key ID is shown (partially masked)
- Secret Access Key is never shown (security)

**Updating Credentials**
1. Enter new Account ID, Access Key ID, and Secret Access Key
2. Click **Test Connection** to verify
3. If successful, click **Save**
4. Server restarts with new credentials
5. Buckets reload automatically

**Clearing Credentials**
1. Click **Clear** button
2. Confirm deletion
3. Credentials removed from Windows Credential Vault
4. Server stops
5. Application returns to "Not Configured" state

#### Testing Connection

The **Test Connection** button:
1. Validates credential format
2. Attempts to list buckets using credentials
3. Shows success or error message
4. Does **not** save credentials (use **Save** for that)

Use this to verify credentials before saving.

#### Application Settings (Coming Soon)

- Theme selection (Light, Dark, System)
- Language preference
- Cache settings
- Transfer concurrency limits
- Auto-update preferences

## Keyboard Shortcuts

### Navigation

| Shortcut | Action |
|----------|--------|
| `Ctrl+R` | Refresh current view |
| `Ctrl+[` | Navigate back |
| `Ctrl+]` | Navigate forward |
| `Ctrl+↑` | Go up one level |
| `F5` | Refresh current view |

### File Operations

| Shortcut | Action |
|----------|--------|
| `Ctrl+U` | Upload files (coming soon) |
| `Ctrl+D` | Download selected files (coming soon) |
| `Delete` | Delete selected files |
| `F2` | Rename selected file (coming soon) |

### Selection

| Shortcut | Action |
|----------|--------|
| `Ctrl+A` | Select all items |
| `Ctrl+Click` | Add/remove item from selection |
| `Shift+Click` | Select range of items |
| `Escape` | Clear selection |

### Application

| Shortcut | Action |
|----------|--------|
| `Ctrl+,` | Open Settings (coming soon) |
| `F1` | Open Help (coming soon) |
| `Alt+F4` | Close application |

## Troubleshooting

### Server Won't Start

**Symptom**: Application shows "Server not running" or hangs on startup

**Solutions**:

1. **Check Node.js Installation**
   ```bash
   node --version
   ```
   - Should show `v18.x.x` or higher
   - If not installed, see [Prerequisites Setup](#3-installing-nodejs)

2. **Verify server.cjs Exists**
   - Check `Resources\server.cjs` in application directory
   - If missing, rebuild application:
     ```bash
     cd packages/api
     npm run build
     cd ../../applications/Windows
     dotnet build
     ```

3. **Check Port Conflicts**
   - Server uses random port, but may fail if no ports available
   - Close other applications using network ports
   - Restart application

4. **View Server Logs**
   - Open Debug Panel (bug icon)
   - Switch to **Server Logs** tab
   - Look for error messages (red text)
   - Common errors:
     - `node: not found` → Node.js not installed
     - `Cannot find module` → server.cjs missing or corrupted
     - `EADDRINUSE` → Port conflict (rare)

5. **Check Firewall**
   - Windows Firewall may block Node.js
   - Allow Node.js through firewall:
     1. Open Windows Security
     2. Go to Firewall & network protection
     3. Click "Allow an app through firewall"
     4. Click "Change settings"
     5. Find "Node.js" and check all boxes
     6. Click OK
   - Restart application

### Credentials Not Saving

**Symptom**: After entering credentials and clicking Save, application still shows "Not Configured"

**Solutions**:

1. **Check Windows Credential Vault Permissions**
   - Open Credential Manager (Control Panel)
   - Verify you can add/view credentials
   - If permission error, run as Administrator (right-click > Run as Administrator)

2. **Clear Corrupted Credentials**
   ```
   Control Panel > Credential Manager > Windows Credentials
   Look for "CloudflareR2Browser" entries
   Remove all, then re-enter in application
   ```

3. **Verify Credential Format**
   - Account ID: 32 characters (hex)
   - Access Key ID: 64 characters (alphanumeric)
   - Secret Access Key: 64 characters (alphanumeric)
   - No spaces or special characters

4. **Test Connection First**
   - Always click **Test Connection** before **Save**
   - Ensures credentials are valid
   - Saves only after successful test

### Files Won't Upload

**Symptom**: Upload starts but fails immediately or hangs at 0%

**Solutions**:

1. **Check Internet Connection**
   - Verify you can access internet
   - Test with browser: visit https://cloudflare.com

2. **Verify R2 Credentials**
   - Open Settings
   - Click **Test Connection**
   - If fails, re-enter credentials

3. **Check File Size**
   - R2 maximum object size: 5 TB
   - Application may have lower limits (check Transfer Queue error message)

4. **Check File Permissions**
   - Ensure you have read access to file
   - Try copying file to another location, then upload

5. **Check R2 Bucket Permissions**
   - Verify API token has write access to bucket
   - Check Cloudflare dashboard: R2 > Manage API Tokens
   - Token should have "Object Write" permission

6. **Review API Logs**
   - Open Debug Panel > API Response tab
   - Look for upload request
   - Check response status code:
     - `401 Unauthorized` → Invalid credentials
     - `403 Forbidden` → Insufficient permissions
     - `413 Payload Too Large` → File exceeds limit
     - `500 Internal Server Error` → R2 service issue (retry later)

### Application Crashes on Startup

**Symptom**: Application closes immediately after launch, or shows error dialog

**Solutions**:

1. **Check Windows Version**
   ```
   winver
   ```
   - Minimum: Windows 10 version 1809 (Build 17763)
   - Recommended: Windows 11 22H2 or later

2. **Update Windows**
   - Settings > Windows Update
   - Install all available updates
   - Restart computer

3. **Reinstall .NET Runtime**
   ```bash
   winget install Microsoft.DotNet.Runtime.8
   ```

4. **Reinstall Windows App SDK**
   ```bash
   winget install Microsoft.WindowsAppSDK
   ```

5. **Check Event Viewer**
   - Open Event Viewer (eventvwr.msc)
   - Navigate to Windows Logs > Application
   - Look for errors from "CloudflareR2Browser"
   - Note error codes and messages

6. **Clean Reinstall**
   ```bash
   # Uninstall application
   # Delete application data
   rd /s /q "%LocalAppData%\CloudflareR2Browser"

   # Rebuild and reinstall
   cd applications/Windows
   dotnet clean
   dotnet build --configuration Release
   ```

### Slow Performance

**Symptom**: UI is sluggish, transfers are slow, or application freezes

**Solutions**:

1. **Check CPU/Memory Usage**
   - Open Task Manager (`Ctrl+Shift+Esc`)
   - Look for "CloudflareR2Browser.exe" and "node.exe"
   - If high usage, close other applications

2. **Clear Cache**
   - Coming soon (Settings > Clear Cache)
   - For now, restart application

3. **Reduce Concurrent Transfers**
   - Avoid uploading/downloading too many files simultaneously
   - Queue transfers instead

4. **Check Network Speed**
   - Test internet speed: https://speed.cloudflare.com
   - Slow speeds affect R2 operations

5. **Disable Mica Backdrop** (Windows 11)
   - Coming soon (Settings > Appearance > Disable Mica)
   - Mica backdrop can impact performance on older hardware

### Common Error Messages

#### "Node.js not found"

**Cause**: Node.js is not installed or not in PATH

**Fix**: Install Node.js 18+ from https://nodejs.org/

#### "Server script (server.cjs) not found"

**Cause**: Bundled server script is missing

**Fix**: Rebuild application:
```bash
cd packages/api
npm run build
cd ../../applications/Windows
dotnet build
```

#### "Failed to connect to R2"

**Cause**: Invalid credentials or network issue

**Fix**:
1. Verify credentials in Settings
2. Click "Test Connection"
3. Check internet connection
4. Try again

#### "Access denied"

**Cause**: R2 API token lacks required permissions

**Fix**:
1. Open Cloudflare dashboard
2. Navigate to R2 > Manage API Tokens
3. Edit token or create new one with "Object Read & Write" permissions
4. Update credentials in application

## Development

### Development Environment Setup

1. **Clone Repository**
   ```bash
   git clone https://github.com/your-org/cloudflare-r2-object-storage-browser.git
   cd cloudflare-r2-object-storage-browser
   ```

2. **Install Dependencies**
   ```bash
   # API server dependencies
   cd packages/api
   npm install
   npm run build

   # Windows app dependencies (NuGet packages)
   cd ../../applications/Windows
   dotnet restore
   ```

3. **Open in Visual Studio**
   ```
   File > Open > Project/Solution
   Select: applications/Windows/CloudflareR2Browser.sln
   ```

4. **Configure Launch Settings** (optional)
   - Edit `Properties/launchSettings.json`
   - Set environment variables, command line args

5. **Start Development**
   - Press `F5` to run with debugger
   - Make changes, save, and Visual Studio rebuilds automatically

### Project Architecture

See [Architecture](#architecture) section for detailed architecture overview.

### Adding a New View

**Example**: Adding a "Bucket Settings" view

1. **Create XAML View**
   ```
   Right-click "Views" folder > Add > New Item > Blank Page (WinUI 3)
   Name: BucketSettingsView.xaml
   ```

2. **Create ViewModel**
   ```csharp
   // ViewModels/BucketSettingsViewModel.cs
   using CloudflareR2Browser.Helpers;

   namespace CloudflareR2Browser.ViewModels;

   public class BucketSettingsViewModel : ObservableObject
   {
       private string _bucketName = string.Empty;
       public string BucketName
       {
           get => _bucketName;
           set => SetProperty(ref _bucketName, value);
       }

       public AsyncRelayCommand SaveCommand { get; }

       public BucketSettingsViewModel()
       {
           SaveCommand = new AsyncRelayCommand(SaveAsync);
       }

       private async Task SaveAsync()
       {
           // Save logic
       }
   }
   ```

3. **Register ViewModel in DI Container**
   ```csharp
   // App.xaml.cs
   services.AddTransient<BucketSettingsViewModel>();
   ```

4. **Wire Up in Parent View**
   ```xaml
   <!-- MainWindow.xaml or wherever you want to show it -->
   <views:BucketSettingsView
       DataContext="{Binding BucketSettingsViewModel}" />
   ```

### Adding a New Service

**Example**: Adding an analytics service

1. **Create Service Class**
   ```csharp
   // Services/AnalyticsService.cs
   using Microsoft.Extensions.Logging;

   namespace CloudflareR2Browser.Services;

   public sealed class AnalyticsService
   {
       private readonly ILogger<AnalyticsService> _logger;

       public AnalyticsService(ILogger<AnalyticsService> logger)
       {
           _logger = logger;
       }

       public void TrackEvent(string eventName, Dictionary<string, object> properties)
       {
           _logger.LogInformation("Event: {EventName}, Properties: {@Properties}",
               eventName, properties);
           // Send to analytics backend
       }
   }
   ```

2. **Register in DI Container**
   ```csharp
   // App.xaml.cs
   services.AddSingleton<AnalyticsService>();
   ```

3. **Inject into ViewModels**
   ```csharp
   public class MainViewModel
   {
       private readonly AnalyticsService _analytics;

       public MainViewModel(AnalyticsService analytics)
       {
           _analytics = analytics;
       }

       private void OnBucketSelected()
       {
           _analytics.TrackEvent("BucketSelected", new()
           {
               ["BucketName"] = selectedBucket.Name
           });
       }
   }
   ```

### Adding a New Converter

**Example**: Adding a status icon converter

1. **Create Converter Class**
   ```csharp
   // Converters/StatusToIconConverter.cs
   using Microsoft.UI.Xaml.Data;

   namespace CloudflareR2Browser.Converters;

   public class StatusToIconConverter : IValueConverter
   {
       public object Convert(object value, Type targetType, object parameter, string language)
       {
           if (value is TransferStatus status)
           {
               return status switch
               {
                   TransferStatus.Running => "\uE768", // Play icon
                   TransferStatus.Completed => "\uE73E", // Checkmark
                   TransferStatus.Failed => "\uE783", // Error icon
                   _ => "\uE711" // Help icon
               };
           }
           return "\uE711";
       }

       public object ConvertBack(object value, Type targetType, object parameter, string language)
       {
           throw new NotImplementedException();
       }
   }
   ```

2. **Register in XAML**
   ```xaml
   <!-- App.xaml or view-specific resources -->
   <Application.Resources>
       <converters:StatusToIconConverter x:Key="StatusToIconConverter" />
   </Application.Resources>
   ```

3. **Use in Binding**
   ```xaml
   <FontIcon Glyph="{Binding Status, Converter={StaticResource StatusToIconConverter}}" />
   ```

### Debugging Tips

#### Using Breakpoints

1. Set breakpoints in `.cs` files (click left margin or press `F9`)
2. Run with debugger (`F5`)
3. When breakpoint hits:
   - Inspect variables in Locals/Autos window
   - Evaluate expressions in Immediate window (`Ctrl+Alt+I`)
   - Step through code (`F10` = step over, `F11` = step into)

#### Debugging XAML

1. Enable **XAML Hot Reload**
   - Debug > Options > Debugging > Hot Reload
   - Check "Enable XAML Hot Reload"
2. Make XAML changes while debugging
3. Changes apply immediately without rebuild

#### Debugging Data Bindings

1. Enable **Output Debug Strings**
   ```xaml
   <TextBlock Text="{Binding InvalidProperty,
       PresentationTraceSources.TraceLevel=High}" />
   ```
2. Check Output window for binding errors
3. Look for messages like "Cannot resolve property 'InvalidProperty'"

#### Using Debug Panel

1. Run application
2. Click Debug button (bug icon)
3. View API calls in real-time
4. Export logs for offline analysis

#### Logging Best Practices

```csharp
// Use appropriate log levels
_logger.LogDebug("Detailed debugging info");        // Development only
_logger.LogInformation("General informational");    // Important events
_logger.LogWarning("Something unexpected");         // Potential issues
_logger.LogError(ex, "Operation failed");           // Errors with exceptions

// Include context
_logger.LogInformation("Uploading file {FileName} to bucket {BucketName}",
    fileName, bucketName);
```

### Testing

#### Manual Testing

1. **Test Upload**
   - Small file (<1 MB)
   - Medium file (10-100 MB)
   - Large file (>100 MB)
   - Multiple files simultaneously
   - Upload to root vs subfolder

2. **Test Download**
   - Single file
   - Multiple files
   - Large files

3. **Test Delete**
   - Single file
   - Multiple files
   - Empty folder
   - Folder with contents (when implemented)

4. **Test Navigation**
   - Folder navigation (double-click, breadcrumb)
   - Back/forward buttons
   - "Up one level" button
   - Keyboard shortcuts

5. **Test Error Scenarios**
   - Invalid credentials
   - Network disconnection during transfer
   - Deleting non-existent object
   - Permission errors

#### Unit Testing (Coming Soon)

Framework: xUnit, Moq

```csharp
[Fact]
public async Task GetBucketsAsync_ReturnsListOfBuckets()
{
    // Arrange
    var mockClient = new Mock<R2ApiClient>();
    mockClient.Setup(x => x.GetBucketsAsync())
        .ReturnsAsync(new[] { new Bucket { Name = "test-bucket" } });

    var viewModel = new BucketSidebarViewModel(mockClient.Object);

    // Act
    await viewModel.LoadBucketsAsync();

    // Assert
    Assert.Single(viewModel.Buckets);
    Assert.Equal("test-bucket", viewModel.Buckets[0].Name);
}
```

### Code Style Guidelines

Follow Microsoft's C# coding conventions:

**Naming**
- PascalCase for classes, methods, properties, public fields
- camelCase for private fields, local variables, parameters
- Prefix private fields with `_`
- Use descriptive names

```csharp
// Good
private readonly ILogger<MainViewModel> _logger;
public string BucketName { get; set; }
private async Task LoadBucketsAsync() { }

// Bad
private readonly ILogger<MainViewModel> logger;
public string bucketName { get; set; }
private async Task LoadBuckets() { }
```

**Formatting**
- 4 spaces indentation (not tabs)
- Opening braces on new line
- Use `var` for obvious types
- One statement per line

```csharp
// Good
var client = new HttpClient();
if (condition)
{
    DoSomething();
}

// Bad
HttpClient client = new HttpClient();
if (condition) { DoSomething(); }
```

**XAML**
- Use kebab-case for attribute names... actually, use PascalCase (C# convention)
- Use `x:Name` for code-behind references
- Use `x:Key` for resources
- Indent nested elements

```xaml
<!-- Good -->
<Button x:Name="UploadButton"
        Content="Upload"
        Command="{Binding UploadCommand}"
        Margin="8,0,0,0" />

<!-- Bad -->
<Button x:Name="UploadButton" Content="Upload" Command="{Binding UploadCommand}" Margin="8,0,0,0" />
```

### Performance Optimization

#### Virtualization

For large lists, use `ItemsRepeater` with virtualization:

```xaml
<ItemsRepeater ItemsSource="{Binding Files}"
               VirtualizingLayout="{StaticResource StackLayout}">
    <ItemsRepeater.ItemTemplate>
        <DataTemplate>
            <FileItemControl />
        </DataTemplate>
    </ItemsRepeater.ItemTemplate>
</ItemsRepeater>
```

#### Async/Await Best Practices

- Always `await` async methods
- Use `ConfigureAwait(false)` in libraries
- Don't block on async code (`Task.Wait()`, `.Result`)

```csharp
// Good
await LoadBucketsAsync();

// Bad
LoadBucketsAsync().Wait();
var result = LoadBucketsAsync().Result;
```

#### Memory Management

- Dispose `IDisposable` resources
- Use `using` statements or declarations
- Unsubscribe from events

```csharp
// Good
using var httpClient = new HttpClient();
await httpClient.GetAsync(url);

// Also good
using (var stream = File.OpenRead(path))
{
    await ProcessStreamAsync(stream);
}

// Manual disposal
try
{
    var resource = CreateResource();
    UseResource(resource);
}
finally
{
    resource?.Dispose();
}
```

## Building for Release

### Local Release Build

```bash
# Clean previous builds
dotnet clean --configuration Release

# Restore packages
dotnet restore

# Build release
dotnet build --configuration Release

# Output location:
# bin/Release/net8.0-windows10.0.19041.0/win-x64/
```

### Publishing as Self-Contained

```bash
# Publish for x64 (most common)
dotnet publish --configuration Release --runtime win-x64 --self-contained

# Publish for ARM64 (Windows on ARM)
dotnet publish --configuration Release --runtime win-arm64 --self-contained

# Output location:
# bin/Release/net8.0-windows10.0.19041.0/win-x64/publish/
```

**Self-contained** means:
- Includes .NET runtime
- No .NET installation required on target machine
- Larger package size (~100 MB vs ~10 MB)
- Recommended for distribution

### Creating MSIX Package

MSIX is the modern Windows app packaging format, supporting:
- Microsoft Store distribution
- Automatic updates
- Clean install/uninstall
- App sandboxing (optional)

#### Via Visual Studio

1. **Configure Packaging Project** (if not already done)
   - Right-click solution > Add > New Project
   - Choose "Windows Application Packaging Project"
   - Add CloudflareR2Browser as reference

2. **Edit Package Manifest**
   - Open `Package.appxmanifest`
   - Set:
     - **Display Name**: "Cloudflare R2 Browser"
     - **Publisher**: Your certificate subject (e.g., `CN=YourName`)
     - **Version**: `1.0.0.0`
     - **Description**: "Manage Cloudflare R2 object storage"
   - Save

3. **Create App Packages**
   - Right-click packaging project > Publish > Create App Packages
   - Choose "Sideloading" (for non-Store distribution)
   - Select certificate:
     - Use existing certificate, or
     - Create new test certificate (for testing only)
   - Configure:
     - Architectures: x64, ARM64
     - Build configuration: Release
     - Versioning: Automatic increment
   - Click "Create"
   - Output in `AppPackages/` folder

4. **Test Installation**
   ```powershell
   # Install MSIX
   Add-AppxPackage -Path "AppPackages\CloudflareR2Browser_1.0.0.0_x64.msix"

   # Run from Start Menu
   # Or: shell:AppsFolder
   ```

#### Via Command Line

```bash
# Build MSIX package
msbuild /p:Configuration=Release /p:Platform=x64 /p:AppxBundle=Always

# Or using dotnet (if configured)
dotnet publish -c Release -r win-x64 /p:GenerateAppxPackageOnBuild=true
```

### Code Signing

For distribution outside Microsoft Store, you need to sign the MSIX package.

#### Create Certificate (Development)

```powershell
# Create self-signed certificate (testing only!)
New-SelfSignedCertificate -Type CodeSigningCert `
    -Subject "CN=Your Name" `
    -KeyUsage DigitalSignature `
    -FriendlyName "R2 Browser Code Signing" `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.3")

# Export certificate
Export-Certificate -Cert (Get-ChildItem Cert:\CurrentUser\My -CodeSigningCert)[0] `
    -FilePath "certificate.cer"
```

#### Sign MSIX Package

```powershell
# Sign using SignTool (from Windows SDK)
& "C:\Program Files (x86)\Windows Kits\10\bin\10.0.22621.0\x64\signtool.exe" sign `
    /fd SHA256 `
    /a `
    /f "certificate.pfx" `
    /p "password" `
    "CloudflareR2Browser_1.0.0.0_x64.msix"
```

#### Install Certificate on Target Machine

Users must install the certificate before installing the app:

```powershell
# Install certificate (run as Administrator)
Import-Certificate -FilePath "certificate.cer" `
    -CertStoreLocation "Cert:\LocalMachine\TrustedPeople"
```

**For production**: Use a certificate from a trusted Certificate Authority (CA) like DigiCert or Sectigo.

### Distribution Options

1. **Direct Download**
   - Host MSIX on website
   - Users download and install
   - Provide installation instructions

2. **Microsoft Store**
   - Submit to Microsoft Partner Center
   - Automatic updates
   - Trusted distribution
   - $19 one-time registration fee

3. **winget (Windows Package Manager)**
   - Submit to winget-pkgs repository
   - Users install via: `winget install CloudflareR2Browser`
   - Free, community-driven

4. **Chocolatey**
   - Create Chocolatey package
   - Users install via: `choco install cloudflare-r2-browser`
   - Requires package maintenance

## Contributing

We welcome contributions! Please follow these guidelines:

### Reporting Issues

1. Check existing issues first (search)
2. Use issue templates (Bug Report, Feature Request)
3. Provide detailed information:
   - Windows version (`winver`)
   - Application version (About dialog)
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots or screen recordings
   - Debug logs (from Debug Panel)

### Pull Requests

1. **Fork Repository**
   ```bash
   # Click "Fork" on GitHub
   git clone https://github.com/YOUR_USERNAME/cloudflare-r2-object-storage-browser.git
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make Changes**
   - Follow code style guidelines
   - Add XML doc comments
   - Test thoroughly
   - Update documentation if needed

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "Add amazing feature"

   # Use conventional commits:
   # feat: Add new feature
   # fix: Fix bug
   # docs: Update documentation
   # style: Code style changes (formatting)
   # refactor: Code refactoring
   # test: Add tests
   # chore: Maintenance tasks
   ```

5. **Push to Fork**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open Pull Request**
   - Go to original repository
   - Click "Compare & pull request"
   - Fill in template:
     - Description of changes
     - Related issue number (#123)
     - Screenshots (if UI changes)
     - Checklist (tests pass, docs updated, etc.)
   - Submit PR

### Code Review Process

1. Maintainer reviews PR
2. CI/CD runs automated checks
3. Feedback provided via comments
4. Make requested changes
5. Once approved, PR is merged

### Development Workflow

1. Always work on feature branches
2. Keep branches up-to-date with main:
   ```bash
   git checkout main
   git pull upstream main
   git checkout feature/my-feature
   git rebase main
   ```
3. Write meaningful commit messages
4. Test before pushing

## License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2025 [Your Name or Organization]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

See [LICENSE](../../LICENSE) file for full license text.

## Acknowledgments

### Technologies

- **[WinUI 3](https://microsoft.github.io/microsoft-ui-xaml/)** - Modern Windows UI framework by Microsoft
- **[Windows App SDK](https://github.com/microsoft/WindowsAppSDK)** - Windows platform APIs and tools
- **[.NET](https://dotnet.microsoft.com/)** - Cross-platform development framework by Microsoft
- **[Community Toolkit](https://github.com/CommunityToolkit)** - Collection of helpers and utilities
- **[Fastify](https://fastify.dev/)** - Fast and low-overhead web framework for Node.js
- **[AWS SDK for JavaScript](https://aws.amazon.com/sdk-for-javascript/)** - S3-compatible client

### Services

- **[Cloudflare R2](https://www.cloudflare.com/products/r2/)** - S3-compatible object storage

### Inspiration

- **Windows File Explorer** - Navigation and UI patterns
- **AWS S3 Console** - Bucket/object management workflows
- **Cyberduck** - Cross-platform cloud storage browser

### Community

- **WinUI Community** - Feedback and support
- **Stack Overflow** - Problem-solving assistance
- **GitHub Sponsors** - Financial support for dependencies

---

## Support

- **Documentation**: [Full documentation](../../docs/)
- **Issues**: [GitHub Issues](https://github.com/your-org/cloudflare-r2-object-storage-browser/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/cloudflare-r2-object-storage-browser/discussions)
- **Email**: support@example.com (if applicable)

---

**Made with ❤️ for the Windows community**
