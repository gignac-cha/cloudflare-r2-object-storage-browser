# Electron Project Setup Guide

Complete setup guide for the Cloudflare R2 Object Storage Browser Electron application.

## Prerequisites

- **Node.js** 18.x or higher
- **npm** 9.x or higher (or yarn/pnpm)
- **Git** for version control
- **Cloudflare R2** account with credentials

### Platform-Specific Requirements

#### macOS
- Xcode Command Line Tools: `xcode-select --install`
- For code signing: Apple Developer account

#### Windows
- Windows 10/11
- Visual Studio Build Tools (for native modules)

#### Linux
- build-essential: `sudo apt-get install build-essential`
- Additional packages: `libx11-dev libxext-dev libxss-dev libxcursor-dev`

## Initial Setup

### 1. Clone and Navigate
```bash
cd /Users/cha/projects/cloudflare-r2-object-storage-browser/applications/Electron
```

### 2. Install Dependencies
```bash
npm install
```

This will install:
- Electron 33
- React 18
- TypeScript 5
- Vite 5
- Tailwind CSS 3
- Zustand 4
- All UI libraries and utilities

### 3. Configure Environment (Optional)

Create a `.env.local` file for development:
```env
# Development mode
NODE_ENV=development

# Vite dev server port
VITE_DEV_SERVER_PORT=5173

# API server port (auto-detected, but can override)
# API_SERVER_PORT=3000
```

## Development

### Start Development Mode

```bash
npm run dev
```

This will:
1. Start Vite dev server at http://localhost:5173
2. Launch Electron window with hot reload
3. Automatically start the Node.js API server
4. Enable React DevTools
5. Open Electron DevTools

### Development Features

- **Hot Module Replacement (HMR)**: React components reload instantly
- **TypeScript Type Checking**: Real-time type checking in your editor
- **Tailwind CSS**: JIT compilation for instant style updates
- **Electron Reload**: Main process reloads on changes
- **DevTools**: Both Chromium and React DevTools available

### File Watching

Vite watches these files:
- `src/**/*.{ts,tsx,css}`
- `index.html`

Electron watches:
- `electron/**/*.ts`

## Configuration

### R2 Credentials

On first launch, configure your R2 credentials:

1. Click the Settings icon (gear) in the header
2. Enter your credentials:
   - **Account ID**: From Cloudflare Dashboard → R2
   - **Access Key ID**: Create in R2 → Manage R2 API Tokens
   - **Secret Access Key**: Shown once when creating token
3. Click "Save"

Credentials are stored in:
- **macOS**: `~/Library/Application Support/cloudflare-r2-browser-electron/config.json`
- **Windows**: `%APPDATA%/cloudflare-r2-browser-electron/config.json`
- **Linux**: `~/.config/cloudflare-r2-browser-electron/config.json`

### Server Configuration

The Node.js API server is located at:
```
../../server/server.js
```

Server features:
- Automatic port assignment (3000-3100)
- Graceful shutdown
- Request/response logging
- CORS enabled for local development

## Building

### Build for Development Testing

```bash
npm run build
```

This creates:
- `dist/` - Vite production build (renderer)
- `dist-electron/` - Compiled Electron files (main + preload)

### Build Distributables

#### macOS
```bash
npm run build:mac
```

Creates:
- `release/*.dmg` - DMG installer
- `release/*.zip` - Portable app
- Both x64 and arm64 (Apple Silicon) builds

#### Windows
```bash
npm run build:win
```

Creates:
- `release/*.exe` - NSIS installer
- `release/*.exe` (portable) - Standalone executable

#### Linux
```bash
npm run build:linux
```

Creates:
- `release/*.AppImage` - Universal Linux app
- `release/*.deb` - Debian package
- `release/*.rpm` - Red Hat package

### Build Options

Customize builds in `electron-builder.json`:

```json
{
  "appId": "com.cloudflare.r2browser",
  "productName": "Cloudflare R2 Browser",
  "mac": {
    "category": "public.app-category.productivity",
    "target": ["dmg", "zip"]
  }
}
```

## Project Structure

```
applications/Electron/
├── electron/              # Main process (Node.js)
├── src/                  # Renderer process (React)
│   ├── components/       # React components
│   ├── stores/           # Zustand state management
│   ├── services/         # API client
│   ├── types/            # TypeScript types
│   ├── utils/            # Utilities
│   └── styles/           # CSS
├── build/                # Build resources (icons, etc.)
├── dist/                 # Vite build output
├── dist-electron/        # Electron build output
└── release/              # Packaged apps
```

## Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development mode (Vite + Electron) |
| `npm run dev:vite` | Start Vite dev server only |
| `npm run dev:electron` | Start Electron only (requires Vite running) |
| `npm run build` | Build for current platform |
| `npm run build:mac` | Build macOS app (dmg, zip) |
| `npm run build:win` | Build Windows app (nsis, portable) |
| `npm run build:linux` | Build Linux app (AppImage, deb, rpm) |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript type checking |

## Troubleshooting

### Server Won't Start

**Issue**: Server status shows "Server stopped"

**Solutions**:
1. Check Node.js is installed: `node --version`
2. Verify server script exists: `ls ../../server/server.js`
3. Check server logs in Debug Panel (Cmd+Shift+D)
4. Restart server from menu: Server → Restart

### Port Already in Use

**Issue**: "Port 3000 is already in use"

**Solutions**:
1. Server will auto-increment to find free port (3000-3100)
2. Manually kill process: `lsof -ti:3000 | xargs kill`
3. Check for other Node.js processes: `ps aux | grep node`

### Build Errors

**Issue**: Build fails with dependency errors

**Solutions**:
```bash
# Clear all build artifacts
rm -rf node_modules dist dist-electron release

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
npm install

# Rebuild native modules
npm rebuild
```

### Vite Dev Server Won't Start

**Issue**: Port 5173 is already in use

**Solutions**:
1. Kill existing process: `lsof -ti:5173 | xargs kill`
2. Change port in `vite.config.ts`:
```typescript
server: {
  port: 5174,
  strictPort: false
}
```

### Electron Window Not Showing

**Issue**: Electron launches but no window appears

**Solutions**:
1. Check console for errors
2. Verify Vite dev server is running (http://localhost:5173)
3. Check `electron/main.ts` for window creation errors
4. Try restarting: `npm run dev`

### TypeScript Errors

**Issue**: Type errors in components

**Solutions**:
```bash
# Run type checker
npm run type-check

# Check specific file
npx tsc --noEmit src/path/to/file.tsx

# Update types
npm install --save-dev @types/react@latest @types/node@latest
```

### Hot Reload Not Working

**Issue**: Changes don't reflect in dev mode

**Solutions**:
1. Check file is within `src/` directory
2. Verify Vite dev server is running
3. Clear Vite cache: `rm -rf node_modules/.vite`
4. Restart dev server

### Credentials Not Saving

**Issue**: Settings don't persist after restart

**Solutions**:
1. Check electron-store permissions
2. Verify config directory exists:
   - macOS: `ls ~/Library/Application\ Support/cloudflare-r2-browser-electron/`
3. Check file permissions: `ls -la` in config directory
4. Try clearing store: Delete `config.json` and re-enter credentials

## Performance Tips

### Development

1. **Use TypeScript Strict Mode**: Catch errors early
2. **Enable React DevTools**: Profile component renders
3. **Use Chrome DevTools**: Profile performance
4. **Limit Console Logs**: Remove debug logs in production

### Production

1. **Lazy Load Components**: Use React.lazy() for large components
2. **Virtualize Lists**: Use react-window for long lists
3. **Optimize Images**: Compress icons and assets
4. **Code Splitting**: Split bundles by route or feature
5. **Minimize Bundle Size**: Analyze with `npm run build -- --analyze`

## Security Best Practices

1. **Never Commit Credentials**: Add `.env*` to `.gitignore`
2. **Use Context Isolation**: Already enabled in `preload.ts`
3. **Disable Node Integration**: Already disabled in `main.ts`
4. **Validate IPC Messages**: Check all IPC handler inputs
5. **Use CSP Headers**: Add Content Security Policy
6. **Keep Dependencies Updated**: Run `npm audit` regularly

## Testing (TODO)

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### Coverage
```bash
npm run test:coverage
```

## Continuous Integration (TODO)

GitHub Actions workflow for:
- Type checking
- Linting
- Unit tests
- Build verification
- Release automation

## Deployment

### macOS Code Signing

1. Obtain Apple Developer certificate
2. Add to `electron-builder.json`:
```json
{
  "mac": {
    "identity": "Developer ID Application: Your Name (TEAM_ID)",
    "hardenedRuntime": true,
    "gatekeeperAssess": false,
    "entitlements": "build/entitlements.mac.plist"
  }
}
```

### Windows Code Signing

1. Obtain code signing certificate
2. Add to `electron-builder.json`:
```json
{
  "win": {
    "certificateFile": "path/to/certificate.pfx",
    "certificatePassword": "password"
  }
}
```

### Auto-Updates (TODO)

Implement with electron-updater:
```bash
npm install electron-updater
```

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Zustand](https://github.com/pmndrs/zustand)
- [electron-builder](https://www.electron.build)

## Support

For issues and questions:
- Check [Troubleshooting](#troubleshooting) section
- Review logs in Debug Panel
- Search GitHub Issues
- Create new issue with logs and steps to reproduce

## License

MIT
