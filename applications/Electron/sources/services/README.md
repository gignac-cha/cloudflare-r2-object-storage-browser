# Services

This directory contains all service modules for the Electron R2 Browser application.

## Overview

The services are ported from the macOS SwiftUI application and provide:

1. **API Client** - HTTP client for R2 operations
2. **Cache Manager** - Local file cache using IndexedDB
3. **IPC Service** - Type-safe Electron IPC wrapper

## API Client (`apiClient.ts`)

### Features

- Singleton pattern for centralized HTTP client
- All R2 operations via REST API
- Comprehensive error handling with custom R2Error class
- Progress callbacks for uploads/downloads
- Automatic batching for delete operations
- Type-safe response handling

### Usage

```typescript
import { apiClient, listBuckets, uploadObject, R2Error } from '@/services';

// List buckets
try {
  const buckets = await listBuckets();
  console.log('Buckets:', buckets);
} catch (error) {
  if (error instanceof R2Error) {
    console.error('R2 Error:', error.code, error.message);
  }
}

// Upload with progress
await uploadObject(
  'my-bucket',
  'folder/file.pdf',
  fileData,
  (progress) => {
    console.log(`Upload progress: ${progress}%`);
  }
);

// Download with progress
const { data, response } = await downloadObject(
  'my-bucket',
  'folder/file.pdf',
  (loaded, total) => {
    const percent = (loaded / total) * 100;
    console.log(`Download: ${percent}%`);
  }
);

// Batch delete with progress
await deleteBatch(
  'my-bucket',
  ['file1.txt', 'file2.txt', 'file3.txt'],
  (deleted, total) => {
    console.log(`Deleted ${deleted} of ${total}`);
  }
);

// Set base URL when server port changes
import { setBaseURL } from '@/services';
setBaseURL(3001);
```

### API Methods

| Method | Description |
|--------|-------------|
| `listBuckets()` | List all R2 buckets |
| `listObjects(bucket, prefix?, delimiter?, maxKeys?, token?)` | List objects with pagination |
| `downloadObject(bucket, key, onProgress?)` | Download object data |
| `uploadObject(bucket, key, data, onProgress?)` | Upload object data |
| `deleteObject(bucket, key)` | Delete single object |
| `deleteBatch(bucket, keys, onProgress?)` | Delete multiple objects (max 1000/batch) |
| `searchObjects(bucket, query)` | Search objects by name |
| `healthCheck()` | Check API server health |

### Error Handling

```typescript
import { R2Error } from '@/services';

try {
  await someOperation();
} catch (error) {
  if (error instanceof R2Error) {
    switch (error.code) {
      case 'UNAUTHORIZED':
        // Handle auth error
        break;
      case 'NOT_FOUND':
        // Handle not found
        break;
      case 'NETWORK_ERROR':
        // Handle network issue
        break;
      default:
        // Handle other errors
    }
  }
}
```

## Cache Manager (`cacheManager.ts`)

### Features

- IndexedDB-based cache (browser-compatible)
- Blob storage for file data
- Metadata tracking (bucket, size, etag, timestamp)
- Cache statistics (size, file count)
- Direct download from cache

### Usage

```typescript
import { cacheManager, saveToCache, isCached, getCachedFileURL } from '@/services';

// Save file to cache
await saveToCache(blob, 'folder/file.pdf', 'my-bucket', 'etag-123');

// Check if cached
const cached = await isCached('folder/file.pdf');

// Get cached file as Blob URL
if (cached) {
  const url = await getCachedFileURL('folder/file.pdf');
  // Use URL in <img>, <video>, or other elements
  // Remember to revoke: URL.revokeObjectURL(url)
}

// Get cached file as Blob
const blob = await getCachedFileBlob('folder/file.pdf');

// Get metadata
const metadata = await getCachedFileMetadata('folder/file.pdf');
console.log('Cached at:', metadata?.cachedAt);

// Download cached file (triggers browser download dialog)
await downloadCachedFile('folder/file.pdf', 'document.pdf');

// Get cache statistics
const stats = await getCacheStats();
console.log(`${stats.totalFiles} files, ${stats.totalSize} bytes`);

// Remove file from cache
await removeCachedFile('folder/file.pdf');

// Clear entire cache
await clearCache();
```

### Cache Metadata

```typescript
interface CacheMetadata {
  key: string;           // Object key
  bucket: string;        // Bucket name
  size: number;          // File size in bytes
  cachedAt: string;      // ISO timestamp
  etag?: string;         // ETag for versioning
}
```

## IPC Service (`ipc.ts`)

### Features

- Type-safe wrapper for Electron IPC
- Convenient helper methods
- Server management
- File dialogs
- Settings/storage
- Shell operations
- Clipboard access

### Usage

```typescript
import { ipc } from '@/services';

// Server management
await ipc.startServer();
await ipc.stopServer();
await ipc.restartServer();

const status = await ipc.getServerStatus();
console.log('Server running:', status.isRunning, 'Port:', status.port);

// Listen to server events
ipc.onServerStatus((status) => {
  console.log('Server status changed:', status);
});

ipc.onServerLog((log) => {
  console.log('Server log:', log);
});

// File dialogs
const result = await ipc.showOpenFileDialog({
  title: 'Select files to upload',
  properties: ['openFile', 'multiSelections'],
  filters: [
    { name: 'Images', extensions: ['jpg', 'png', 'gif'] },
    { name: 'All Files', extensions: ['*'] }
  ]
});

if (!result.canceled) {
  console.log('Selected files:', result.filePaths);
}

// Save dialog
const saveResult = await ipc.showSaveFileDialog({
  title: 'Save file',
  defaultPath: 'document.pdf',
  filters: [{ name: 'PDF', extensions: ['pdf'] }]
});

// Message boxes
const confirmed = await ipc.showConfirmDialog(
  'Delete File',
  'Are you sure you want to delete this file?',
  'Delete',
  'Cancel'
);

await ipc.showErrorDialog('Error', 'Failed to upload file', error.message);

// Settings
await ipc.setSetting('credentials', {
  accountId: '...',
  accessKeyId: '...',
  secretAccessKey: '...'
});

const creds = await ipc.getSetting('credentials');

// Shell operations
await ipc.openExternal('https://example.com');
await ipc.openPath('/path/to/folder');

// Clipboard
await ipc.copyToClipboard('Text to copy', 'Copied to clipboard!');

// App paths
const userDataPath = await ipc.getUserDataPath();
console.log('App data:', userDataPath);
```

### Dialog Options

```typescript
// Open file dialog
interface OpenFileOptions {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
  properties?: Array<
    'openFile' | 'openDirectory' | 'multiSelections' |
    'showHiddenFiles' | 'createDirectory' | 'promptToCreate'
  >;
}

// Save file dialog
interface SaveFileOptions {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
  properties?: Array<
    'showHiddenFiles' | 'createDirectory' | 'showOverwriteConfirmation'
  >;
}

// Message box
interface MessageBoxOptions {
  type?: 'none' | 'info' | 'error' | 'question' | 'warning';
  title?: string;
  message: string;
  detail?: string;
  buttons?: string[];
  defaultId?: number;
  cancelId?: number;
}
```

## Complete Example

```typescript
import {
  apiClient,
  setBaseURL,
  listBuckets,
  listObjects,
  downloadObject,
  uploadObject,
  deleteObject,
  saveToCache,
  isCached,
  getCachedFileURL,
  ipc,
  R2Error,
} from '@/services';

// Initialize
async function initialize() {
  // Wait for server to start
  ipc.onServerStatus(async (status) => {
    if (status.isRunning && status.port) {
      // Update API base URL
      setBaseURL(status.port);

      // Load buckets
      await loadBuckets();
    }
  });

  // Start server if not running
  const status = await ipc.getServerStatus();
  if (!status.isRunning) {
    await ipc.startServer();
  }
}

// Load buckets
async function loadBuckets() {
  try {
    const buckets = await listBuckets();
    console.log('Loaded buckets:', buckets);
  } catch (error) {
    if (error instanceof R2Error) {
      await ipc.showErrorDialog('Error', 'Failed to load buckets', error.message);
    }
  }
}

// Upload file
async function uploadFile() {
  // Show file picker
  const result = await ipc.showOpenFileDialog({
    title: 'Select file to upload',
    properties: ['openFile'],
  });

  if (result.canceled) return;

  const filePath = result.filePaths[0];
  const fileName = filePath.split('/').pop() ?? 'file';

  try {
    // Read file (via File API or fs)
    const file = await fetchFileFromPath(filePath);

    // Upload with progress
    await uploadObject(
      'my-bucket',
      `uploads/${fileName}`,
      file,
      (progress) => {
        console.log(`Uploading: ${progress.toFixed(1)}%`);
      }
    );

    await ipc.showInfoDialog('Success', 'File uploaded successfully');
  } catch (error) {
    if (error instanceof R2Error) {
      await ipc.showErrorDialog('Upload Error', 'Failed to upload file', error.message);
    }
  }
}

// Download file
async function downloadFile(bucket: string, key: string) {
  try {
    // Check cache first
    const cached = await isCached(key);

    if (cached) {
      const confirmed = await ipc.showConfirmDialog(
        'Use Cached Version',
        'This file is cached. Use cached version?',
        'Use Cache',
        'Download Fresh'
      );

      if (confirmed) {
        const url = await getCachedFileURL(key);
        // Use cached URL
        return url;
      }
    }

    // Download fresh
    const { data } = await downloadObject(
      bucket,
      key,
      (loaded, total) => {
        const percent = (loaded / total) * 100;
        console.log(`Downloading: ${percent.toFixed(1)}%`);
      }
    );

    // Save to cache
    await saveToCache(data, key, bucket);

    // Get URL
    const url = await getCachedFileURL(key);
    return url;
  } catch (error) {
    if (error instanceof R2Error) {
      await ipc.showErrorDialog('Download Error', 'Failed to download file', error.message);
    }
  }
}
```

## TypeScript Types

All services export TypeScript interfaces and types for complete type safety:

- `APIResponse<T>` - Generic API response wrapper
- `BucketsResponse` - Bucket list response
- `ObjectsResponse` - Object list response with pagination
- `R2Error` - Custom error class
- `CacheMetadata` - Cache entry metadata
- `CacheStats` - Cache statistics
- `ServerStatus` - Server status
- `OpenFileOptions` - File dialog options
- `SaveFileOptions` - Save dialog options
- `MessageBoxOptions` - Message box options

## Best Practices

1. **Always handle errors**
   ```typescript
   try {
     await operation();
   } catch (error) {
     if (error instanceof R2Error) {
       // Handle R2 error
     }
   }
   ```

2. **Use progress callbacks for large operations**
   ```typescript
   await uploadObject(bucket, key, data, (progress) => {
     updateUI(progress);
   });
   ```

3. **Check cache before downloading**
   ```typescript
   if (await isCached(key)) {
     return await getCachedFileURL(key);
   }
   ```

4. **Cleanup Blob URLs**
   ```typescript
   const url = await getCachedFileURL(key);
   // Use URL
   URL.revokeObjectURL(url); // Cleanup
   ```

5. **Use IPC for native dialogs**
   ```typescript
   const confirmed = await ipc.showConfirmDialog(...);
   if (confirmed) {
     // Proceed
   }
   ```
