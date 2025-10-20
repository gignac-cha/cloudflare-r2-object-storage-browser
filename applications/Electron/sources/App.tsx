import React, { useEffect, useState } from 'react';
import MainLayout from './components/layout/MainLayout';
import { SettingsModal } from './components/modals/SettingsModal';
import { useSettingsStore } from './stores/settingsStore';
import { apiClient } from './services/apiClient';

// Type definitions for Electron IPC
interface ServerStatus {
  isRunning: boolean;
  port: number | null;
}

interface ElectronAPI {
  server: {
    onStatus: (callback: (status: ServerStatus) => void) => () => void;
    onLog: (callback: (log: string) => void) => () => void;
  };
  // Legacy top-level listeners (for backward compatibility)
  onServerStatus?: (callback: (status: ServerStatus) => void) => () => void;
  onServerLog?: (callback: (log: string) => void) => () => void;
}

// Extend Window interface for Electron API
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

function App() {
  const [serverStatus, setServerStatus] = useState<ServerStatus>({
    isRunning: false,
    port: null,
  });
  const [serverLogs, setServerLogs] = useState<string[]>([]);
  const { loadCredentials } = useSettingsStore();

  // Load saved credentials on app start
  useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  useEffect(() => {
    // Listen to server status changes from main process
    const handleServerStatus = (status: ServerStatus) => {
      setServerStatus(status);
      console.log('[App] Server status updated:', status);

      // Update API client base URL when server port changes
      if (status.isRunning && status.port) {
        apiClient.setBaseURL(status.port);
        console.log('[App] API client URL updated to:', apiClient.getBaseURL());
      }
    };

    // Listen to server logs from main process
    const handleServerLog = (log: string) => {
      setServerLogs((prev) => [...prev, log]);
    };

    // Subscribe to IPC events if running in Electron
    let cleanupStatus: (() => void) | undefined;
    let cleanupLog: (() => void) | undefined;

    if (window.electronAPI?.server) {
      // Use the new server.onStatus/onLog API with proper cleanup
      cleanupStatus = window.electronAPI.server.onStatus(handleServerStatus);
      cleanupLog = window.electronAPI.server.onLog(handleServerLog);
    }

    // Cleanup listeners on unmount to prevent memory leaks
    return () => {
      cleanupStatus?.();
      cleanupLog?.();
    };
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? event.metaKey : event.ctrlKey;

      // Cmd/Ctrl + R: Refresh
      if (modKey && event.key === 'r') {
        event.preventDefault();
        // Trigger refresh action
        console.log('[App] Refresh triggered');
      }

      // Note: Cmd/Ctrl + Q is handled by Electron main process menu
      // Do NOT preventDefault here as it will block the main process handler
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Global error handler
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('[App] Global error:', event.error);
      // Could show error toast here
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('[App] Unhandled promise rejection:', event.reason);
      // Could show error toast here
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <div className="app">
      <MainLayout serverStatus={serverStatus} serverLogs={serverLogs} />
      <SettingsModal />
    </div>
  );
}

export default App;
