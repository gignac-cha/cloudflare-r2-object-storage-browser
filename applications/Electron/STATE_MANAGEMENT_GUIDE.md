# State Management Guide - Electron App

## Overview

This Electron application uses **Zustand** for state management with proper IPC event listener cleanup to prevent memory leaks.

## Architecture Principles

1. **Single Source of Truth**: Each piece of state has one canonical location
2. **Unidirectional Data Flow**: State flows down, actions flow up
3. **Proper Cleanup**: IPC listeners are cleaned up on unmount
4. **Type Safety**: Full TypeScript support with proper types
5. **Separation of Concerns**: UI state separate from business logic

## Store Structure

```
sources/stores/
├── serverStore.ts      # Server status and logs (IPC events)
├── debugStore.ts       # Debug panel state
├── settingsStore.ts    # App settings
└── uiStore.ts          # UI state (modals, loading, etc.)
```

## IPC Event Listener Pattern

### Problem: Memory Leaks
Without proper cleanup, IPC event listeners accumulate every time a component mounts, causing memory leaks.

### Solution: Cleanup Functions
All IPC event listeners return cleanup functions that must be called on unmount.

### Implementation

#### 1. Preload Bridge (electron/preload.ts)

```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  server: {
    // Methods that return cleanup functions
    onStatus: (callback: (status: ServerStatus) => void) => {
      const listener = (_event: IpcRendererEvent, status: ServerStatus) =>
        callback(status);
      ipcRenderer.on('server:status', listener);

      // Return cleanup function
      return () => ipcRenderer.removeListener('server:status', listener);
    },
    onLog: (callback: (log: string) => void) => {
      const listener = (_event: IpcRendererEvent, log: string) =>
        callback(log);
      ipcRenderer.on('server:log', listener);

      // Return cleanup function
      return () => ipcRenderer.removeListener('server:log', listener);
    },
  }
});
```

#### 2. Store with Cleanup (sources/stores/serverStore.ts)

```typescript
import { create } from 'zustand';

// Store cleanup functions OUTSIDE the store to prevent re-creation
let cleanupStatus: (() => void) | undefined;
let cleanupLog: (() => void) | undefined;

export const useServerStore = create<ServerState & ServerActions>((set, get) => ({
  // State
  isRunning: false,
  port: null,
  logs: [],

  // Setup IPC listeners
  setupListeners: () => {
    // Clean up existing listeners first
    get().cleanup();

    // Register listeners and store cleanup functions
    cleanupStatus = window.electronAPI.server.onStatus((status) => {
      get().setStatus(status);
    });

    cleanupLog = window.electronAPI.server.onLog((log) => {
      get().addLog(log);
    });
  },

  // Cleanup IPC listeners
  cleanup: () => {
    cleanupStatus?.();
    cleanupLog?.();
    cleanupStatus = undefined;
    cleanupLog = undefined;
  },
}));
```

#### 3. Component Usage

```typescript
import { useEffect } from 'react';
import { useServerStore } from '@/stores/serverStore';

function MyComponent() {
  const { isRunning, port, logs } = useServerStore();

  useEffect(() => {
    const store = useServerStore.getState();

    // Setup listeners on mount
    store.setupListeners();

    // Clean up on unmount (CRITICAL!)
    return () => {
      store.cleanup();
    };
  }, []);

  return (
    <div>
      <p>Server: {isRunning ? 'Running' : 'Stopped'}</p>
      <p>Port: {port}</p>
      {logs.map((log, i) => <p key={i}>{log}</p>)}
    </div>
  );
}
```

## Common Patterns

### Pattern 1: Direct IPC in Component (App.tsx)

For components that don't need a shared store:

```typescript
function App() {
  const [serverStatus, setServerStatus] = useState<ServerStatus>({
    isRunning: false,
    port: null,
  });

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    if (window.electronAPI?.server) {
      cleanup = window.electronAPI.server.onStatus(setServerStatus);
    }

    return () => {
      cleanup?.();
    };
  }, []);

  return <div>Status: {serverStatus.isRunning ? 'Running' : 'Stopped'}</div>;
}
```

### Pattern 2: Store with IPC (serverStore.ts)

For shared state across multiple components:

```typescript
// Store handles IPC internally
const store = useServerStore.getState();

// Component A
useEffect(() => {
  store.setupListeners();
  return () => store.cleanup();
}, []);

// Component B
const { isRunning } = useServerStore();
// Just reads state, no IPC setup needed
```

### Pattern 3: Store without IPC (settingsStore.ts)

For simple state management without IPC events:

```typescript
export const useSettingsStore = create<SettingsState & SettingsActions>((set) => ({
  theme: 'light',
  accountId: '',
  accessKeyId: '',

  setTheme: (theme) => set({ theme }),
  setCredentials: (accountId, accessKeyId, secretAccessKey) => {
    set({ accountId, accessKeyId, secretAccessKey });
    // Persist to electron-store
    window.electronAPI.settings.set('credentials', { accountId, accessKeyId });
  },
}));
```

## Async Operations

### Loading State Pattern

```typescript
interface LoadingState<T> {
  status: 'idle' | 'loading' | 'success' | 'error';
  data?: T;
  error?: Error;
}

export const useBucketStore = create<BucketState & BucketActions>((set) => ({
  bucketsState: { status: 'idle' },

  loadBuckets: async () => {
    set({ bucketsState: { status: 'loading' } });

    try {
      const response = await fetch('http://localhost:3000/api/buckets');
      const data = await response.json();

      set({
        bucketsState: {
          status: 'success',
          data: data.buckets
        }
      });
    } catch (error) {
      set({
        bucketsState: {
          status: 'error',
          error: error as Error
        }
      });
    }
  },
}));
```

### Usage in Component

```typescript
function BucketList() {
  const { bucketsState, loadBuckets } = useBucketStore();

  useEffect(() => {
    loadBuckets();
  }, [loadBuckets]);

  if (bucketsState.status === 'loading') {
    return <div>Loading...</div>;
  }

  if (bucketsState.status === 'error') {
    return <div>Error: {bucketsState.error?.message}</div>;
  }

  return (
    <div>
      {bucketsState.data?.map(bucket => (
        <div key={bucket.name}>{bucket.name}</div>
      ))}
    </div>
  );
}
```

## Optimistic Updates

For better UX, update UI immediately then rollback on error:

```typescript
export const useFileStore = create<FileState & FileActions>((set, get) => ({
  files: [],

  deleteFile: async (fileKey: string) => {
    // Optimistic update
    const originalFiles = get().files;
    set({ files: originalFiles.filter(f => f.key !== fileKey) });

    try {
      await fetch(`http://localhost:3000/api/files/${fileKey}`, {
        method: 'DELETE',
      });
      // Success - UI already updated
    } catch (error) {
      // Rollback on error
      set({ files: originalFiles });
      throw error;
    }
  },
}));
```

## Testing Stores

### Unit Testing with Zustand

```typescript
import { renderHook, act } from '@testing-library/react';
import { useServerStore } from './serverStore';

describe('serverStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useServerStore.setState({
      isRunning: false,
      port: null,
      logs: [],
    });
  });

  it('should update server status', () => {
    const { result } = renderHook(() => useServerStore());

    act(() => {
      result.current.setStatus({ isRunning: true, port: 3000 });
    });

    expect(result.current.isRunning).toBe(true);
    expect(result.current.port).toBe(3000);
  });

  it('should add logs', () => {
    const { result } = renderHook(() => useServerStore());

    act(() => {
      result.current.addLog('Test log');
    });

    expect(result.current.logs).toEqual(['Test log']);
  });

  it('should clean up listeners', () => {
    const { result } = renderHook(() => useServerStore());
    const cleanupSpy = jest.fn();

    // Mock cleanup function
    (window.electronAPI.server.onStatus as jest.Mock).mockReturnValue(cleanupSpy);

    act(() => {
      result.current.setupListeners();
    });

    act(() => {
      result.current.cleanup();
    });

    expect(cleanupSpy).toHaveBeenCalled();
  });
});
```

## Performance Optimization

### Selective State Subscription

Only subscribe to the state you need:

```typescript
// ❌ BAD: Re-renders on ANY state change
function MyComponent() {
  const store = useServerStore();
  return <div>{store.isRunning}</div>;
}

// ✅ GOOD: Only re-renders when isRunning changes
function MyComponent() {
  const isRunning = useServerStore(state => state.isRunning);
  return <div>{isRunning}</div>;
}
```

### Shallow Comparison

For multiple values:

```typescript
import { shallow } from 'zustand/shallow';

function MyComponent() {
  const { isRunning, port } = useServerStore(
    state => ({ isRunning: state.isRunning, port: state.port }),
    shallow
  );

  return <div>{isRunning ? `Running on ${port}` : 'Stopped'}</div>;
}
```

### Computed Values

Avoid computing in component, do it in store:

```typescript
export const useFileStore = create<FileState & FileActions>((set, get) => ({
  files: [],
  selectedFileKeys: [],

  // Computed value
  getSelectedFiles: () => {
    const { files, selectedFileKeys } = get();
    return files.filter(f => selectedFileKeys.includes(f.key));
  },
}));

// Usage
function SelectedFiles() {
  const getSelectedFiles = useFileStore(state => state.getSelectedFiles);
  const selectedFiles = getSelectedFiles();

  return <div>{selectedFiles.length} selected</div>;
}
```

## Best Practices

### 1. Store Organization

- One store per domain (server, files, buckets, UI)
- Keep stores focused and cohesive
- Don't create a single giant store

### 2. State Updates

- Always use `set()` to update state
- Never mutate state directly
- Use immer middleware for complex updates if needed

### 3. IPC Listeners

- ALWAYS clean up IPC listeners on unmount
- Store cleanup functions outside the store
- Call `cleanup()` before `setupListeners()` to avoid duplicates

### 4. Type Safety

- Define interfaces for State and Actions
- Use TypeScript strict mode
- Type all IPC callbacks and returns

### 5. Side Effects

- Handle side effects in store actions, not components
- Use async/await for API calls
- Handle errors gracefully

## Common Pitfalls

### ❌ Forgetting Cleanup

```typescript
// Memory leak - listeners never removed
useEffect(() => {
  store.setupListeners();
  // Missing cleanup!
}, []);
```

### ❌ Direct State Mutation

```typescript
// Wrong - mutates state
const files = useFileStore(state => state.files);
files.push(newFile); // ❌ DON'T DO THIS

// Correct - creates new array
const addFile = useFileStore(state => state.addFile);
addFile(newFile); // ✅ GOOD
```

### ❌ Storing Cleanup in Store

```typescript
// Wrong - cleanup functions recreated on every render
export const useServerStore = create((set) => ({
  cleanup: undefined, // ❌ Don't store in state
  setupListeners: () => {
    set({ cleanup: window.electronAPI.server.onStatus(...) });
  },
}));

// Correct - store outside
let cleanup: (() => void) | undefined; // ✅ Outside store
```

### ❌ Missing Dependencies

```typescript
// Wrong - missing dependency
const { loadBuckets } = useBucketStore();
useEffect(() => {
  loadBuckets();
}, []); // ❌ Missing loadBuckets

// Correct - include dependency or use getState()
useEffect(() => {
  useBucketStore.getState().loadBuckets();
}, []); // ✅ No dependencies needed with getState()
```

## Debugging

### Zustand DevTools

```typescript
import { devtools } from 'zustand/middleware';

export const useServerStore = create(
  devtools(
    (set, get) => ({
      // ... store
    }),
    { name: 'ServerStore' }
  )
);
```

### Logging State Changes

```typescript
export const useServerStore = create((set, get) => ({
  setStatus: (status) => {
    console.log('[ServerStore] Status updated:', status);
    set({ isRunning: status.isRunning, port: status.port });
  },
}));
```

### Memory Leak Detection

1. Open Chrome DevTools (Cmd+Option+I)
2. Go to Memory tab
3. Take heap snapshot
4. Navigate/remount components
5. Take another snapshot
6. Compare to see if listeners are cleaned up

## Resources

- [Zustand Documentation](https://zustand.docs.pmnd.rs/)
- [Electron IPC Tutorial](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [React Hooks Best Practices](https://react.dev/reference/react)
- [Memory Leak Fix Summary](./MEMORY_LEAK_FIX_SUMMARY.md)
