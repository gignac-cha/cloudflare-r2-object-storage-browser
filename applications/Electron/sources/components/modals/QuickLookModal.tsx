/**
 * QuickLook Modal Component
 * Full-screen modal for file preview
 * Matches macOS QuickLook Panel functionality
 */

import { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { FilePreview } from '../preview/FilePreview';
import { FileType } from '../../tools/formatters';

interface QuickLookModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Function to close modal */
  onClose: () => void;
  /** File source URL */
  fileUrl: string;
  /** File name */
  fileName: string;
  /** File type category */
  fileType: FileType;
  /** File content (optional, for code/text files) */
  fileContent?: string;
}

export function QuickLookModal({
  isOpen,
  onClose,
  fileUrl,
  fileName,
  fileType,
  fileContent,
}: QuickLookModalProps) {
  // Handle ESC key press
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  // Add/remove ESC key listener
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full h-full max-w-7xl max-h-[95vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="quicklook-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex-1 min-w-0">
              <h2
                id="quicklook-title"
                className="text-lg font-semibold text-gray-900 dark:text-white truncate"
                title={fileName}
              >
                {fileName}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Quick Look Preview
              </p>
            </div>

            <button
              onClick={onClose}
              className="ml-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
              title="Close (ESC)"
              aria-label="Close preview"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Preview Content */}
          <div className="flex-1 overflow-hidden">
            <FilePreview
              src={fileUrl}
              fileName={fileName}
              fileType={fileType}
              content={fileContent}
            />
          </div>

          {/* Footer (Optional - for additional info or actions) */}
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
              <span>Press ESC to close</span>
              <span className="font-medium">{fileType.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Simplified QuickLook Hook
 * Provides state management for QuickLook modal
 */
export function useQuickLook() {
  const [state, setState] = React.useState<{
    isOpen: boolean;
    fileUrl: string;
    fileName: string;
    fileType: FileType;
    fileContent?: string;
  }>({
    isOpen: false,
    fileUrl: '',
    fileName: '',
    fileType: FileType.UNKNOWN,
    fileContent: undefined,
  });

  const openQuickLook = useCallback(
    (fileUrl: string, fileName: string, fileType: FileType, fileContent?: string) => {
      setState({
        isOpen: true,
        fileUrl,
        fileName,
        fileType,
        fileContent,
      });
    },
    []
  );

  const closeQuickLook = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  return {
    ...state,
    openQuickLook,
    closeQuickLook,
  };
}

// Export React for the hook
import * as React from 'react';
