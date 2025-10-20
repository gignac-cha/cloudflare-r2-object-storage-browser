/**
 * Services Index
 * Central export point for all service modules
 */

// API Client
export {
  apiClient,
  setBaseURL,
  getBaseURL,
  listBuckets,
  listObjects,
  downloadObject,
  uploadObject,
  deleteObject,
  deleteBatch,
  searchObjects,
  healthCheck,
  R2Error,
} from './apiClient.ts';

export type {
  ProgressCallback,
  DownloadProgressCallback,
  BatchDeleteProgressCallback,
} from './apiClient.ts';

// Cache Manager
export {
  cacheManager,
  saveToCache,
  getCachedFileURL,
  getCachedFileBlob,
  isCached,
  getCachedFileMetadata,
  removeCachedFile,
  clearCache,
  getCacheSize,
  getCachedFileKeys,
  getCacheStats,
  downloadCachedFile,
} from './cacheManager.ts';

export type { CacheStats, CacheMetadata } from './cacheManager.ts';

// IPC Service
export { ipcService, ipc } from './ipc.ts';

export type {
  ServerStatus,
  OpenFileOptions,
  SaveFileOptions,
  MessageBoxOptions,
  MessageBoxResponse,
  FileSelectionResult,
  ElectronAPI,
} from './ipc.ts';
