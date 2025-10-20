/**
 * File formatting utilities
 * Port from macOS SwiftUI application
 *
 * Features:
 * - File size formatting (bytes to KB/MB/GB/TB)
 * - Date formatting (relative time display)
 * - File type detection from extension
 * - File icon mapping based on type
 */

// File type categories matching the macOS app
export enum FileType {
  FOLDER = 'folder',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  ARCHIVE = 'archive',
  CODE = 'code',
  DATA = 'data',
  UNKNOWN = 'unknown',
}

// File extension mappings
const FILE_TYPE_EXTENSIONS: Record<FileType, string[]> = {
  [FileType.IMAGE]: [
    'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico', 'tiff', 'tif',
    'heic', 'heif', 'raw', 'cr2', 'nef', 'arw',
  ],
  [FileType.VIDEO]: [
    'mp4', 'mov', 'avi', 'mkv', 'wmv', 'flv', 'webm', 'm4v', 'mpg', 'mpeg',
    '3gp', 'ogv', 'ts', 'mts', 'm2ts',
  ],
  [FileType.AUDIO]: [
    'mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'wma', 'opus', 'oga', 'mid',
    'midi', 'aif', 'aiff', 'ape', 'alac',
  ],
  [FileType.DOCUMENT]: [
    'pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'xls', 'xlsx', 'ppt', 'pptx',
    'csv', 'pages', 'numbers', 'key', 'epub', 'mobi',
  ],
  [FileType.ARCHIVE]: [
    'zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'iso', 'dmg', 'pkg',
    'deb', 'rpm', 'tgz', 'tbz2', 'txz', 'cab',
  ],
  [FileType.CODE]: [
    'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'h', 'hpp', 'cs',
    'swift', 'go', 'rs', 'php', 'rb', 'pl', 'sh', 'bash', 'zsh', 'fish',
    'html', 'css', 'scss', 'sass', 'less', 'vue', 'svelte', 'json', 'xml',
    'yaml', 'yml', 'toml', 'ini', 'conf', 'config', 'sql', 'graphql', 'proto',
  ],
  [FileType.DATA]: [
    'json', 'xml', 'yaml', 'yml', 'toml', 'csv', 'tsv', 'sql', 'db', 'sqlite',
    'sqlite3', 'mdb', 'accdb', 'plist', 'dat', 'log',
  ],
  [FileType.FOLDER]: [],
  [FileType.UNKNOWN]: [],
};

/**
 * Format file size in human-readable format
 * Matches Swift's ByteCountFormatter behavior
 *
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB", "235 KB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const units = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const k = 1024;
  const decimals = 1;

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / Math.pow(k, i);

  // Format with 1 decimal place, except for bytes
  if (i === 0) {
    return `${bytes} ${units[i]}`;
  }

  return `${size.toFixed(decimals)} ${units[i]}`;
}

/**
 * Format date in relative time format
 * Matches Swift's RelativeDateTimeFormatter behavior
 *
 * @param dateString - ISO 8601 date string
 * @returns Relative time string (e.g., "2h ago", "3 days ago", "just now")
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 10) {
    return 'just now';
  } else if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  } else if (diffMinutes < 60) {
    return diffMinutes === 1 ? '1m ago' : `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return diffHours === 1 ? '1h ago' : `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  } else if (diffWeeks < 4) {
    return diffWeeks === 1 ? '1 week ago' : `${diffWeeks} weeks ago`;
  } else if (diffMonths < 12) {
    return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
  } else {
    return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
  }
}

/**
 * Format date as absolute date string for tooltips
 *
 * @param dateString - ISO 8601 date string
 * @returns Formatted date string (e.g., "Oct 15, 2025 at 2:30 PM")
 */
export function formatAbsoluteDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Get file type from file name or extension
 *
 * @param fileName - File name or path
 * @param isFolder - Whether the item is a folder
 * @returns FileType enum value
 */
export function getFileType(fileName: string, isFolder: boolean = false): FileType {
  if (isFolder) {
    return FileType.FOLDER;
  }

  const extension = getFileExtension(fileName);
  if (!extension) {
    return FileType.UNKNOWN;
  }

  // Check each file type mapping
  for (const [type, extensions] of Object.entries(FILE_TYPE_EXTENSIONS)) {
    if (extensions.includes(extension)) {
      return type as FileType;
    }
  }

  return FileType.UNKNOWN;
}

/**
 * Get file extension from file name
 *
 * @param fileName - File name or path
 * @returns Extension without dot, or empty string if none
 */
export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  const lastSlash = Math.max(
    fileName.lastIndexOf('/'),
    fileName.lastIndexOf('\\')
  );

  // No extension or dot is part of directory name
  if (lastDot === -1 || lastDot < lastSlash) {
    return '';
  }

  return fileName.substring(lastDot + 1).toLowerCase();
}

/**
 * Get file type display name
 *
 * @param fileType - FileType enum value
 * @returns Human-readable type name
 */
export function getFileTypeDisplayName(fileType: FileType): string {
  const displayNames: Record<FileType, string> = {
    [FileType.FOLDER]: 'Folder',
    [FileType.IMAGE]: 'Image',
    [FileType.VIDEO]: 'Video',
    [FileType.AUDIO]: 'Audio',
    [FileType.DOCUMENT]: 'Document',
    [FileType.ARCHIVE]: 'Archive',
    [FileType.CODE]: 'Code',
    [FileType.DATA]: 'Data',
    [FileType.UNKNOWN]: 'File',
  };

  return displayNames[fileType];
}

/**
 * Icon name mapping for file types
 * Maps to Lucide icon names (SF Symbols equivalent for web)
 *
 * Lucide Icons Reference:
 * - Folder: folder, folder-open
 * - Image: image, file-image
 * - Video: video, file-video
 * - Audio: music, file-audio
 * - Document: file-text, file-type
 * - Archive: archive, file-archive
 * - Code: code, file-code
 * - Data: database, file
 * - Unknown: file, file-question
 */
export interface FileIcon {
  name: string;
  color: string;
}

/**
 * Get icon configuration for file type
 * Returns icon name and color for consistent styling
 *
 * @param fileType - FileType enum value
 * @param isOpen - For folders, whether the folder is open/selected
 * @returns Icon configuration with name and color
 */
export function getFileIcon(fileType: FileType, isOpen: boolean = false): FileIcon {
  const icons: Record<FileType, FileIcon> = {
    [FileType.FOLDER]: {
      name: isOpen ? 'folder-open' : 'folder',
      color: '#60a5fa', // blue-400
    },
    [FileType.IMAGE]: {
      name: 'image',
      color: '#f472b6', // pink-400
    },
    [FileType.VIDEO]: {
      name: 'video',
      color: '#a78bfa', // violet-400
    },
    [FileType.AUDIO]: {
      name: 'music',
      color: '#34d399', // emerald-400
    },
    [FileType.DOCUMENT]: {
      name: 'file-text',
      color: '#fb923c', // orange-400
    },
    [FileType.ARCHIVE]: {
      name: 'archive',
      color: '#fbbf24', // amber-400
    },
    [FileType.CODE]: {
      name: 'code',
      color: '#22d3ee', // cyan-400
    },
    [FileType.DATA]: {
      name: 'database',
      color: '#818cf8', // indigo-400
    },
    [FileType.UNKNOWN]: {
      name: 'file',
      color: '#9ca3af', // gray-400
    },
  };

  return icons[fileType];
}

/**
 * Get file extension display for specific file types
 * Used for showing ".PDF", ".ZIP" etc. in the type column
 *
 * @param fileName - File name
 * @returns Extension with dot in uppercase, or empty string
 */
export function getFileExtensionDisplay(fileName: string): string {
  const ext = getFileExtension(fileName);
  return ext ? `.${ext.toUpperCase()}` : '';
}

/**
 * Format transfer speed
 *
 * @param bytesPerSecond - Transfer speed in bytes per second
 * @returns Formatted speed string (e.g., "1.5 MB/s")
 */
export function formatTransferSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond === 0) return '0 B/s';

  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const k = 1024;
  const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
  const speed = bytesPerSecond / Math.pow(k, i);

  return `${speed.toFixed(1)} ${units[i]}`;
}

/**
 * Format time duration
 *
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (e.g., "2m 30s", "1h 15m")
 */
export function formatDuration(seconds: number): string {
  if (seconds < 1) return 'less than a second';
  if (seconds < 60) return `${Math.floor(seconds)}s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (minutes < 60) {
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0
    ? `${hours}h ${remainingMinutes}m`
    : `${hours}h`;
}

/**
 * Truncate file name for display
 *
 * @param fileName - File name
 * @param maxLength - Maximum length before truncation
 * @returns Truncated file name with ellipsis if needed
 */
export function truncateFileName(fileName: string, maxLength: number = 50): string {
  if (fileName.length <= maxLength) {
    return fileName;
  }

  const extension = getFileExtension(fileName);
  const extWithDot = extension ? `.${extension}` : '';
  const nameWithoutExt = fileName.substring(0, fileName.length - extWithDot.length);

  const truncatedLength = maxLength - extWithDot.length - 3; // 3 for "..."

  if (truncatedLength <= 0) {
    return fileName.substring(0, maxLength - 3) + '...';
  }

  return nameWithoutExt.substring(0, truncatedLength) + '...' + extWithDot;
}

/**
 * Sort files and folders
 * Folders always come first, then files
 *
 * @param items - Array of items with name and isFolder properties
 * @param sortKey - Property to sort by ('name', 'size', 'lastModified', 'type')
 * @param sortOrder - 'asc' or 'desc'
 * @returns Sorted array
 */
export function sortFileList<T extends { name: string; isFolder: boolean }>(
  items: T[],
  sortKey: keyof T | 'type',
  sortOrder: 'asc' | 'desc' = 'asc'
): T[] {
  const multiplier = sortOrder === 'asc' ? 1 : -1;

  return [...items].sort((a, b) => {
    // Always sort folders before files
    if (a.isFolder !== b.isFolder) {
      return a.isFolder ? -1 : 1;
    }

    // Then sort by the specified key
    if (sortKey === 'type') {
      const aType = getFileType(a.name, a.isFolder);
      const bType = getFileType(b.name, b.isFolder);
      return aType.localeCompare(bType) * multiplier;
    }

    const aValue = a[sortKey];
    const bValue = b[sortKey];

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return aValue.localeCompare(bValue) * multiplier;
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return (aValue - bValue) * multiplier;
    }

    return 0;
  });
}
