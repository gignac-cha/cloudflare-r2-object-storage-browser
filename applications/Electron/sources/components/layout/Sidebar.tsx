import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/apiClient';
import type { Bucket } from '../../types';

interface SidebarProps {
  selectedBucket: string | null;
  onBucketSelect: (bucketName: string) => void;
  serverStatus: {
    isRunning: boolean;
    port: number | null;
  };
}

const Sidebar: React.FC<SidebarProps> = ({
  selectedBucket,
  onBucketSelect,
  serverStatus,
}) => {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load buckets when server becomes available
  useEffect(() => {
    const loadBuckets = async () => {
      if (!serverStatus.isRunning || !serverStatus.port) {
        setBuckets([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log('[Sidebar] Loading buckets from:', apiClient.getBaseURL());
        const fetchedBuckets = await apiClient.listBuckets();
        console.log('[Sidebar] Loaded buckets:', fetchedBuckets);
        setBuckets(fetchedBuckets);
      } catch (err) {
        console.error('[Sidebar] Failed to load buckets:', err);
        setError(err instanceof Error ? err.message : 'Failed to load buckets');
      } finally {
        setIsLoading(false);
      }
    };

    loadBuckets();
  }, [serverStatus.isRunning, serverStatus.port]);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Sidebar Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
          Buckets
        </h2>
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto">
        {!serverStatus.isRunning ? (
          <div className="text-center py-8 px-4 text-gray-500 dark:text-gray-400">
            <svg
              className="mx-auto w-12 h-12 mb-3 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <p className="text-sm">Start server to view buckets</p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-8 px-4 text-gray-500 dark:text-gray-400">
            <svg
              className="animate-spin mx-auto w-8 h-8 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-sm">Loading buckets...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 px-4">
            <svg
              className="mx-auto w-12 h-12 mb-3 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : buckets.length === 0 ? (
          <div className="text-center py-8 px-4 text-gray-500 dark:text-gray-400">
            <svg
              className="mx-auto w-12 h-12 mb-3 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <p className="text-sm">No buckets found</p>
          </div>
        ) : (
          <div className="p-2">
            {buckets.map((bucket) => (
              <button
                key={bucket.name}
                onClick={() => onBucketSelect(bucket.name)}
                className={`w-full text-left px-3 py-2 rounded-md mb-1 transition-colors ${
                  selectedBucket === bucket.name
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                  <span className="text-sm font-medium truncate">{bucket.name}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
