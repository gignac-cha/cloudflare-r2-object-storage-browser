import { create } from 'zustand';

interface ServerState {
  isRunning: boolean;
  port: number | null;
  logs: string[];
}

interface ServerActions {
  setStatus: (status: { isRunning: boolean; port: number | null }) => void;
  addLog: (log: string) => void;
  clearLogs: () => void;
  startServer: () => Promise<void>;
  stopServer: () => Promise<void>;
  restartServer: () => Promise<void>;
  getStatus: () => Promise<void>;
  setupListeners: () => void;
  cleanup: () => void;
}

// Store cleanup functions outside the store to prevent re-creation on every render
let cleanupStatus: (() => void) | undefined;
let cleanupLog: (() => void) | undefined;

export const useServerStore = create<ServerState & ServerActions>((set, get) => ({
  // State
  isRunning: false,
  port: null,
  logs: [],

  // Actions
  setStatus: (status) => set({ isRunning: status.isRunning, port: status.port }),

  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),

  clearLogs: () => set({ logs: [] }),

  startServer: async () => {
    try {
      await window.electronAPI.server.start();
    } catch (error) {
      console.error('Failed to start server:', error);
    }
  },

  stopServer: async () => {
    try {
      await window.electronAPI.server.stop();
    } catch (error) {
      console.error('Failed to stop server:', error);
    }
  },

  restartServer: async () => {
    try {
      await window.electronAPI.server.restart();
    } catch (error) {
      console.error('Failed to restart server:', error);
    }
  },

  getStatus: async () => {
    try {
      const status = await window.electronAPI.server.getStatus();
      set({ isRunning: status.isRunning, port: status.port });
    } catch (error) {
      console.error('Failed to get server status:', error);
    }
  },

  /**
   * Setup IPC event listeners for server status and logs.
   * IMPORTANT: Must call cleanup() when component unmounts to prevent memory leaks.
   *
   * Example usage in a component:
   * ```typescript
   * useEffect(() => {
   *   const store = useServerStore.getState();
   *   store.setupListeners();
   *
   *   return () => {
   *     store.cleanup(); // Clean up listeners on unmount
   *   };
   * }, []);
   * ```
   */
  setupListeners: () => {
    // Clean up any existing listeners first to avoid duplicates
    get().cleanup();

    // Listen to server status updates and store cleanup function
    cleanupStatus = window.electronAPI.server.onStatus((status) => {
      get().setStatus(status);
    });

    // Listen to server logs and store cleanup function
    cleanupLog = window.electronAPI.server.onLog((log) => {
      get().addLog(log);
    });
  },

  /**
   * Clean up IPC event listeners to prevent memory leaks.
   * MUST be called when component unmounts.
   */
  cleanup: () => {
    cleanupStatus?.();
    cleanupLog?.();
    cleanupStatus = undefined;
    cleanupLog = undefined;
  },
}));
