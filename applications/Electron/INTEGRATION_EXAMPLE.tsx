/**
 * Integration Example
 *
 * This file demonstrates how to integrate the newly created components
 * (DebugPanel, SettingsModal, LoadingOverlay) into your main application.
 *
 * Copy and adapt this code to your App.tsx or main layout component.
 */

import React, { useEffect } from 'react';
import {
  useUIStore,
  useDebugStore,
  useSettingsStore,
  useServerStore,
} from '@/stores';
import { DebugPanel } from '@/components/debug';
import { SettingsModal } from '@/components/modals';
import { LoadingOverlay } from '@/components/loading';

/**
 * Example: Main App Component with all features integrated
 */
function AppExample() {
  const { hasCredentials } = useSettingsStore();
  const { setSettingsVisible, showLoadingOverlay, hideLoadingOverlay } = useUIStore();
  const { addServerLog } = useDebugStore();
  const { isRunning, logs } = useServerStore();

  // Automatically show settings modal on first launch
  useEffect(() => {
    if (!hasCredentials) {
      setSettingsVisible(true);
    }
  }, [hasCredentials, setSettingsVisible]);

  // Sync server logs to debug panel
  useEffect(() => {
    if (logs.length > 0) {
      const latestLog = logs[logs.length - 1];
      const level = parseLogLevel(latestLog);

      addServerLog({
        level,
        message: latestLog,
        source: 'node-server',
      });
    }
  }, [logs, addServerLog]);

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Cloudflare R2 Browser
          </h1>

          {/* Server Status */}
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isRunning ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {isRunning ? 'Server Running' : 'Server Stopped'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {/* Your main app content goes here */}
        <div className="h-full flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">
            Main application content
          </p>
        </div>
      </main>

      {/* Debug Panel - collapsible bottom panel */}
      <DebugPanel />

      {/* Modals and Overlays */}
      <SettingsModal />
      <LoadingOverlay />
    </div>
  );
}

/**
 * Helper: Parse log level from message
 */
function parseLogLevel(message: string): 'info' | 'warn' | 'error' | 'debug' {
  const lowercaseMsg = message.toLowerCase();
  if (lowercaseMsg.includes('error')) return 'error';
  if (lowercaseMsg.includes('warn')) return 'warn';
  if (lowercaseMsg.includes('debug')) return 'debug';
  return 'info';
}

/**
 * Example: Component that demonstrates all debug features
 */
function DebugDemoComponent() {
  const { addAPILog, addServerLog } = useDebugStore();
  const { showLoadingOverlay, hideLoadingOverlay, updateLoadingOverlay } = useUIStore();

  const handleAPIDemo = () => {
    // Simulate successful API call
    addAPILog({
      method: 'GET',
      endpoint: '/buckets',
      status: 200,
      responseBody: {
        status: 'success',
        data: { buckets: [] },
      },
      duration: 150,
    });

    // Simulate failed API call
    setTimeout(() => {
      addAPILog({
        method: 'POST',
        endpoint: '/buckets/test/objects',
        status: 500,
        requestBody: { key: 'file.txt' },
        error: 'Internal server error',
        duration: 300,
      });
    }, 1000);
  };

  const handleServerLogDemo = () => {
    addServerLog({
      level: 'info',
      message: 'Server started successfully on port 3000',
      source: 'server',
    });

    setTimeout(() => {
      addServerLog({
        level: 'warn',
        message: 'High memory usage detected',
        source: 'monitor',
      });
    }, 1000);

    setTimeout(() => {
      addServerLog({
        level: 'error',
        message: 'Failed to connect to R2: Invalid credentials',
        source: 'r2-client',
      });
    }, 2000);
  };

  const handleLoadingDemo = async () => {
    // Indeterminate loading
    showLoadingOverlay('Loading buckets...');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Determinate loading with progress
    showLoadingOverlay('Downloading files...', { progress: 0 });

    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      updateLoadingOverlay(`Downloading files... ${i}%`, i);
    }

    hideLoadingOverlay();
  };

  const handleCancellableLoadingDemo = () => {
    showLoadingOverlay('Processing large file...', {
      isCancellable: true,
      onCancel: () => {
        console.log('User cancelled the operation');
        addServerLog({
          level: 'warn',
          message: 'User cancelled file processing',
          source: 'ui',
        });
      },
    });
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Debug Component Demos</h2>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={handleAPIDemo}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Demo API Logs
        </button>

        <button
          onClick={handleServerLogDemo}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Demo Server Logs
        </button>

        <button
          onClick={handleLoadingDemo}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Demo Loading (Progress)
        </button>

        <button
          onClick={handleCancellableLoadingDemo}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
        >
          Demo Cancellable Loading
        </button>
      </div>
    </div>
  );
}

/**
 * Example: API Client with automatic logging
 */
class APIClientWithLogging {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async get(endpoint: string) {
    return this.request('GET', endpoint);
  }

  async post(endpoint: string, data: any) {
    return this.request('POST', endpoint, {
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async delete(endpoint: string) {
    return this.request('DELETE', endpoint);
  }

  private async request(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    endpoint: string,
    options: RequestInit = {}
  ) {
    const startTime = Date.now();
    const { addAPILog } = useDebugStore.getState();

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method,
        ...options,
      });

      const data = await response.json();
      const duration = Date.now() - startTime;

      // Log the API call
      addAPILog({
        method,
        endpoint,
        status: response.status,
        requestBody: options.body ? JSON.parse(options.body as string) : undefined,
        responseBody: data,
        duration,
      });

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log the error
      addAPILog({
        method,
        endpoint,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });

      throw error;
    }
  }
}

/**
 * Example: Usage in a component
 */
function BucketListComponent() {
  const { showLoadingOverlay, hideLoadingOverlay } = useUIStore();
  const { addServerLog } = useDebugStore();
  const [buckets, setBuckets] = React.useState([]);

  const loadBuckets = async () => {
    showLoadingOverlay('Loading buckets...');

    try {
      const apiClient = new APIClientWithLogging('http://localhost:3000');
      const data = await apiClient.get('/buckets');

      setBuckets(data.data.buckets);

      addServerLog({
        level: 'info',
        message: `Successfully loaded ${data.data.buckets.length} buckets`,
        source: 'bucket-list',
      });
    } catch (error) {
      addServerLog({
        level: 'error',
        message: `Failed to load buckets: ${error.message}`,
        source: 'bucket-list',
      });

      alert('Failed to load buckets');
    } finally {
      hideLoadingOverlay();
    }
  };

  React.useEffect(() => {
    loadBuckets();
  }, []);

  return (
    <div>
      {/* Render buckets */}
    </div>
  );
}

/**
 * Example: Keyboard shortcuts to toggle debug panel
 */
function useDebugKeyboardShortcut() {
  const { toggleDebugPanel } = useUIStore();

  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Cmd+Shift+D (Mac) or Ctrl+Shift+D (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        toggleDebugPanel();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [toggleDebugPanel]);
}

export {
  AppExample,
  DebugDemoComponent,
  APIClientWithLogging,
  BucketListComponent,
  useDebugKeyboardShortcut,
};
