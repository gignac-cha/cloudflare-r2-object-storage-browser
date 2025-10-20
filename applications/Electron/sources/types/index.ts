// Bucket types
export interface Bucket {
  name: string;
  creationDate?: string;
}

// R2Object types
export interface R2Object {
  key: string;
  size: number;
  lastModified: string;
  etag?: string;
  storageClass?: string;
}

// File type categories
export enum FileType {
  Folder = 'folder',
  Image = 'image',
  Video = 'video',
  Audio = 'audio',
  Document = 'document',
  Archive = 'archive',
  Code = 'code',
  Data = 'data',
  Unknown = 'unknown'
}

// Transfer types
export enum TransferType {
  Upload = 'upload',
  Download = 'download',
  Delete = 'delete'
}

export enum TransferStatus {
  Queued = 'queued',
  Uploading = 'uploading',
  Downloading = 'downloading',
  Deleting = 'deleting',
  Paused = 'paused',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled'
}

export interface TransferTask {
  id: string;
  type: TransferType;
  fileName: string;
  localPath?: string;
  remotePath: string;
  bucketName: string;
  totalSize: number;
  transferredSize: number;
  status: TransferStatus;
  speed: number;
  progress: number;          // 0-1 decimal representing transfer progress (0 = 0%, 1 = 100%)
  progressPercentage: number; // 0-100 percentage representation
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

// API Response types
export interface APIResponse<T = unknown> {
  status: 'ok' | 'error';
  data?: T;
  error?: string;
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

export interface BucketsResponse {
  buckets: Bucket[];
  count: number;
}

export interface ObjectsResponse {
  objects: R2Object[];
  folders: string[];
  pagination: {
    isTruncated: boolean;
    maxKeys: number;
    keyCount: number;
    delimiter?: string;
    commonPrefixes?: string[];
    continuationToken?: string;
    prefix?: string;
  };
}

// Loading state
export enum LoadingState {
  Idle = 'idle',
  Loading = 'loading',
  Success = 'success',
  Error = 'error'
}

// Credentials
export interface Credentials {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
  lastUpdated?: string;
}

// Navigation
export interface NavigationItem {
  path: string;
  bucketName: string;
  timestamp: Date;
}

// Debug
export interface APILog {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  status: number;
  responseBody: unknown;
  timestamp: Date;
}

// Extended R2Object
export interface R2ObjectExtended extends R2Object {
  name: string;
  isFolder: boolean;
  fileExtension?: string;
  fileType: FileType;
  humanReadableSize: string;
  formattedLastModified?: string;
  relativeLastModified?: string;
  isCached?: boolean;
}
