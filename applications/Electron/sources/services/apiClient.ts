/**
 * API Client for R2 Object Storage Browser
 * Port from macOS SwiftUI application Services/APIClient.swift
 *
 * Provides HTTP client for all R2 operations via local API server
 * Includes error handling, timeout configuration, and progress callbacks
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import type {
  Bucket,
  BucketsResponse,
  R2Object,
  ObjectsResponse,
  APIResponse,
} from '../types/index.ts';

/**
 * API Client configuration
 */
interface APIClientConfig {
  baseURL: string;
  timeout: number;
}

/**
 * Progress callback function type
 */
export type ProgressCallback = (progress: number) => void;

/**
 * Download progress callback with loaded and total bytes
 */
export type DownloadProgressCallback = (loaded: number, total: number) => void;

/**
 * Upload object response
 */
interface ObjectUploadResponse {
  message: string;
  key: string;
  size: number;
  etag?: string;
}

/**
 * Delete object response
 */
interface ObjectDeleteResponse {
  message: string;
  key: string;
}

/**
 * Batch delete progress callback
 */
export type BatchDeleteProgressCallback = (deleted: number, total: number) => void;

/**
 * Error response shape from API server
 */
interface ErrorResponse {
  error?: string;
  message?: string;
}

/**
 * R2 API Error types
 */
export class R2Error extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'R2Error';
  }

  static configurationError(message: string): R2Error {
    return new R2Error(message, 'CONFIGURATION_ERROR');
  }

  static networkError(message: string): R2Error {
    return new R2Error(message, 'NETWORK_ERROR');
  }

  static invalidResponse(): R2Error {
    return new R2Error('Invalid response from server', 'INVALID_RESPONSE');
  }

  static unauthorized(): R2Error {
    return new R2Error('Unauthorized - check your credentials', 'UNAUTHORIZED', 401);
  }

  static notFound(resource: string): R2Error {
    return new R2Error(`Resource not found: ${resource}`, 'NOT_FOUND', 404);
  }

  static serverError(statusCode: number, message: string): R2Error {
    return new R2Error(message, 'SERVER_ERROR', statusCode);
  }

  static decodingError(message: string): R2Error {
    return new R2Error(`Failed to decode response: ${message}`, 'DECODING_ERROR');
  }
}

/**
 * API Client class
 * Singleton pattern for managing HTTP requests to local API server
 */
class APIClient {
  private static instance: APIClient;
  private axiosInstance: AxiosInstance;
  private config: APIClientConfig;

  private constructor() {
    // Default configuration
    this.config = {
      baseURL: 'http://localhost:3000',
      timeout: 120000, // 2 minutes for large uploads/downloads
    };

    // Create axios instance
    this.axiosInstance = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Setup interceptors
    this.setupInterceptors();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): APIClient {
    if (!APIClient.instance) {
      APIClient.instance = new APIClient();
    }
    return APIClient.instance;
  }

  /**
   * Update base URL when server port changes
   */
  public setBaseURL(port: number): void {
    this.config.baseURL = `http://localhost:${port}`;
    this.axiosInstance.defaults.baseURL = this.config.baseURL;
  }

  /**
   * Get current base URL
   */
  public getBaseURL(): string {
    return this.config.baseURL;
  }

  /**
   * Setup request/response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // You could add request logging here
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        return Promise.reject(this.handleError(error));
      }
    );
  }

  /**
   * Handle axios errors and convert to R2Error
   */
  private handleError(error: AxiosError): R2Error {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data as ErrorResponse | undefined;
      const message = data?.error ?? data?.message ?? error.message;

      switch (status) {
        case 401:
          return R2Error.unauthorized();
        case 404:
          return R2Error.notFound(message);
        case 500:
        case 502:
        case 503:
          return R2Error.serverError(status, message);
        default:
          return R2Error.serverError(status, message);
      }
    } else if (error.request) {
      // Request made but no response received
      return R2Error.networkError(
        'No response from server. Please check if the server is running.'
      );
    } else {
      // Something else happened
      return R2Error.configurationError(error.message ?? 'Unknown error occurred');
    }
  }

  /**
   * List all buckets
   * GET /buckets
   */
  public async listBuckets(): Promise<Bucket[]> {
    try {
      const response: AxiosResponse<APIResponse<BucketsResponse>> = await this.axiosInstance.get(
        '/buckets'
      );

      console.log('[APIClient] listBuckets response:', response.data);

      if (response.data.status === 'ok' && response.data.data) {
        return response.data.data.buckets;
      }

      console.error('[APIClient] Invalid response format:', response.data);
      throw R2Error.invalidResponse();
    } catch (error) {
      if (error instanceof R2Error) {
        throw error;
      }
      console.error('[APIClient] Network error:', error);
      throw R2Error.networkError(String(error));
    }
  }

  /**
   * List objects in a bucket with optional filtering and pagination
   * GET /buckets/:bucket/objects
   */
  public async listObjects(
    bucket: string,
    prefix?: string,
    delimiter?: string,
    maxKeys?: number,
    continuationToken?: string
  ): Promise<ObjectsResponse> {
    try {
      const params: Record<string, string | number> = {};

      if (prefix !== undefined && prefix !== '') {
        params.prefix = prefix;
      }
      if (delimiter !== undefined) {
        params.delimiter = delimiter;
      }
      if (maxKeys !== undefined) {
        params.maxKeys = maxKeys;
      }
      if (continuationToken !== undefined) {
        params.continuationToken = continuationToken;
      }

      // API returns: { status: 'ok', data: R2Object[], pagination: {...} }
      interface ListObjectsAPIResponse {
        status: 'ok' | 'error';
        data: R2Object[];
        pagination: {
          isTruncated: boolean;
          maxKeys: number;
          keyCount: number;
          delimiter?: string;
          commonPrefixes?: string[];
          continuationToken?: string;
          prefix?: string;
          nextContinuationToken?: string;
        };
        meta?: {
          timestamp: string;
          requestId: string;
        };
      }

      const response: AxiosResponse<ListObjectsAPIResponse> = await this.axiosInstance.get(
        `/buckets/${encodeURIComponent(bucket)}/objects`,
        { params }
      );

      if (response.data.status === 'ok') {
        // Transform API response to ObjectsResponse format
        return {
          objects: response.data.data || [],
          folders: response.data.pagination?.commonPrefixes || [],
          pagination: response.data.pagination,
        };
      }

      throw R2Error.invalidResponse();
    } catch (error) {
      if (error instanceof R2Error) {
        throw error;
      }
      throw R2Error.networkError(String(error));
    }
  }

  /**
   * Download object data
   * GET /buckets/:bucket/objects/:key
   * Returns raw data and response for headers
   */
  public async downloadObject(
    bucket: string,
    key: string,
    onProgress?: DownloadProgressCallback
  ): Promise<{ data: Blob; response: AxiosResponse }> {
    try {
      const config: AxiosRequestConfig = {
        responseType: 'blob',
        timeout: 300000, // 5 minutes for large downloads
      };

      if (onProgress) {
        config.onDownloadProgress = (progressEvent) => {
          const total = progressEvent.total ?? 0;
          const loaded = progressEvent.loaded;
          onProgress(loaded, total);
        };
      }

      const response: AxiosResponse<Blob> = await this.axiosInstance.get(
        `/buckets/${encodeURIComponent(bucket)}/objects/${encodeURIComponent(key)}`,
        config
      );

      return {
        data: response.data,
        response,
      };
    } catch (error) {
      if (error instanceof R2Error) {
        throw error;
      }
      throw R2Error.networkError(String(error));
    }
  }

  /**
   * Upload object data
   * PUT /buckets/:bucket/objects/:key
   */
  public async uploadObject(
    bucket: string,
    key: string,
    data: File | Blob | Buffer | ArrayBuffer,
    onProgress?: ProgressCallback
  ): Promise<ObjectUploadResponse> {
    try {
      const formData = new FormData();

      // Convert data to appropriate format
      if (data instanceof File) {
        formData.append('file', data);
      } else if (data instanceof Blob) {
        formData.append('file', data);
      } else if (Buffer.isBuffer(data)) {
        formData.append('file', new Blob([data]));
      } else if (data instanceof ArrayBuffer) {
        formData.append('file', new Blob([data]));
      } else {
        throw R2Error.configurationError('Unsupported data type for upload');
      }

      const config: AxiosRequestConfig = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes for large uploads
      };

      if (onProgress) {
        config.onUploadProgress = (progressEvent) => {
          const total = progressEvent.total ?? 0;
          const loaded = progressEvent.loaded;
          if (total > 0) {
            const percentage = (loaded / total) * 100;
            onProgress(percentage);
          }
        };
      }

      const response: AxiosResponse<APIResponse<ObjectUploadResponse>> =
        await this.axiosInstance.put(
          `/buckets/${encodeURIComponent(bucket)}/objects/${encodeURIComponent(key)}`,
          formData,
          config
        );

      if (response.data.status === 'ok' && response.data.data) {
        return response.data.data;
      }

      throw R2Error.invalidResponse();
    } catch (error) {
      if (error instanceof R2Error) {
        throw error;
      }
      throw R2Error.networkError(String(error));
    }
  }

  /**
   * Delete single object
   * DELETE /buckets/:bucket/objects/:key
   */
  public async deleteObject(bucket: string, key: string): Promise<ObjectDeleteResponse> {
    try {
      const response: AxiosResponse<APIResponse<ObjectDeleteResponse>> =
        await this.axiosInstance.delete(
          `/buckets/${encodeURIComponent(bucket)}/objects/${encodeURIComponent(key)}`
        );

      if (response.data.status === 'ok' && response.data.data) {
        return response.data.data;
      }

      throw R2Error.invalidResponse();
    } catch (error) {
      if (error instanceof R2Error) {
        throw error;
      }
      throw R2Error.networkError(String(error));
    }
  }

  /**
   * Delete multiple objects in batches (max 1000 per batch)
   * DELETE /buckets/:bucket/objects/batch
   */
  public async deleteBatch(
    bucket: string,
    keys: string[],
    onProgress?: BatchDeleteProgressCallback
  ): Promise<void> {
    try {
      const batchSize = 1000; // R2 batch delete limit
      const batches: string[][] = [];

      // Split keys into batches
      for (let i = 0; i < keys.length; i += batchSize) {
        batches.push(keys.slice(i, i + batchSize));
      }

      let deletedCount = 0;

      // Process batches sequentially
      for (const batch of batches) {
        const response: AxiosResponse<APIResponse<{ deletedCount: number }>> =
          await this.axiosInstance.delete(
            `/buckets/${encodeURIComponent(bucket)}/objects/batch`,
            {
              data: { keys: batch },
            }
          );

        if (response.data.status === 'ok') {
          deletedCount += batch.length;
          if (onProgress) {
            onProgress(deletedCount, keys.length);
          }
        } else {
          throw R2Error.invalidResponse();
        }
      }
    } catch (error) {
      if (error instanceof R2Error) {
        throw error;
      }
      throw R2Error.networkError(String(error));
    }
  }

  /**
   * Search objects by name/query
   * GET /buckets/:bucket/search
   */
  public async searchObjects(bucket: string, query: string): Promise<R2Object[]> {
    try {
      const response: AxiosResponse<APIResponse<R2Object[]>> = await this.axiosInstance.get(
        `/buckets/${encodeURIComponent(bucket)}/search`,
        {
          params: { query },
        }
      );

      if (response.data.status === 'ok' && response.data.data) {
        return response.data.data;
      }

      throw R2Error.invalidResponse();
    } catch (error) {
      if (error instanceof R2Error) {
        throw error;
      }
      throw R2Error.networkError(String(error));
    }
  }

  /**
   * Health check endpoint
   * GET /health
   */
  public async healthCheck(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.get('/health', {
        timeout: 5000,
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const apiClient = APIClient.getInstance();

// Export individual functions for convenience
export const {
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
} = {
  setBaseURL: (port: number) => apiClient.setBaseURL(port),
  getBaseURL: () => apiClient.getBaseURL(),
  listBuckets: () => apiClient.listBuckets(),
  listObjects: (
    bucket: string,
    prefix?: string,
    delimiter?: string,
    maxKeys?: number,
    continuationToken?: string
  ) => apiClient.listObjects(bucket, prefix, delimiter, maxKeys, continuationToken),
  downloadObject: (bucket: string, key: string, onProgress?: DownloadProgressCallback) =>
    apiClient.downloadObject(bucket, key, onProgress),
  uploadObject: (
    bucket: string,
    key: string,
    data: File | Blob | Buffer | ArrayBuffer,
    onProgress?: ProgressCallback
  ) => apiClient.uploadObject(bucket, key, data, onProgress),
  deleteObject: (bucket: string, key: string) => apiClient.deleteObject(bucket, key),
  deleteBatch: (bucket: string, keys: string[], onProgress?: BatchDeleteProgressCallback) =>
    apiClient.deleteBatch(bucket, keys, onProgress),
  searchObjects: (bucket: string, query: string) => apiClient.searchObjects(bucket, query),
  healthCheck: () => apiClient.healthCheck(),
};
