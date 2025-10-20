/**
 * Cache Manager for R2 Object Storage Browser
 * Port from macOS SwiftUI application Services/CacheManager.swift
 *
 * Manages local file cache for downloaded objects
 * Uses browser-compatible APIs with IndexedDB for metadata and Blob storage
 */

/**
 * Cache file metadata
 */
export interface CacheMetadata {
  key: string;
  bucket: string;
  size: number;
  cachedAt: string;
  etag?: string;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  totalFiles: number;
  totalSize: number;
}

/**
 * Cache entry with data and metadata
 */
interface CacheEntry {
  metadata: CacheMetadata;
  data: Blob;
}

/**
 * IndexedDB-based Cache Manager
 * Browser-compatible cache implementation
 */
class CacheManager {
  private static instance: CacheManager;
  private dbName = 'r2-cache';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  private constructor() {
    // Initialization is async
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Initialize IndexedDB
   */
  private async initializeDB(): Promise<void> {
    if (this.db) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error('Failed to open cache database'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store for cache entries
        if (!db.objectStoreNames.contains('cache')) {
          const objectStore = db.createObjectStore('cache', { keyPath: 'key' });
          objectStore.createIndex('bucket', 'bucket', { unique: false });
          objectStore.createIndex('cachedAt', 'cachedAt', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Ensure database is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.db) {
      await this.initializeDB();
    }
  }

  /**
   * Save data to cache
   * @param data - File data (Blob or ArrayBuffer)
   * @param key - Object key in R2
   * @param bucket - Bucket name
   * @param etag - Optional ETag for versioning
   * @returns Cache key
   */
  public async saveToCache(
    data: Blob | ArrayBuffer,
    key: string,
    bucket?: string,
    etag?: string
  ): Promise<string> {
    await this.ensureInitialized();

    const blob = data instanceof Blob ? data : new Blob([data]);

    const entry: CacheEntry & { key: string } = {
      key,
      metadata: {
        key,
        bucket: bucket ?? 'unknown',
        size: blob.size,
        cachedAt: new Date().toISOString(),
        etag,
      },
      data: blob,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const objectStore = transaction.objectStore('cache');
      const request = objectStore.put(entry);

      request.onsuccess = () => resolve(key);
      request.onerror = () => reject(new Error(`Failed to save to cache: ${key}`));
    });
  }

  /**
   * Get cached file as Blob URL
   * @param key - Object key
   * @returns Blob URL if cached, undefined otherwise
   */
  public async getCachedFileURL(key: string): Promise<string | undefined> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readonly');
      const objectStore = transaction.objectStore('cache');
      const request = objectStore.get(key);

      request.onsuccess = () => {
        const entry = request.result as CacheEntry | undefined;
        if (entry?.data) {
          const blobUrl = URL.createObjectURL(entry.data);
          resolve(blobUrl);
        } else {
          resolve(undefined);
        }
      };

      request.onerror = () => reject(new Error(`Failed to get cached file: ${key}`));
    });
  }

  /**
   * Get cached file data as Blob
   * @param key - Object key
   * @returns Blob if cached, undefined otherwise
   */
  public async getCachedFileBlob(key: string): Promise<Blob | undefined> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readonly');
      const objectStore = transaction.objectStore('cache');
      const request = objectStore.get(key);

      request.onsuccess = () => {
        const entry = request.result as CacheEntry | undefined;
        resolve(entry?.data);
      };

      request.onerror = () => reject(new Error(`Failed to get cached file: ${key}`));
    });
  }

  /**
   * Check if file is cached
   * @param key - Object key
   * @returns True if file exists in cache
   */
  public async isCached(key: string): Promise<boolean> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readonly');
      const objectStore = transaction.objectStore('cache');
      const request = objectStore.get(key);

      request.onsuccess = () => resolve(request.result !== undefined);
      request.onerror = () => reject(new Error(`Failed to check cache: ${key}`));
    });
  }

  /**
   * Get cached file metadata
   * @param key - Object key
   * @returns Metadata if cached, undefined otherwise
   */
  public async getCachedFileMetadata(key: string): Promise<CacheMetadata | undefined> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readonly');
      const objectStore = transaction.objectStore('cache');
      const request = objectStore.get(key);

      request.onsuccess = () => {
        const entry = request.result as CacheEntry | undefined;
        resolve(entry?.metadata);
      };

      request.onerror = () => reject(new Error(`Failed to get metadata: ${key}`));
    });
  }

  /**
   * Remove cached file
   * @param key - Object key
   */
  public async removeCachedFile(key: string): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const objectStore = transaction.objectStore('cache');
      const request = objectStore.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to remove cached file: ${key}`));
    });
  }

  /**
   * Clear entire cache
   */
  public async clearCache(): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const objectStore = transaction.objectStore('cache');
      const request = objectStore.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to clear cache'));
    });
  }

  /**
   * Get cache size in bytes
   * @returns Total size of all cached files
   */
  public async getCacheSize(): Promise<number> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readonly');
      const objectStore = transaction.objectStore('cache');
      const request = objectStore.getAll();

      request.onsuccess = () => {
        const entries = request.result as CacheEntry[];
        const totalSize = entries.reduce((sum, entry) => sum + (entry.metadata.size ?? 0), 0);
        resolve(totalSize);
      };

      request.onerror = () => reject(new Error('Failed to calculate cache size'));
    });
  }

  /**
   * Get all cached file keys
   * @returns Array of cached object keys
   */
  public async getCachedFileKeys(): Promise<string[]> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readonly');
      const objectStore = transaction.objectStore('cache');
      const request = objectStore.getAllKeys();

      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(new Error('Failed to get cached keys'));
    });
  }

  /**
   * Get cache statistics
   * @returns Cache statistics including file count and total size
   */
  public async getCacheStats(): Promise<CacheStats> {
    const keys = await this.getCachedFileKeys();
    const totalSize = await this.getCacheSize();

    return {
      totalFiles: keys.length,
      totalSize,
    };
  }

  /**
   * Download cached file
   * Triggers browser download dialog
   * @param key - Object key
   * @param fileName - Optional filename for download
   */
  public async downloadCachedFile(key: string, fileName?: string): Promise<void> {
    const blob = await this.getCachedFileBlob(key);

    if (!blob) {
      throw new Error(`File not found in cache: ${key}`);
    }

    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName ?? key.split('/').pop() ?? 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();

// Export individual functions for convenience
export const {
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
} = {
  saveToCache: (data: Blob | ArrayBuffer, key: string, bucket?: string, etag?: string) =>
    cacheManager.saveToCache(data, key, bucket, etag),
  getCachedFileURL: (key: string) => cacheManager.getCachedFileURL(key),
  getCachedFileBlob: (key: string) => cacheManager.getCachedFileBlob(key),
  isCached: (key: string) => cacheManager.isCached(key),
  getCachedFileMetadata: (key: string) => cacheManager.getCachedFileMetadata(key),
  removeCachedFile: (key: string) => cacheManager.removeCachedFile(key),
  clearCache: () => cacheManager.clearCache(),
  getCacheSize: () => cacheManager.getCacheSize(),
  getCachedFileKeys: () => cacheManager.getCachedFileKeys(),
  getCacheStats: () => cacheManager.getCacheStats(),
  downloadCachedFile: (key: string, fileName?: string) =>
    cacheManager.downloadCachedFile(key, fileName),
};
