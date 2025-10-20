# Electron Project Structure

Complete Electron application structure for the Cloudflare R2 Object Storage Browser.

## Directory Overview

```
applications/Electron/
├── electron/                    # Main Process (Node.js)
│   ├── main.ts                 # Application entry point, window management, server lifecycle
│   └── preload.ts              # Context bridge for IPC communication
│
├── src/                        # Renderer Process (React + TypeScript)
│   ├── components/             # React UI Components
│   │   ├── buckets/           # Bucket-related components
│   │   │   └── BucketSidebar.tsx
│   │   ├── files/             # File/object-related components
│   │   │   ├── FileArea.tsx
│   │   │   ├── FileList.tsx
│   │   │   ├── FileRow.tsx
│   │   │   ├── ContextMenu.tsx
│   │   │   └── index.ts
│   │   ├── layout/            # Layout components
│   │   │   ├── MainLayout.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Toolbar.tsx
│   │   │   ├── Breadcrumb.tsx
│   │   │   ├── TransferPanel.tsx
│   │   │   ├── DebugPanel.tsx
│   │   │   └── index.ts
│   │   ├── transfers/         # Transfer queue components
│   │   │   └── TransferQueue.tsx
│   │   ├── debug/             # Debug panel components
│   │   │   └── DebugPanel.tsx
│   │   ├── modals/            # Modal dialogs
│   │   │   └── SettingsModal.tsx
│   │   ├── preview/           # File preview components
│   │   │   └── QuickLookModal.tsx
│   │   └── loading/           # Loading states
│   │       └── LoadingOverlay.tsx
│   │
│   ├── stores/                # Zustand State Management
│   │   ├── serverStore.ts     # Server lifecycle state
│   │   ├── settingsStore.ts   # App settings & credentials
│   │   ├── bucketStore.ts     # Bucket list state
│   │   ├── fileStore.ts       # File/object list state
│   │   ├── transferStore.ts   # Transfer queue state
│   │   ├── uiStore.ts         # UI state (panels, modals)
│   │   ├── useBucketStore.ts  # Legacy bucket store (to be removed)
│   │   └── useFileStore.ts    # Legacy file store (to be removed)
│   │
│   ├── services/              # API & External Services
│   │   └── apiClient.ts       # HTTP client for R2 API
│   │
│   ├── types/                 # TypeScript Type Definitions
│   │   ├── index.ts           # Main type definitions
│   │   └── file.ts            # File-specific types
│   │
│   ├── utils/                 # Utility Functions
│   │   ├── fileUtils.ts       # File type detection, icon mapping
│   │   └── formatters.ts      # Date, size, speed formatters
│   │
│   ├── styles/                # Global Styles
│   │   ├── index.css          # Tailwind imports & custom styles
│   │   └── globals.css        # Legacy global styles (to be merged)
│   │
│   ├── App.tsx                # Root React component
│   ├── main.tsx               # React app entry point
│   └── vite-env.d.ts          # Vite environment types
│
├── public/                    # Static Assets (to be created)
│   └── assets/
│       └── icons/
│
├── build/                     # Build Resources (to be created)
│   ├── icon.icns             # macOS app icon
│   ├── icon.ico              # Windows app icon
│   ├── icon.png              # Linux app icon
│   └── entitlements.mac.plist # macOS entitlements
│
├── dist/                      # Vite build output (generated)
├── dist-electron/             # Electron build output (generated)
├── release/                   # electron-builder output (generated)
│
├── package.json               # Dependencies & scripts
├── tsconfig.json              # TypeScript configuration
├── tsconfig.node.json         # TypeScript config for Node.js files
├── vite.config.ts             # Vite bundler configuration
├── electron-builder.json      # Electron packaging configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── postcss.config.js          # PostCSS configuration
├── .gitignore                 # Git ignore rules
├── README.md                  # Project documentation
└── PROJECT_STRUCTURE.md       # This file
```

## File Descriptions

### Main Process (electron/)

| File | Purpose |
|------|---------|
| `main.ts` | Electron app lifecycle, BrowserWindow creation, server management, IPC handlers, native dialogs, menu setup |
| `preload.ts` | Context bridge exposing IPC APIs to renderer: `window.electronAPI` |

### Stores (src/stores/)

| Store | State Managed |
|-------|---------------|
| `serverStore.ts` | Server running status, port, logs |
| `settingsStore.ts` | R2 credentials (accountId, accessKeyId, secretAccessKey) |
| `bucketStore.ts` | Bucket list, selected bucket, loading state |
| `fileStore.ts` | Object list, folders, navigation history, selection, sorting |
| `transferStore.ts` | Upload/download/delete queue, progress tracking, pause/resume |
| `uiStore.ts` | Panel visibility (transfer, debug), modals (settings, quicklook), loading overlay |

### Services (src/services/)

| Service | Purpose |
|---------|---------|
| `apiClient.ts` | Axios-based HTTP client for R2 API (listBuckets, listObjects, upload, download, delete) |

### Components Structure

#### Layout Components
- `MainLayout.tsx` - Root layout with split panes (Allotment)
- `Header.tsx` - Top bar with server status, settings button
- `Sidebar.tsx` - Bucket list sidebar
- `Toolbar.tsx` - File operation buttons (upload, download, delete, refresh)
- `Breadcrumb.tsx` - Path navigation
- `TransferPanel.tsx` - Bottom panel for transfer queue
- `DebugPanel.tsx` - Bottom panel for logs

#### Feature Components
- `BucketSidebar.tsx` - Bucket list with loading/error states
- `FileArea.tsx` - Main file browsing area with toolbar and breadcrumb
- `FileList.tsx` - Table view with TanStack Table
- `FileRow.tsx` - Individual file/folder row
- `ContextMenu.tsx` - Right-click context menu
- `TransferQueue.tsx` - Transfer task list with progress bars
- `SettingsModal.tsx` - Credentials configuration modal
- `QuickLookModal.tsx` - File preview modal
- `LoadingOverlay.tsx` - Full-screen loading indicator

## Key Technologies

### Frontend Stack
- **React 18** - UI framework
- **TypeScript 5** - Type safety
- **Tailwind CSS 3** - Utility-first CSS
- **Zustand 4** - State management
- **TanStack Table 8** - Data tables
- **Lucide React** - Icon library
- **Headless UI** - Unstyled UI components
- **Allotment** - Resizable split panes

### File Preview
- **react-pdf 9** - PDF rendering
- **Monaco Editor 4** - Code editor
- **react-player 2** - Video/audio player

### Desktop
- **Electron 33** - Desktop framework
- **electron-store 10** - Settings persistence
- **electron-builder 25** - Packaging

### Utilities
- **Axios 1** - HTTP client
- **date-fns 4** - Date formatting
- **uuid 10** - ID generation
- **clsx 2** - Conditional classes

## Development Workflow

### 1. Install Dependencies
```bash
npm install
```

### 2. Development Mode
```bash
npm run dev
```
- Starts Vite dev server (port 5173)
- Launches Electron with hot reload
- Automatically starts Node.js API server

### 3. Type Checking
```bash
npm run type-check
```

### 4. Build
```bash
# All platforms
npm run build

# Specific platform
npm run build:mac
npm run build:win
npm run build:linux
```

## IPC Communication

### Renderer → Main
```typescript
// Server management
await window.electronAPI.server.start();
await window.electronAPI.server.stop();
await window.electronAPI.server.restart();

// File dialogs
await window.electronAPI.dialog.openFile(options);
await window.electronAPI.dialog.saveFile(options);
await window.electronAPI.dialog.showMessage(options);

// Settings
await window.electronAPI.settings.get(key);
await window.electronAPI.settings.set(key, value);

// System
await window.electronAPI.shell.openExternal(url);
await window.electronAPI.clipboard.writeText(text);
```

### Main → Renderer (Events)
```typescript
// Server status updates
window.electronAPI.server.onStatus((status) => { ... });

// Server logs
window.electronAPI.server.onLog((log) => { ... });
```

## State Management Flow

```
User Action
    ↓
React Component
    ↓
Zustand Action
    ↓
API Client / Electron IPC
    ↓
Backend (Node.js API / Electron Main)
    ↓
Zustand State Update
    ↓
React Re-render
```

## Component Hierarchy

```
App
 └── MainLayout
      ├── Header
      │    ├── ServerStatus
      │    └── SettingsButton
      ├── Allotment (Horizontal Split)
      │    ├── BucketSidebar
      │    │    └── BucketList
      │    └── FileArea
      │         ├── Toolbar
      │         ├── Breadcrumb
      │         └── FileList
      │              └── FileRow[]
      ├── TransferQueue (Conditional)
      │    └── TransferTaskRow[]
      ├── DebugPanel (Conditional)
      │    ├── APIResponseTab
      │    └── ServerLogsTab
      └── Modals
           ├── SettingsModal
           ├── QuickLookModal
           └── LoadingOverlay
```

## TODO: Missing Components

The following components need to be fully implemented:

1. **Toolbar.tsx** - Navigation and action buttons
2. **Breadcrumb.tsx** - Path navigation
3. **FileList.tsx** - Table view with sorting
4. **FileRow.tsx** - Individual file row
5. **ContextMenu.tsx** - Right-click menu
6. **TransferQueue.tsx** - Transfer task list
7. **DebugPanel.tsx** - API logs and server logs
8. **SettingsModal.tsx** - Credentials form
9. **QuickLookModal.tsx** - File preview
10. **LoadingOverlay.tsx** - Loading indicator

## Next Steps

1. Implement missing UI components
2. Add keyboard shortcuts
3. Implement file preview for different types
4. Add drag-and-drop upload
5. Implement search functionality
6. Add tests (unit, integration, E2E)
7. Create app icons for all platforms
8. Add CI/CD pipeline
9. Write user documentation
10. Performance optimization

## Notes

- The project has some duplicate components (layout/BucketSidebar.tsx vs buckets/BucketSidebar.tsx) that need consolidation
- Legacy store files (useBucketStore.ts, useFileStore.ts) should be removed after migration
- styles/globals.css should be merged into styles/index.css
- Need to create build resources (icons, entitlements)
- Consider adding error boundaries for better error handling
- Add logging service for better debugging
