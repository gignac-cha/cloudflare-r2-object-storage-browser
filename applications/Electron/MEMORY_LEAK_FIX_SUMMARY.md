# Memory Leak Fix Summary

## Issue
IPC event listeners in `serverStore.ts` were being registered but never cleaned up, causing memory leaks when components mount/unmount repeatedly.

## Root Cause
1. **Missing cleanup functions in preload.ts**: The `server.onStatus` and `server.onLog` methods didn't exist in the server object (only legacy top-level versions existed)
2. **No cleanup in serverStore.ts**: The `setupListeners` method registered listeners but never stored or called the cleanup functions
3. **Missing return type**: The IPC service didn't properly type the cleanup function return values

## Solution

### 1. Fixed preload.ts (`/electron/preload.ts`)
Added `onStatus` and `onLog` methods to the `server` object that return cleanup functions:

```typescript
server: {
  // ... other methods
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
}
```

Updated TypeScript interface to reflect return type:
```typescript
export interface ElectronAPI {
  server: {
    // ...
    onStatus: (callback: (status: ServerStatus) => void) => () => void;
    onLog: (callback: (log: string) => void) => () => void;
  };
}
```

### 2. Updated ipc.ts (`/sources/services/ipc.ts`)
Updated methods to return cleanup functions:

```typescript
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
```

### 3. Fixed serverStore.ts (`/sources/stores/serverStore.ts`)
Implemented proper cleanup pattern:

**Key changes:**
- Store cleanup functions outside the store (prevents re-creation on render)
- Added `cleanup()` method to the store interface
- Modified `setupListeners()` to store cleanup functions
- Added comprehensive documentation with usage examples

```typescript
// Store cleanup functions outside the store
let cleanupStatus: (() => void) | undefined;
let cleanupLog: (() => void) | undefined;

export const useServerStore = create<ServerState & ServerActions>((set, get) => ({
  // ... state

  /**
   * Setup IPC event listeners for server status and logs.
   * IMPORTANT: Must call cleanup() when component unmounts to prevent memory leaks.
   */
  setupListeners: () => {
    // Clean up any existing listeners first
    get().cleanup();

    // Store cleanup functions
    cleanupStatus = window.electronAPI.server.onStatus((status) => {
      get().setStatus(status);
    });

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
```

### 4. Updated App.tsx (`/sources/App.tsx`)
Updated to use the new `server.onStatus/onLog` API:

```typescript
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
```

## Usage Pattern

### For Components Using serverStore

```typescript
import { useEffect } from 'react';
import { useServerStore } from '@/stores/serverStore';

function MyComponent() {
  useEffect(() => {
    const store = useServerStore.getState();

    // Setup listeners on mount
    store.setupListeners();

    // Clean up on unmount
    return () => {
      store.cleanup();
    };
  }, []);

  // ... component code
}
```

### Direct IPC Usage (Like App.tsx)

```typescript
useEffect(() => {
  let cleanupStatus: (() => void) | undefined;
  let cleanupLog: (() => void) | undefined;

  if (window.electronAPI?.server) {
    cleanupStatus = window.electronAPI.server.onStatus((status) => {
      // handle status
    });

    cleanupLog = window.electronAPI.server.onLog((log) => {
      // handle log
    });
  }

  return () => {
    cleanupStatus?.();
    cleanupLog?.();
  };
}, []);
```

## Testing

To verify the fix works:

1. **Build the application:**
   ```bash
   cd applications/Electron
   pnpm build:electron
   ```

2. **Open the built app:**
   ```bash
   open release/mac/Cloudflare\ R2\ Browser.app
   ```

3. **Monitor for memory leaks:**
   - Open Chrome DevTools (Cmd+Option+I)
   - Go to Performance tab
   - Take heap snapshots while navigating between views
   - Verify that detached IPC listeners are properly cleaned up

## Files Modified

1. `/applications/Electron/electron/preload.ts` - Added server.onStatus/onLog methods
2. `/applications/Electron/sources/services/ipc.ts` - Updated return types
3. `/applications/Electron/sources/stores/serverStore.ts` - Added cleanup pattern
4. `/applications/Electron/sources/App.tsx` - Updated to use new API

## Benefits

1. **No Memory Leaks**: IPC listeners are properly removed when components unmount
2. **Type Safety**: TypeScript ensures cleanup functions are used correctly
3. **Backward Compatible**: Old top-level API still exists for legacy code
4. **Well Documented**: Clear usage examples and warnings in code comments
5. **Testable**: Cleanup can be verified through DevTools heap snapshots

## State Management Architecture

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Electron Main Process                     │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │ Server       │ ─emit─> │ IPC Events   │                  │
│  │ (Node.js)    │         │ (status/log) │                  │
│  └──────────────┘         └──────────────┘                  │
└───────────────────────────────┬─────────────────────────────┘
                                │
                                │ IPC Channel
                                │
┌───────────────────────────────▼─────────────────────────────┐
│                   Preload Bridge (Context)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ window.electronAPI.server.onStatus()  ─returns─>     │   │
│  │   Cleanup: () => ipcRenderer.removeListener()        │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────────┬─────────────────────────────┘
                                │
                                │ Exposed API
                                │
┌───────────────────────────────▼─────────────────────────────┐
│                    Renderer Process (React)                  │
│                                                              │
│  ┌────────────────┐            ┌──────────────────────┐    │
│  │ App.tsx        │            │ serverStore.ts       │    │
│  │                │            │                      │    │
│  │ useEffect(() => {           │ setupListeners() {   │    │
│  │   cleanup =    │            │   cleanup =          │    │
│  │     server.onStatus()       │     server.onStatus()│    │
│  │                │            │ }                    │    │
│  │   return () => {            │                      │    │
│  │     cleanup();│            │ cleanup() {          │    │
│  │   }            │            │   cleanup?.();       │    │
│  │ }, []);        │            │ }                    │    │
│  └────────────────┘            └──────────────────────┘    │
│         │                              │                    │
│         └──────────┬───────────────────┘                    │
│                    │                                        │
│                    ▼                                        │
│         ┌─────────────────────┐                            │
│         │ Component State     │                            │
│         │ (serverStatus, logs)│                            │
│         └─────────────────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

### State Lifecycle

1. **Mount**: Component/Store calls `setupListeners()` or `server.onStatus()`
   - IPC listener is registered
   - Cleanup function is stored

2. **Runtime**: Events flow from main process -> preload -> renderer
   - Server emits status/log events
   - Preload forwards to registered callbacks
   - Store/Component updates state

3. **Unmount**: Component cleanup or `store.cleanup()` is called
   - Stored cleanup function is invoked
   - IPC listener is removed
   - No memory leak

### Cleanup Pattern Benefits

- **Single Source of Truth**: Cleanup functions stored outside store
- **Idempotent**: Can call cleanup() multiple times safely
- **No Duplicates**: setupListeners() calls cleanup() first
- **Type Safe**: TypeScript enforces cleanup function handling
- **Predictable**: Same lifecycle as React components

## Notes

- The legacy top-level API (`window.electronAPI.onServerStatus`) still exists for backward compatibility but should not be used in new code
- All new code should use `window.electronAPI.server.onStatus/onLog`
- Components using the serverStore MUST call `cleanup()` on unmount
- The cleanup pattern follows React best practices for side effects
