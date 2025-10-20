/**
 * IPC Service - Electron IPC Wrapper
 * Type-safe wrapper for Electron IPC communication between renderer and main process
 *
 * Provides convenient typed access to window.electronAPI
 */

/**
 * Server status information
 */
export interface ServerStatus {
  isRunning: boolean;
  port: number | null;
}

/**
 * Dialog options for file selection
 */
export interface OpenFileOptions {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
  properties?: Array<
    | 'openFile'
    | 'openDirectory'
    | 'multiSelections'
    | 'showHiddenFiles'
    | 'createDirectory'
    | 'promptToCreate'
  >;
}

/**
 * Dialog options for file saving
 */
export interface SaveFileOptions {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
  properties?: Array<'showHiddenFiles' | 'createDirectory' | 'showOverwriteConfirmation'>;
}

/**
 * Message box options
 */
export interface MessageBoxOptions {
  type?: 'none' | 'info' | 'error' | 'question' | 'warning';
  title?: string;
  message: string;
  detail?: string;
  buttons?: string[];
  defaultId?: number;
  cancelId?: number;
}

/**
 * Message box response
 */
export interface MessageBoxResponse {
  response: number;
  checkboxChecked?: boolean;
}

/**
 * File selection result
 */
export interface FileSelectionResult {
  canceled: boolean;
  filePaths: string[];
}

/**
 * IPC Service
 * Provides type-safe access to Electron IPC APIs
 */
class IPCService {
  private static instance: IPCService;

  private constructor() {
    // Verify window.electronAPI is available
    if (!window.electronAPI) {
      throw new Error('electronAPI is not available. Make sure preload script is loaded.');
    }
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): IPCService {
    if (!IPCService.instance) {
      IPCService.instance = new IPCService();
    }
    return IPCService.instance;
  }

  /**
   * Check if running in Electron environment
   */
  public isElectron(): boolean {
    return typeof window !== 'undefined' && window.electronAPI !== undefined;
  }

  // ===========================
  // Server Management
  // ===========================

  /**
   * Start the API server
   */
  public async startServer(): Promise<void> {
    return window.electronAPI.server.start();
  }

  /**
   * Stop the API server
   */
  public async stopServer(): Promise<void> {
    return window.electronAPI.server.stop();
  }

  /**
   * Restart the API server
   */
  public async restartServer(): Promise<void> {
    return window.electronAPI.server.restart();
  }

  /**
   * Get server logs
   */
  public async getServerLogs(): Promise<string[]> {
    return window.electronAPI.server.getLogs();
  }

  /**
   * Get server status
   */
  public async getServerStatus(): Promise<ServerStatus> {
    return window.electronAPI.server.getStatus();
  }

  /**
   * Listen to server status changes
   * @returns Cleanup function to remove the listener
   */
  public onServerStatus(callback: (status: ServerStatus) => void): () => void {
    return window.electronAPI.server.onStatus(callback);
  }

  /**
   * Listen to server log updates
   * @returns Cleanup function to remove the listener
   */
  public onServerLog(callback: (log: string) => void): () => void {
    return window.electronAPI.server.onLog(callback);
  }

  // ===========================
  // Dialog APIs
  // ===========================

  /**
   * Show open file dialog
   */
  public async showOpenFileDialog(
    options?: OpenFileOptions
  ): Promise<FileSelectionResult> {
    return window.electronAPI.dialog.openFile(options ?? {});
  }

  /**
   * Show save file dialog
   */
  public async showSaveFileDialog(options?: SaveFileOptions): Promise<FileSelectionResult> {
    return window.electronAPI.dialog.saveFile(options ?? {});
  }

  /**
   * Show message box dialog
   */
  public async showMessageBox(options: MessageBoxOptions): Promise<MessageBoxResponse> {
    return window.electronAPI.dialog.showMessage(options);
  }

  /**
   * Show error dialog
   */
  public async showErrorDialog(title: string, message: string, detail?: string): Promise<void> {
    await this.showMessageBox({
      type: 'error',
      title,
      message,
      detail,
      buttons: ['OK'],
    });
  }

  /**
   * Show warning dialog
   */
  public async showWarningDialog(
    title: string,
    message: string,
    detail?: string
  ): Promise<void> {
    await this.showMessageBox({
      type: 'warning',
      title,
      message,
      detail,
      buttons: ['OK'],
    });
  }

  /**
   * Show info dialog
   */
  public async showInfoDialog(title: string, message: string, detail?: string): Promise<void> {
    await this.showMessageBox({
      type: 'info',
      title,
      message,
      detail,
      buttons: ['OK'],
    });
  }

  /**
   * Show confirmation dialog
   */
  public async showConfirmDialog(
    title: string,
    message: string,
    confirmLabel: string = 'OK',
    cancelLabel: string = 'Cancel'
  ): Promise<boolean> {
    const result = await this.showMessageBox({
      type: 'question',
      title,
      message,
      buttons: [confirmLabel, cancelLabel],
      defaultId: 0,
      cancelId: 1,
    });
    return result.response === 0;
  }

  // ===========================
  // Settings/Store APIs
  // ===========================

  /**
   * Get setting value
   */
  public async getSetting<T = unknown>(key: string): Promise<T | undefined> {
    return window.electronAPI.settings.get(key);
  }

  /**
   * Set setting value
   */
  public async setSetting(key: string, value: unknown): Promise<void> {
    return window.electronAPI.settings.set(key, value);
  }

  /**
   * Delete setting
   */
  public async deleteSetting(key: string): Promise<void> {
    return window.electronAPI.settings.delete(key);
  }

  /**
   * Clear all settings
   */
  public async clearSettings(): Promise<void> {
    return window.electronAPI.settings.clear();
  }

  // ===========================
  // Shell APIs
  // ===========================

  /**
   * Open external URL in default browser
   */
  public async openExternal(url: string): Promise<void> {
    return window.electronAPI.shell.openExternal(url);
  }

  /**
   * Open file or directory in system file manager
   */
  public async openPath(path: string): Promise<void> {
    return window.electronAPI.shell.openPath(path);
  }

  // ===========================
  // Clipboard APIs
  // ===========================

  /**
   * Write text to clipboard
   */
  public async writeTextToClipboard(text: string): Promise<void> {
    return window.electronAPI.clipboard.writeText(text);
  }

  /**
   * Copy text to clipboard with user feedback
   */
  public async copyToClipboard(text: string, successMessage?: string): Promise<boolean> {
    try {
      await this.writeTextToClipboard(text);
      if (successMessage) {
        console.log(successMessage);
      }
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }

  // ===========================
  // App Path APIs
  // ===========================

  /**
   * Get Electron app path
   */
  public async getAppPath(name: string): Promise<string> {
    return window.electronAPI.app.getPath(name);
  }

  /**
   * Get user data path
   */
  public async getUserDataPath(): Promise<string> {
    return window.electronAPI.app.getUserDataPath();
  }
}

// Export singleton instance
export const ipcService = IPCService.getInstance();

// Export individual functions for convenience
export const ipc = {
  // Server
  startServer: () => ipcService.startServer(),
  stopServer: () => ipcService.stopServer(),
  restartServer: () => ipcService.restartServer(),
  getServerLogs: () => ipcService.getServerLogs(),
  getServerStatus: () => ipcService.getServerStatus(),
  onServerStatus: (callback: (status: ServerStatus) => void): (() => void) =>
    ipcService.onServerStatus(callback),
  onServerLog: (callback: (log: string) => void): (() => void) => ipcService.onServerLog(callback),

  // Dialog
  showOpenFileDialog: (options?: OpenFileOptions) => ipcService.showOpenFileDialog(options),
  showSaveFileDialog: (options?: SaveFileOptions) => ipcService.showSaveFileDialog(options),
  showMessageBox: (options: MessageBoxOptions) => ipcService.showMessageBox(options),
  showErrorDialog: (title: string, message: string, detail?: string) =>
    ipcService.showErrorDialog(title, message, detail),
  showWarningDialog: (title: string, message: string, detail?: string) =>
    ipcService.showWarningDialog(title, message, detail),
  showInfoDialog: (title: string, message: string, detail?: string) =>
    ipcService.showInfoDialog(title, message, detail),
  showConfirmDialog: (
    title: string,
    message: string,
    confirmLabel?: string,
    cancelLabel?: string
  ) => ipcService.showConfirmDialog(title, message, confirmLabel, cancelLabel),

  // Settings
  getSetting: <T = unknown>(key: string) => ipcService.getSetting<T>(key),
  setSetting: (key: string, value: unknown) => ipcService.setSetting(key, value),
  deleteSetting: (key: string) => ipcService.deleteSetting(key),
  clearSettings: () => ipcService.clearSettings(),

  // Shell
  openExternal: (url: string) => ipcService.openExternal(url),
  openPath: (path: string) => ipcService.openPath(path),

  // Clipboard
  writeTextToClipboard: (text: string) => ipcService.writeTextToClipboard(text),
  copyToClipboard: (text: string, successMessage?: string) =>
    ipcService.copyToClipboard(text, successMessage),

  // App Path
  getAppPath: (name: string) => ipcService.getAppPath(name),
  getUserDataPath: () => ipcService.getUserDataPath(),

  // Utility
  isElectron: () => ipcService.isElectron(),
};

// Export type definitions
export type { ElectronAPI } from '../../electron/preload.ts';

// Default export
export default ipc;
