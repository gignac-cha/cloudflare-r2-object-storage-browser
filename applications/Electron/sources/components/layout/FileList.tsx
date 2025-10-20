import React, { useEffect, useState } from 'react';
import { listObjects } from '../../services/apiClient';
import type { ObjectsResponse } from '../../types';
import { FileList as FileListComponent } from '../files/FileList';
import type { FileListItem } from '../../types/file';

interface FileListProps {
  selectedBucket: string | null;
  currentPath: string;
  onPathChange: (path: string) => void;
  serverStatus: {
    isRunning: boolean;
    port: number | null;
  };
}

const FileList: React.FC<FileListProps> = ({
  selectedBucket,
  currentPath,
  onPathChange,
  serverStatus,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<FileListItem[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  // Fetch objects when bucket or path changes
  useEffect(() => {
    if (!selectedBucket || !serverStatus.isRunning) {
      setItems([]);
      return;
    }

    const fetchObjects = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await listObjects(
          selectedBucket,
          currentPath || undefined,
          '/' // delimiter for folder navigation
        );

        console.log('[FileList] API response:', response);

        // Validate response structure
        if (!response) {
          throw new Error('No response from API');
        }

        // apiClient now returns ObjectsResponse with objects[] and folders[]
        const objects = response.objects || [];
        const folders = response.folders || [];

        console.log('[FileList] Folders:', folders);
        console.log('[FileList] Objects:', objects);

        // Transform API response to FileListItem format
        const fileItems: FileListItem[] = [
          // Folders first
          ...folders.map((folder): FileListItem => {
            const folderName = folder.split('/').filter(Boolean).pop() || folder;
            return {
              id: folder,
              key: folder,
              name: folderName,
              isFolder: true,
              size: 0,
              lastModified: new Date().toISOString(),
              etag: '',
              storageClass: 'STANDARD',
              fileExtension: undefined,
              fileType: 'folder' as any,
            };
          }),
          // Then files
          ...objects.map((obj): FileListItem => {
            const fileName = obj.key.split('/').pop() || obj.key;
            const extension = fileName.includes('.')
              ? fileName.split('.').pop()?.toLowerCase()
              : undefined;

            // Determine file type from extension
            let fileType: any = 'unknown';
            if (extension) {
              const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
              const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
              const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'm4a'];
              const docExts = ['pdf', 'doc', 'docx', 'txt', 'md'];
              const archiveExts = ['zip', 'tar', 'gz', 'rar', '7z'];
              const codeExts = ['js', 'ts', 'py', 'java', 'cpp', 'c', 'h', 'swift'];

              if (imageExts.includes(extension)) fileType = 'image';
              else if (videoExts.includes(extension)) fileType = 'video';
              else if (audioExts.includes(extension)) fileType = 'audio';
              else if (docExts.includes(extension)) fileType = 'document';
              else if (archiveExts.includes(extension)) fileType = 'archive';
              else if (codeExts.includes(extension)) fileType = 'code';
            }

            return {
              id: obj.key,
              key: obj.key,
              name: fileName,
              isFolder: false,
              size: obj.size,
              lastModified: obj.lastModified,
              etag: obj.etag || '',
              storageClass: obj.storageClass || 'STANDARD',
              fileExtension: extension,
              fileType,
            };
          }),
        ];

        console.log('[FileList] Transformed items:', fileItems);
        setItems(fileItems);
      } catch (err) {
        console.error('[FileList] Failed to load objects:', err);
        setError(err instanceof Error ? err.message : 'Failed to load files');
      } finally {
        setIsLoading(false);
      }
    };

    fetchObjects();
  }, [selectedBucket, currentPath, serverStatus.isRunning]);

  // Handle item open (folder navigation or file preview)
  const handleItemOpen = (item: FileListItem) => {
    if (item.isFolder) {
      // Navigate into folder
      onPathChange(item.key);
    } else {
      // TODO: Open file preview
      console.log('[FileList] Open file:', item.key);
    }
  };

  // If no bucket selected, show placeholder
  if (!selectedBucket) {
    return (
      <div className="flex items-center justify-center h-full bg-white dark:bg-gray-900">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <svg
            className="mx-auto w-16 h-16 mb-4 opacity-30"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
          <p className="text-lg font-medium mb-1">No Bucket Selected</p>
          <p className="text-sm">Select a bucket from the sidebar to view files</p>
        </div>
      </div>
    );
  }

  // Handle refresh
  const handleRefresh = () => {
    // Trigger re-fetch by clearing and setting bucket again
    setItems([]);
    // The useEffect will automatically refetch
  };

  // Handle back navigation
  const handleBack = () => {
    if (currentPath) {
      // Go up one level
      const pathParts = currentPath.split('/').filter(Boolean);
      pathParts.pop();
      onPathChange(pathParts.join('/') + (pathParts.length > 0 ? '/' : ''));
    }
  };

  // Render file list component with toolbar and breadcrumb
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="flex items-center space-x-2">
          {/* Navigation buttons */}
          <button
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!currentPath}
            onClick={handleBack}
            title="Back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {/* Action buttons */}
          <button
            className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            onClick={handleRefresh}
            title="Refresh"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50">
        <div className="flex items-center space-x-2 text-sm">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <button
            onClick={() => onPathChange('')}
            className="font-mono text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
          >
            {selectedBucket}
          </button>
          {currentPath && currentPath.split('/').filter(Boolean).map((part, index, arr) => {
            const fullPath = arr.slice(0, index + 1).join('/') + '/';
            return (
              <React.Fragment key={fullPath}>
                <span className="text-gray-400">/</span>
                <button
                  onClick={() => onPathChange(fullPath)}
                  className="font-mono text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  {part}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-hidden">
        <FileListComponent
          items={items}
          isLoading={isLoading}
          error={error}
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          onItemOpen={handleItemOpen}
          enableVirtualization={true}
        />
      </div>
    </div>
  );
};

export default FileList;
