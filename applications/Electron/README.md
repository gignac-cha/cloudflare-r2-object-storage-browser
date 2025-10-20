# Cloudflare R2 Object Storage Browser - Electron

Cross-platform desktop application for managing Cloudflare R2 object storage, built with Electron, React, TypeScript, and Tailwind CSS.

## Features

- Browse and manage R2 buckets and objects
- Upload and download files with progress tracking
- File preview (images, videos, PDFs, code, etc.)
- Transfer queue with pause/resume/cancel
- Debug panel for API logs and server logs
- Multi-select and batch operations
- Navigation history (back/forward/up)
- Keyboard shortcuts
- Cross-platform (macOS, Windows, Linux)

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Cloudflare R2 credentials (Account ID, Access Key ID, Secret Access Key)

## Installation

```bash
# Install dependencies
npm install
```

## Development

```bash
# Run in development mode
npm run dev
```

This will:
1. Start the Vite dev server for the React app (port 5173)
2. Launch Electron with hot reload enabled
3. Start the Node.js API server automatically

## Building

### Build for current platform

```bash
npm run build
```

### Build for specific platforms

```bash
# macOS (dmg and zip)
npm run build:mac

# Windows (nsis installer and portable)
npm run build:win

# Linux (AppImage, deb, rpm)
npm run build:linux
```

Built applications will be in the `release/` directory.

## Configuration

### R2 Credentials

On first launch, the app will prompt you to configure your R2 credentials:

1. Click the Settings button or press `Cmd/Ctrl + ,`
2. Enter your credentials:
   - **Account ID**: Found in Cloudflare dashboard → R2
   - **Access Key ID**: Create API token in R2 settings
   - **Secret Access Key**: Shown only once when creating the API token
3. Click Save

Credentials are stored securely in:
- macOS: `~/Library/Application Support/cloudflare-r2-browser-electron/config.json`
- Windows: `%APPDATA%/cloudflare-r2-browser-electron/config.json`
- Linux: `~/.config/cloudflare-r2-browser-electron/config.json`

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + [` | Navigate back |
| `Cmd/Ctrl + ]` | Navigate forward |
| `Cmd/Ctrl + ↑` | Navigate up (parent folder) |
| `Cmd/Ctrl + R` | Refresh current view |
| `Cmd/Ctrl + Shift + D` | Toggle debug panel |
| `Cmd/Ctrl + ,` | Open settings |
| `Cmd/Ctrl + Q` | Quit application |

## Project Structure

```
applications/Electron/
├── electron/              # Main process
│   ├── main.ts           # App entry point
│   └── preload.ts        # Context bridge
│
├── src/                  # Renderer process (React)
│   ├── components/       # React components
│   │   ├── layout/
│   │   ├── buckets/
│   │   ├── files/
│   │   ├── toolbar/
│   │   ├── breadcrumb/
│   │   ├── transfers/
│   │   ├── debug/
│   │   ├── modals/
│   │   ├── preview/
│   │   └── loading/
│   │
│   ├── stores/           # Zustand state management
│   │   ├── serverStore.ts
│   │   ├── settingsStore.ts
│   │   ├── bucketStore.ts
│   │   ├── fileStore.ts
│   │   ├── transferStore.ts
│   │   └── uiStore.ts
│   │
│   ├── services/         # API client
│   │   └── apiClient.ts
│   │
│   ├── types/            # TypeScript types
│   │   └── index.ts
│   │
│   ├── utils/            # Utility functions
│   │   └── fileUtils.ts
│   │
│   ├── styles/           # CSS
│   │   └── index.css
│   │
│   ├── App.tsx           # Main component
│   └── main.tsx          # React entry point
│
├── package.json
├── tsconfig.json
├── vite.config.ts
├── electron-builder.json
└── tailwind.config.js
```

## Architecture

### Main Process (Electron)

- Server lifecycle management (start/stop/restart Node.js server)
- File system operations
- Native dialogs (open/save file)
- Settings persistence (electron-store)
- IPC handlers for renderer communication

### Renderer Process (React)

- UI components with Tailwind CSS
- State management with Zustand
- API client for R2 operations
- File operations (upload/download/delete)
- Transfer queue management

### IPC Communication

The app uses Electron IPC for communication between main and renderer processes:

```typescript
// Renderer → Main
await window.electronAPI.server.start();
await window.electronAPI.dialog.openFile(options);
await window.electronAPI.settings.set('key', value);

// Main → Renderer (events)
window.electronAPI.server.onStatus((status) => { ... });
window.electronAPI.server.onLog((log) => { ... });
```

## Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **TanStack Table** - Table component
- **Lucide Icons** - Icon library
- **Headless UI** - Unstyled UI components

### File Preview
- **react-pdf** - PDF preview
- **Monaco Editor** - Code/text preview with syntax highlighting
- **react-player** - Video/audio player

### Desktop
- **Electron** - Desktop framework
- **electron-store** - Settings persistence
- **electron-builder** - Application packaging

### HTTP & API
- **Axios** - HTTP client
- **date-fns** - Date formatting

## Troubleshooting

### Server won't start

1. Check if Node.js is installed: `node --version`
2. Check if the server script exists in `../../server/server.js`
3. Check server logs in the Debug panel

### API connection errors

1. Verify R2 credentials are correct
2. Check if the server is running (see status in header)
3. Check network connectivity
4. Review API logs in Debug panel

### Upload/download issues

1. Check file permissions
2. Verify bucket name and path
3. Check available disk space
4. Review transfer queue for error messages

### Build errors

1. Clear build cache: `rm -rf dist dist-electron release`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Check Node.js version: `node --version` (must be 18+)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add my feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Submit a pull request

## License

MIT

## Support

For issues and questions:
- GitHub Issues: [your-repo-url]
- Documentation: [your-docs-url]
