import type { IpcMainInvokeEvent, MenuItemConstructorOptions } from 'electron';
import * as electron from 'electron';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';
import Store from 'electron-store';

// Destructure electron modules for proper CommonJS compatibility
const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = electron;

/**
 * R2 Credentials stored in electron-store
 */
interface R2Credentials {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
}

// Store for app settings - initialized lazily to avoid accessing app before ready
let store: Store | null = null;

function getStore(): Store {
  if (!store) {
    store = new Store({
      cwd: path.join(app.getPath('home'), '.cloudflare-r2-object-storage-browser'),
      name: 'settings'
    });
  }
  return store;
}

// Global references
let mainWindow: BrowserWindow | null = null;
let serverProcess: ChildProcess | null = null;
let serverPort: number | null = null;
let serverLogs: string[] = [];

// Server management functions
function getNodePath(): string {
  // Check for nvm
  const nvmNodePath = path.join(process.env.HOME || '', '.nvm', 'versions', 'node');

  // Check common locations
  const possiblePaths = [
    '/usr/local/bin/node',
    '/opt/homebrew/bin/node',
    '/usr/bin/node',
    'node', // System PATH
  ];

  for (const nodePath of possiblePaths) {
    try {
      const { execSync } = require('child_process');
      execSync(`${nodePath} --version`);
      return nodePath;
    } catch {
      continue;
    }
  }

  return 'node'; // Fallback
}

function getServerScriptPath(): string {
  if (app.isPackaged) {
    // Packaged app: server is bundled in resources
    return path.join(process.resourcesPath, 'server', 'server.js');
  } else {
    // Non-packaged: server is in packages/api/outputs
    // __dirname = applications/Electron/outputs/electron
    // Target = packages/api/outputs/server.js
    return path.join(__dirname, '..', '..', '..', '..', 'packages', 'api', 'outputs', 'server.js');
  }
}

async function startServer(): Promise<void> {
  if (serverProcess) {
    console.log('Server already running');
    return;
  }

  // Try to get credentials from new format first, then fall back to MacOS format (root level)
  const appStore = getStore();
  let credentials = appStore.get('credentials') as R2Credentials | undefined;

  if (!credentials) {
    // Try MacOS format (root level fields)
    const accountId = appStore.get('accountId') as string | undefined;
    const accessKeyId = appStore.get('accessKeyId') as string | undefined;
    const secretAccessKey = appStore.get('secretAccessKey') as string | undefined;
    const endpoint = appStore.get('endpoint') as string | undefined;

    if (accountId && accessKeyId && secretAccessKey) {
      credentials = { accountId, accessKeyId, secretAccessKey, endpoint };
    }
  }

  if (!credentials || !credentials.accountId || !credentials.accessKeyId || !credentials.secretAccessKey) {
    console.log('No credentials configured');
    mainWindow?.webContents.send('server:status', { isRunning: false, error: 'No credentials configured' });
    return;
  }

  const nodePath = getNodePath();
  const serverScript = getServerScriptPath();

  console.log('Starting server with Node:', nodePath);
  console.log('Server script:', serverScript);

  // SECURITY: Pass credentials via environment variables instead of command-line arguments
  // to prevent credential exposure in process listings and system logs
  serverProcess = spawn(nodePath, [serverScript], {
    cwd: __dirname,
    env: {
      ...process.env,
      R2_ACCOUNT_ID: credentials.accountId,
      R2_ACCESS_KEY_ID: credentials.accessKeyId,
      R2_SECRET_ACCESS_KEY: credentials.secretAccessKey,
    }
  });

  serverProcess.stdout?.on('data', (data: Buffer) => {
    const log = data.toString();
    console.log('Server:', log);
    serverLogs.push(log);
    mainWindow?.webContents.send('server:log', log);

    // Parse port from logs
    const portMatch = log.match(/PORT=(\d+)/);
    if (portMatch) {
      serverPort = parseInt(portMatch[1], 10);
      console.log('Server port:', serverPort);
      mainWindow?.webContents.send('server:status', { isRunning: true, port: serverPort });
    }
  });

  serverProcess.stderr?.on('data', (data: Buffer) => {
    const log = data.toString();
    console.error('Server error:', log);
    serverLogs.push(log);
    mainWindow?.webContents.send('server:log', log);
  });

  serverProcess.on('exit', (code) => {
    console.log('Server exited with code:', code);
    serverProcess = null;
    serverPort = null;
    mainWindow?.webContents.send('server:status', { isRunning: false });
  });
}

async function stopServer(): Promise<void> {
  if (!serverProcess) {
    return;
  }

  console.log('Stopping server...');

  // Try graceful shutdown first
  if (serverPort) {
    try {
      const axios = require('axios');
      await axios.post(`http://localhost:${serverPort}/shutdown`, {}, { timeout: 2000 });
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.log('Graceful shutdown failed, forcing kill');
    }
  }

  // Force kill if still running
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (serverProcess) {
      serverProcess.kill('SIGKILL');
    }
  }

  serverProcess = null;
  serverPort = null;
  mainWindow?.webContents.send('server:status', { isRunning: false });
}

async function restartServer(): Promise<void> {
  await stopServer();
  await new Promise(resolve => setTimeout(resolve, 2500));
  await startServer();
}

// Create main window
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true, // SECURITY: Enabled to isolate renderer process from Node.js APIs
                     // All privileged operations are handled in main process via IPC
                     // Preload script only uses contextBridge and ipcRenderer (sandbox-safe)
      // Suppress DevTools console errors for unsupported features
      devTools: true,
    },
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 20, y: 20 },
  });

  // Suppress console errors from DevTools about unsupported features
  mainWindow.webContents.on('devtools-opened', () => {
    mainWindow?.webContents.devToolsWebContents?.executeJavaScript(`
      const originalConsoleError = console.error;
      console.error = function(...args) {
        const msg = args[0];
        // Filter out Autofill-related DevTools errors (these are expected in Electron)
        if (typeof msg === 'string' && (
          msg.includes('Autofill.enable') ||
          msg.includes('Autofill.setAddresses')
        )) {
          return;
        }
        originalConsoleError.apply(console, args);
      };
    `);
  });

  // Load the HTML file
  const indexPath = path.join(__dirname, '../renderer/index.html');
  console.log('Loading HTML from:', indexPath);
  console.log('__dirname:', __dirname);
  console.log('app.isPackaged:', app.isPackaged);
  mainWindow.loadFile(indexPath);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create application menu
  const template: MenuItemConstructorOptions[] = [
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click: async () => {
            await stopServer();
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC Handlers
ipcMain.handle('server:start', async () => {
  await startServer();
});

ipcMain.handle('server:stop', async () => {
  await stopServer();
});

ipcMain.handle('server:restart', async () => {
  await restartServer();
});

ipcMain.handle('server:getLogs', () => {
  return serverLogs;
});

ipcMain.handle('server:getStatus', () => {
  return {
    isRunning: serverProcess !== null,
    port: serverPort,
  };
});

ipcMain.handle('dialog:openFile', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow!, options);
  return result;
});

ipcMain.handle('dialog:saveFile', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow!, options);
  return result;
});

ipcMain.handle('dialog:showMessage', async (event, options) => {
  const result = await dialog.showMessageBox(mainWindow!, options);
  return result;
});

ipcMain.handle('settings:get', (event, key) => {
  return getStore().get(key);
});

ipcMain.handle('settings:set', (event, key, value) => {
  getStore().set(key, value);
});

ipcMain.handle('settings:delete', (event, key) => {
  getStore().delete(key);
});

ipcMain.handle('settings:clear', () => {
  getStore().clear();
});

// Shell API handlers with security validation
ipcMain.handle('shell:openExternal', async (_event, url: string) => {
  // Validate URL input
  if (!url || typeof url !== 'string') {
    throw new Error('Invalid URL: must be a non-empty string');
  }

  // Enforce URL length limit to prevent DoS
  if (url.length > 2048) {
    throw new Error('URL too long: maximum length is 2048 characters');
  }

  // Trim whitespace to prevent bypass attempts
  const trimmedUrl = url.trim();

  try {
    // Parse and validate URL format
    const parsed = new URL(trimmedUrl);

    // Whitelist only safe protocols
    const allowedProtocols = ['http:', 'https:'];
    if (!allowedProtocols.includes(parsed.protocol)) {
      throw new Error(
        `Invalid protocol: ${parsed.protocol}. Only http and https are allowed.`
      );
    }

    // Additional security checks
    // Block localhost/private IPs to prevent SSRF attacks
    const hostname = parsed.hostname.toLowerCase();
    const blockedPatterns = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '::1',
      '169.254.', // Link-local
      '10.',      // Private network
    ];

    if (blockedPatterns.some(pattern => hostname.startsWith(pattern))) {
      console.warn('Blocked attempt to open internal URL:', hostname);
      throw new Error('Cannot open internal/private URLs for security reasons');
    }

    // Log the action for audit trail
    console.log('Opening external URL:', trimmedUrl);

    // Open the validated URL
    await shell.openExternal(trimmedUrl);
  } catch (error) {
    console.error('Failed to open URL:', error);
    throw error;
  }
});

ipcMain.handle('shell:openPath', async (_event, filePath: string) => {
  // Validate path input
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('Invalid path: must be a non-empty string');
  }

  // Enforce path length limit
  if (filePath.length > 1024) {
    throw new Error('Path too long: maximum length is 1024 characters');
  }

  // Trim whitespace
  const trimmedPath = filePath.trim();

  // Normalize path to prevent directory traversal attacks
  const normalizedPath = path.normalize(trimmedPath);

  // Security checks for path traversal
  if (normalizedPath.includes('..')) {
    console.warn('Blocked directory traversal attempt:', normalizedPath);
    throw new Error('Invalid path: directory traversal is not allowed');
  }

  // Check for suspicious null bytes (path injection)
  if (normalizedPath.includes('\0')) {
    console.warn('Blocked null byte injection attempt');
    throw new Error('Invalid path: contains null bytes');
  }

  // Additional platform-specific checks
  if (process.platform === 'win32') {
    // Block UNC paths that might access network resources
    if (normalizedPath.startsWith('\\\\')) {
      console.warn('Blocked UNC path:', normalizedPath);
      throw new Error('Invalid path: UNC paths are not allowed');
    }
  }

  // Log the action for audit trail
  console.log('Opening path:', normalizedPath);

  try {
    // Open the validated path
    const result = await shell.openPath(normalizedPath);

    // shell.openPath returns empty string on success, error message on failure
    if (result) {
      console.error('Failed to open path:', result);
      throw new Error(`Failed to open path: ${result}`);
    }
  } catch (error) {
    console.error('Error opening path:', error);
    throw error;
  }
});

ipcMain.handle('clipboard:writeText', async (event, text) => {
  const { clipboard } = require('electron');
  clipboard.writeText(text);
});

// App path APIs
ipcMain.handle('app:getPath', (_event: IpcMainInvokeEvent, name: string) => {
  // Validate that the name is a valid Electron path name
  // TypeScript requires specific literal types for app.getPath()
  const validPaths = [
    'home', 'appData', 'userData', 'sessionData', 'temp', 'exe',
    'module', 'desktop', 'documents', 'downloads', 'music', 'pictures',
    'videos', 'recent', 'logs', 'crashDumps'
  ] as const;

  type ValidPathName = typeof validPaths[number];

  if (!validPaths.includes(name as ValidPathName)) {
    throw new Error(`Invalid path name: ${name}`);
  }

  return app.getPath(name as ValidPathName);
});

ipcMain.handle('app:getUserDataPath', () => {
  return app.getPath('userData');
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  // Start server after a delay
  setTimeout(() => {
    startServer();
  }, 500);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Track if we're already quitting to prevent infinite loop
let isQuitting = false;

app.on('window-all-closed', () => {
  console.log('[Main] window-all-closed event fired');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle will-quit as well (fires before before-quit)
app.on('will-quit', (event) => {
  console.log('[Main] will-quit event fired');
  if (serverProcess && !isQuitting) {
    console.log('[Main] Preventing will-quit to stop server first');
    event.preventDefault();
    isQuitting = true;

    stopServer()
      .then(() => {
        console.log('[Main] Server stopped (from will-quit), quitting app...');
        isQuitting = false;
        app.quit();
      })
      .catch((error) => {
        console.error('[Main] Error stopping server (from will-quit):', error);
        isQuitting = false;
        app.quit();
      });
  }
});

app.on('before-quit', (event) => {
  console.log('[Main] before-quit event fired');
  console.log('[Main] serverProcess:', serverProcess ? 'running' : 'null');
  console.log('[Main] isQuitting:', isQuitting);

  if (serverProcess && !isQuitting) {
    console.log('[Main] Preventing quit to stop server first');
    event.preventDefault();
    isQuitting = true;

    console.log('[Main] Starting graceful shutdown...');

    // Stop server and then quit
    stopServer()
      .then(() => {
        console.log('[Main] Server stopped successfully, quitting app...');
        // Force quit after server is stopped
        isQuitting = false; // Reset flag to allow actual quit
        app.quit();
      })
      .catch((error) => {
        console.error('[Main] Error stopping server:', error);
        // Quit anyway even if server stop fails
        isQuitting = false;
        app.quit();
      });
  } else {
    console.log('[Main] Allowing quit (no server or already quitting)');
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});
