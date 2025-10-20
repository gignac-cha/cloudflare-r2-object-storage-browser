# Quick Start Guide - Debug Components Integration

**5-Minute Setup Guide**

---

## 1. Add Components to App

```tsx
// applications/Electron/src/App.tsx
import React from 'react';
import { DebugPanel } from './components/debug';
import { SettingsModal } from './components/modals';
import { LoadingOverlay } from './components/loading';

function App() {
  return (
    <div className="h-screen flex flex-col">
      {/* Your existing app content */}
      <YourMainLayout />

      {/* Add these three components */}
      <DebugPanel />
      <SettingsModal />
      <LoadingOverlay />
    </div>
  );
}

export default App;
```

---

## 2. Show Settings on First Launch

```tsx
// In your App.tsx or layout component
import { useEffect } from 'react';
import { useSettingsStore, useUIStore } from '../../../src/stores';

function App() {
  const { hasCredentials } = useSettingsStore();
  const { setSettingsVisible } = useUIStore();

  useEffect(() => {
    if (!hasCredentials) {
      setSettingsVisible(true);
    }
  }, [hasCredentials, setSettingsVisible]);

  // ... rest of your app
}
```

---

## 3. Add API Logging

```tsx
// In your API client (e.g., src/services/apiClient.ts)
import { useDebugStore } from '../stores';

export async function fetchBuckets() {
  const startTime = Date.now();
  const { addAPILog } = useDebugStore.getState();

  try {
    const response = await fetch('http://localhost:3000/buckets');
    const data = await response.json();

    // Log successful request
    addAPILog({
      method: 'GET',
      endpoint: '/buckets',
      status: response.status,
      responseBody: data,
      duration: Date.now() - startTime,
    });

    return data;
  } catch (error) {
    // Log error
    addAPILog({
      method: 'GET',
      endpoint: '/buckets',
      error: error.message,
      duration: Date.now() - startTime,
    });
    throw error;
  }
}
```

---

## 4. Add Server Logging

```tsx
// In your server manager or wherever you capture server output
import { useDebugStore, useServerStore } from '../stores';

function onServerOutput(message: string) {
  const { addLog } = useServerStore.getState();
  const { addServerLog } = useDebugStore.getState();

  // Add to server store
  addLog(message);

  // Parse and add to debug store
  const level = message.toLowerCase().includes('error')
    ? 'error'
    : message.toLowerCase().includes('warn')
    ? 'warn'
    : 'info';

  addServerLog({
    level,
    message: message.trim(),
    source: 'server',
  });
}
```

---

## 5. Use Loading Overlay

```tsx
// In your data loading functions
import { useUIStore } from '../../../src/stores';

async function loadData() {
  const { showLoadingOverlay, hideLoadingOverlay } = useUIStore.getState();

  // Simple loading
  showLoadingOverlay('Loading buckets...');

  try {
    const data = await fetchBuckets();
    return data;
  } finally {
    hideLoadingOverlay();
  }
}

// With progress
async function downloadFiles(files) {
  const { showLoadingOverlay, updateLoadingOverlay, hideLoadingOverlay } =
    useUIStore.getState();

  showLoadingOverlay('Starting download...', { progress: 0 });

  for (let i = 0; i < files.length; i++) {
    await downloadFile(files[i]);
    const progress = ((i + 1) / files.length) * 100;
    updateLoadingOverlay(`Downloading ${i + 1}/${files.length}...`, progress);
  }

  hideLoadingOverlay();
}
```

---

## 6. Add Keyboard Shortcut (Optional)

```tsx
// Toggle debug panel with Cmd+Shift+D (Mac) or Ctrl+Shift+D (Windows)
import { useEffect } from 'react';
import { useUIStore } from '../../../src/stores';

function App() {
  const { toggleDebugPanel } = useUIStore();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        toggleDebugPanel();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [toggleDebugPanel]);

  // ... rest of your app
}
```

---

## 7. Add Toolbar Buttons (Optional)

```tsx
// Add debug and settings buttons to your toolbar
import { Settings, Bug } from 'lucide-react';
import { useUIStore } from '../../../src/stores';

function Toolbar() {
  const { setSettingsVisible, toggleDebugPanel } = useUIStore();

  return (
    <div className="flex items-center gap-2">
      {/* Your existing toolbar items */}

      <button
        onClick={() => toggleDebugPanel()}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        title="Toggle Debug Panel (Cmd+Shift+D)"
      >
        <Bug className="w-5 h-5" />
      </button>

      <button
        onClick={() => setSettingsVisible(true)}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        title="Settings"
      >
        <Settings className="w-5 h-5" />
      </button>
    </div>
  );
}
```

---

## Complete Minimal Example

```tsx
// applications/Electron/src/App.tsx
import React, { useEffect } from 'react';
import { useSettingsStore, useUIStore } from '../../../src/stores';
import { DebugPanel } from './components/debug';
import { SettingsModal } from './components/modals';
import { LoadingOverlay } from './components/loading';

function App() {
  const { hasCredentials } = useSettingsStore();
  const { setSettingsVisible, toggleDebugPanel } = useUIStore();

  // Show settings on first launch
  useEffect(() => {
    if (!hasCredentials) {
      setSettingsVisible(true);
    }
  }, [hasCredentials, setSettingsVisible]);

  // Keyboard shortcut for debug panel
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        toggleDebugPanel();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [toggleDebugPanel]);

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Cloudflare R2 Browser
        </h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {/* Your app content here */}
      </main>

      {/* Debug Panel (collapsible bottom panel) */}
      <DebugPanel />

      {/* Modals and Overlays */}
      <SettingsModal />
      <LoadingOverlay />
    </div>
  );
}

export default App;
```

---

## Testing the Components

### 1. Test Settings Modal

```tsx
// Open browser console and run:
useUIStore.getState().setSettingsVisible(true);
```

### 2. Test Loading Overlay

```tsx
// Indeterminate
useUIStore.getState().showLoadingOverlay('Testing loading...');

// Determinate with progress
useUIStore.getState().showLoadingOverlay('Testing...', { progress: 50 });

// Hide
useUIStore.getState().hideLoadingOverlay();
```

### 3. Test Debug Panel

```tsx
// Add some test logs
const { addAPILog, addServerLog } = useDebugStore.getState();

addAPILog({
  method: 'GET',
  endpoint: '/test',
  status: 200,
  responseBody: { message: 'Success' },
});

addServerLog({
  level: 'info',
  message: 'Test log message',
  source: 'test',
});

// Open debug panel
useUIStore.getState().setDebugPanelVisible(true);
```

---

## Store Methods Reference

### UIStore
```typescript
const {
  // Debug Panel
  isDebugPanelVisible,
  toggleDebugPanel,
  setDebugPanelVisible,

  // Settings Modal
  isSettingsVisible,
  setSettingsVisible,

  // Loading Overlay
  showLoadingOverlay,
  updateLoadingOverlay,
  hideLoadingOverlay,
} = useUIStore();
```

### DebugStore
```typescript
const {
  // API Logs
  apiLogs,
  addAPILog,
  clearAPILogs,
  exportAPILogs,
  getFilteredAPILogs,

  // Server Logs
  serverLogs,
  addServerLog,
  clearServerLogs,
  exportServerLogs,
  getFilteredServerLogs,

  // Search/Filter
  setAPISearchQuery,
  setLogsSearchQuery,
  setLogsLevelFilter,
} = useDebugStore();
```

### SettingsStore
```typescript
const {
  accountId,
  accessKeyId,
  secretAccessKey,
  hasCredentials,
  saveSettings,
  clearSettings,
} = useSettingsStore();
```

---

## Troubleshooting

### Components not showing?

1. Make sure components are added to App.tsx
2. Check visibility state in UIStore
3. Verify Tailwind CSS is working (check for classes in DevTools)

### Imports not working?

All imports use relative paths to monorepo root:
```typescript
import { useUIStore } from '../../../../../src/stores/useUIStore';
```

Adjust path based on your file location.

### Dark mode not working?

Add Tailwind dark mode class to root element:
```tsx
<html className="dark">
  {/* or use system preference */}
  <html className={systemPrefersDark ? 'dark' : ''}>
```

---

## More Information

- **Full Documentation:** `applications/Electron/src/components/COMPONENTS_GUIDE.md`
- **Integration Examples:** `applications/Electron/INTEGRATION_EXAMPLE.tsx`
- **Implementation Summary:** `DEBUG_COMPONENTS_SUMMARY.md`
- **File List:** `CREATED_FILES.md`

---

**You're all set!** Start integrating the components and enjoy the new debugging capabilities! 🚀
