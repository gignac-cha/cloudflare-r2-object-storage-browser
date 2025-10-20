import type { IpcRendererEvent, OpenDialogOptions, SaveDialogOptions, MessageBoxOptions, OpenDialogReturnValue, SaveDialogReturnValue, MessageBoxReturnValue } from 'electron';
import { contextBridge, ipcRenderer } from 'electron';

/**
 * Server status information
 */
export interface ServerStatus {
  isRunning: boolean;
  port: number | null;
  error?: string;
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Server management
  server: {
    start: () => ipcRenderer.invoke('server:start'),
    stop: () => ipcRenderer.invoke('server:stop'),
    restart: () => ipcRenderer.invoke('server:restart'),
    getLogs: () => ipcRenderer.invoke('server:getLogs'),
    getStatus: () => ipcRenderer.invoke('server:getStatus'),
    // Event listeners with cleanup functions
    onStatus: (callback: (status: ServerStatus) => void) => {
      const listener = (_event: IpcRendererEvent, status: ServerStatus) => callback(status);
      ipcRenderer.on('server:status', listener);
      // Return cleanup function
      return () => ipcRenderer.removeListener('server:status', listener);
    },
    onLog: (callback: (log: string) => void) => {
      const listener = (_event: IpcRendererEvent, log: string) => callback(log);
      ipcRenderer.on('server:log', listener);
      // Return cleanup function
      return () => ipcRenderer.removeListener('server:log', listener);
    },
  },

  // Server events (top level for backward compatibility)
  onServerStatus: (callback: (status: ServerStatus) => void) => {
    const listener = (_event: IpcRendererEvent, status: ServerStatus) => callback(status);
    ipcRenderer.on('server:status', listener);
    // Return cleanup function
    return () => ipcRenderer.removeListener('server:status', listener);
  },
  onServerLog: (callback: (log: string) => void) => {
    const listener = (_event: IpcRendererEvent, log: string) => callback(log);
    ipcRenderer.on('server:log', listener);
    // Return cleanup function
    return () => ipcRenderer.removeListener('server:log', listener);
  },

  // Dialog APIs
  dialog: {
    openFile: (options: OpenDialogOptions) => ipcRenderer.invoke('dialog:openFile', options),
    saveFile: (options: SaveDialogOptions) => ipcRenderer.invoke('dialog:saveFile', options),
    showMessage: (options: MessageBoxOptions) => ipcRenderer.invoke('dialog:showMessage', options),
  },

  // Settings/Store APIs
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: unknown) => ipcRenderer.invoke('settings:set', key, value),
    delete: (key: string) => ipcRenderer.invoke('settings:delete', key),
    clear: () => ipcRenderer.invoke('settings:clear'),
  },

  // Shell APIs
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
    openPath: (path: string) => ipcRenderer.invoke('shell:openPath', path),
  },

  // Clipboard APIs
  clipboard: {
    writeText: (text: string) => ipcRenderer.invoke('clipboard:writeText', text),
  },

  // App path APIs
  app: {
    getPath: (name: string) => ipcRenderer.invoke('app:getPath', name),
    getUserDataPath: () => ipcRenderer.invoke('app:getUserDataPath'),
  },
});

// Type definitions for the exposed API
export interface ElectronAPI {
  server: {
    start: () => Promise<void>;
    stop: () => Promise<void>;
    restart: () => Promise<void>;
    getLogs: () => Promise<string[]>;
    getStatus: () => Promise<ServerStatus>;
    onStatus: (callback: (status: ServerStatus) => void) => () => void;
    onLog: (callback: (log: string) => void) => () => void;
  };
  dialog: {
    openFile: (options: OpenDialogOptions) => Promise<OpenDialogReturnValue>;
    saveFile: (options: SaveDialogOptions) => Promise<SaveDialogReturnValue>;
    showMessage: (options: MessageBoxOptions) => Promise<MessageBoxReturnValue>;
  };
  settings: {
    get: (key: string) => Promise<unknown>;
    set: (key: string, value: unknown) => Promise<void>;
    delete: (key: string) => Promise<void>;
    clear: () => Promise<void>;
  };
  shell: {
    openExternal: (url: string) => Promise<void>;
    openPath: (path: string) => Promise<void>;
  };
  clipboard: {
    writeText: (text: string) => Promise<void>;
  };
  app: {
    getPath: (name: string) => Promise<string>;
    getUserDataPath: () => Promise<string>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
