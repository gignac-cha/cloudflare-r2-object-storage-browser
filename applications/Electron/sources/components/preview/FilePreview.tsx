/**
 * File Preview Component
 * Routes to appropriate preview component based on file type
 */

import { FileType } from '../../tools/formatters';
import { ImagePreview } from './ImagePreview';
import { PDFPreview } from './PDFPreview';
import { VideoPreview } from './VideoPreview';
import { AudioPreview } from './AudioPreview';
import { CodePreview } from './CodePreview';
import { FileQuestion, AlertCircle } from 'lucide-react';

interface FilePreviewProps {
  /** File source URL */
  src: string;
  /** File name */
  fileName: string;
  /** File type category */
  fileType: FileType;
  /** File content (for code/text files) */
  content?: string;
}

/**
 * Unsupported file type preview
 */
function UnsupportedPreview({ fileName, fileType }: { fileName: string; fileType: FileType }) {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-900 p-8">
      <div className="w-20 h-20 mb-6 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
        <FileQuestion className="w-10 h-10 text-gray-400 dark:text-gray-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Preview Not Available
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-4">
        Preview is not supported for this file type.
      </p>
      <div className="text-sm text-gray-500 dark:text-gray-500 space-y-1">
        <p>
          <span className="font-medium">File:</span> {fileName}
        </p>
        <p>
          <span className="font-medium">Type:</span> {fileType}
        </p>
      </div>
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 max-w-md">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <p className="font-medium mb-1">Download to view</p>
            <p className="text-blue-700 dark:text-blue-300">
              You can download this file to view it with an external application.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Document preview (for non-PDF documents)
 * Shows info and download prompt
 */
function DocumentPreview({ fileName, src }: { fileName: string; src: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-900 p-8">
      <div className="w-20 h-20 mb-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
        <svg
          className="w-10 h-10 text-orange-600 dark:text-orange-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Document File
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-4">
        {fileName}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-500 text-center max-w-md mb-6">
        This document type requires an external application to view. Download the file to open it.
      </p>
      <a
        href={src}
        download={fileName}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-md"
      >
        Download File
      </a>
    </div>
  );
}

/**
 * Archive preview
 * Shows info and download prompt
 */
function ArchivePreview({ fileName, src }: { fileName: string; src: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-900 p-8">
      <div className="w-20 h-20 mb-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
        <svg
          className="w-10 h-10 text-amber-600 dark:text-amber-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
          />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Archive File
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-4">
        {fileName}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-500 text-center max-w-md mb-6">
        This is a compressed archive file. Download to extract and view contents.
      </p>
      <a
        href={src}
        download={fileName}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-md"
      >
        Download Archive
      </a>
    </div>
  );
}

/**
 * Main File Preview Component
 * Routes to appropriate preview based on file type
 */
export function FilePreview({ src, fileName, fileType, content }: FilePreviewProps) {
  // Route to appropriate preview component
  switch (fileType) {
    case FileType.IMAGE:
      return <ImagePreview src={src} fileName={fileName} />;

    case FileType.VIDEO:
      return <VideoPreview src={src} fileName={fileName} />;

    case FileType.AUDIO:
      return <AudioPreview src={src} fileName={fileName} />;

    case FileType.CODE:
    case FileType.DATA:
      return <CodePreview src={src} fileName={fileName} content={content} />;

    case FileType.DOCUMENT:
      // Special handling for PDF
      if (fileName.toLowerCase().endsWith('.pdf')) {
        return <PDFPreview src={src} fileName={fileName} />;
      }
      // Other documents
      return <DocumentPreview fileName={fileName} src={src} />;

    case FileType.ARCHIVE:
      return <ArchivePreview fileName={fileName} src={src} />;

    case FileType.FOLDER:
      return <UnsupportedPreview fileName={fileName} fileType={fileType} />;

    case FileType.UNKNOWN:
    default:
      // Try to preview as code/text if it's a text-like extension
      const textExtensions = ['txt', 'log', 'cfg', 'config', 'ini', 'env'];
      const extension = fileName.split('.').pop()?.toLowerCase();
      if (extension && textExtensions.includes(extension)) {
        return <CodePreview src={src} fileName={fileName} content={content} />;
      }
      return <UnsupportedPreview fileName={fileName} fileType={fileType} />;
  }
}
