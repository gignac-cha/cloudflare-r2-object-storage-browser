import { FileType } from '../types';
import { formatDistance, formatDistanceToNow } from 'date-fns';

// File extension to type mapping
const FILE_TYPE_MAP: Record<string, FileType> = {
  // Images
  jpg: FileType.IMAGE,
  jpeg: FileType.IMAGE,
  png: FileType.IMAGE,
  gif: FileType.IMAGE,
  bmp: FileType.IMAGE,
  svg: FileType.IMAGE,
  webp: FileType.IMAGE,
  ico: FileType.IMAGE,
  tiff: FileType.IMAGE,
  heic: FileType.IMAGE,

  // Videos
  mp4: FileType.VIDEO,
  mov: FileType.VIDEO,
  avi: FileType.VIDEO,
  mkv: FileType.VIDEO,
  webm: FileType.VIDEO,
  flv: FileType.VIDEO,
  wmv: FileType.VIDEO,
  m4v: FileType.VIDEO,

  // Audio
  mp3: FileType.AUDIO,
  wav: FileType.AUDIO,
  ogg: FileType.AUDIO,
  m4a: FileType.AUDIO,
  flac: FileType.AUDIO,
  aac: FileType.AUDIO,
  wma: FileType.AUDIO,

  // Documents
  pdf: FileType.DOCUMENT,
  doc: FileType.DOCUMENT,
  docx: FileType.DOCUMENT,
  xls: FileType.DOCUMENT,
  xlsx: FileType.DOCUMENT,
  ppt: FileType.DOCUMENT,
  pptx: FileType.DOCUMENT,
  txt: FileType.DOCUMENT,
  rtf: FileType.DOCUMENT,
  odt: FileType.DOCUMENT,
  ods: FileType.DOCUMENT,

  // Archives
  zip: FileType.ARCHIVE,
  rar: FileType.ARCHIVE,
  '7z': FileType.ARCHIVE,
  tar: FileType.ARCHIVE,
  gz: FileType.ARCHIVE,
  bz2: FileType.ARCHIVE,
  xz: FileType.ARCHIVE,

  // Code
  js: FileType.CODE,
  ts: FileType.CODE,
  jsx: FileType.CODE,
  tsx: FileType.CODE,
  py: FileType.CODE,
  java: FileType.CODE,
  c: FileType.CODE,
  cpp: FileType.CODE,
  h: FileType.CODE,
  hpp: FileType.CODE,
  cs: FileType.CODE,
  go: FileType.CODE,
  rs: FileType.CODE,
  swift: FileType.CODE,
  kt: FileType.CODE,
  php: FileType.CODE,
  rb: FileType.CODE,
  sh: FileType.CODE,
  bat: FileType.CODE,
  ps1: FileType.CODE,
  html: FileType.CODE,
  css: FileType.CODE,
  scss: FileType.CODE,
  sass: FileType.CODE,
  less: FileType.CODE,
  sql: FileType.CODE,
  xml: FileType.CODE,
  yaml: FileType.CODE,
  yml: FileType.CODE,
  toml: FileType.CODE,
  ini: FileType.CODE,
  conf: FileType.CODE,
  md: FileType.CODE,

  // Data
  json: FileType.DATA,
  csv: FileType.DATA,
  tsv: FileType.DATA,
  log: FileType.DATA,
};

export function getFileExtension(fileName: string): string | undefined {
  const match = fileName.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : undefined;
}

export function getFileType(extension: string): FileType {
  return FILE_TYPE_MAP[extension.toLowerCase()] || FileType.UNKNOWN;
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    return dateString;
  }
}

export function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond === 0) return '0 B/s';
  return `${formatBytes(bytesPerSecond)}/s`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}m ${secs}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}

export function getFileIconName(fileType: FileType): string {
  const iconMap: Record<FileType, string> = {
    [FileType.FOLDER]: 'folder',
    [FileType.IMAGE]: 'image',
    [FileType.VIDEO]: 'video',
    [FileType.AUDIO]: 'music',
    [FileType.DOCUMENT]: 'file-text',
    [FileType.ARCHIVE]: 'archive',
    [FileType.CODE]: 'code',
    [FileType.DATA]: 'database',
    [FileType.UNKNOWN]: 'file',
  };

  return iconMap[fileType] || 'file';
}

export function canPreview(fileType: FileType): boolean {
  return [
    FileType.IMAGE,
    FileType.VIDEO,
    FileType.AUDIO,
    FileType.DOCUMENT,
    FileType.CODE,
    FileType.DATA,
  ].includes(fileType);
}
