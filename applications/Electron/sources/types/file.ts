/**
 * File and object type definitions
 * Port from macOS SwiftUI application Models/R2Object.swift
 */

import { FileType } from '../tools/formatters';

/**
 * R2 Object representation
 * Matches the macOS R2Object model
 */
export interface R2Object {
  /** Full object key/path in the bucket */
  key: string;

  /** File size in bytes */
  size: number;

  /** Last modified timestamp (ISO 8601) */
  lastModified: string;

  /** ETag for object versioning */
  etag?: string;

  /** Storage class (STANDARD, etc.) */
  storageClass?: string;

  /** Whether this is a folder (computed from key ending with /) */
  isFolder: boolean;

  /** Display name (last segment of key) */
  name: string;

  /** File extension without dot */
  fileExtension?: string;

  /** Computed file type category */
  fileType: FileType;
}

/**
 * File list item with additional UI state
 * Enhanced version of R2Object for table display
 */
export interface FileListItem extends R2Object {
  /** Unique identifier for React keys */
  id: string;

  /** Whether the item is selected */
  isSelected?: boolean;

  /** Whether the file is cached locally */
  isCached?: boolean;

  /** Cache path if cached */
  cachePath?: string;
}

/**
 * Context menu action types
 */
export type FileContextAction =
  // Folder actions
  | 'open'
  | 'delete-folder'
  // File actions
  | 'quick-look'
  | 'download'
  | 'save-as'
  | 'open-browser'
  | 'copy-path'
  | 'copy-url'
  | 'get-info'
  | 'delete'
  // Multi-select actions
  | 'download-selected'
  | 'delete-selected';

/**
 * Context menu item definition
 */
export interface ContextMenuItem {
  /** Menu item action identifier */
  action: FileContextAction;

  /** Display label */
  label: string;

  /** Icon name (Lucide icon) */
  icon?: string;

  /** Keyboard shortcut label */
  shortcut?: string;

  /** Whether item is disabled */
  disabled?: boolean;

  /** Whether item is destructive (red text) */
  destructive?: boolean;

  /** Separator after this item */
  separator?: boolean;
}

/**
 * File list sort configuration
 */
export interface SortConfig {
  /** Column to sort by */
  column: 'name' | 'size' | 'lastModified' | 'type';

  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * File list selection state
 */
export interface SelectionState {
  /** Set of selected item keys */
  selectedKeys: Set<string>;

  /** Last selected item key (for shift-click range selection) */
  lastSelectedKey?: string;
}

/**
 * File operation result
 */
export interface FileOperationResult {
  /** Whether operation succeeded */
  success: boolean;

  /** Error message if failed */
  error?: string;

  /** Result data if succeeded */
  data?: unknown;
}

/**
 * Bucket list response
 */
export interface BucketListResponse {
  status: 'success' | 'error';
  data: {
    buckets: Bucket[];
    count: number;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

/**
 * Bucket definition
 */
export interface Bucket {
  /** Bucket name (unique identifier) */
  name: string;

  /** Creation date (ISO 8601) */
  creationDate?: string;
}

/**
 * Object list response from API
 */
export interface ObjectListResponse {
  status: 'success' | 'error';
  data: R2Object[];
  pagination: {
    isTruncated: boolean;
    maxKeys: number;
    keyCount: number;
    delimiter?: string;
    commonPrefixes?: string[];
    continuationToken?: string;
    prefix?: string;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

/**
 * File upload request
 */
export interface FileUploadRequest {
  /** Bucket name */
  bucket: string;

  /** Object key/path */
  key: string;

  /** Local file path */
  localPath: string;

  /** File size in bytes */
  size: number;
}

/**
 * File download request
 */
export interface FileDownloadRequest {
  /** Bucket name */
  bucket: string;

  /** Object key/path */
  key: string;

  /** Destination path (optional, defaults to cache) */
  destinationPath?: string;

  /** File size in bytes */
  size: number;
}

/**
 * File delete request
 */
export interface FileDeleteRequest {
  /** Bucket name */
  bucket: string;

  /** Object key/path */
  key: string;

  /** Whether this is a folder deletion */
  isFolder: boolean;
}

/**
 * Batch delete request
 */
export interface BatchDeleteRequest {
  /** Bucket name */
  bucket: string;

  /** Object keys to delete */
  keys: string[];

  /** Total items count for progress */
  totalCount?: number;
}
