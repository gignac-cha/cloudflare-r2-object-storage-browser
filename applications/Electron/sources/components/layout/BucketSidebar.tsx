import React from 'react';
import {
  Folder,
  RefreshCw,
  AlertCircle,
  Inbox,
  Calendar,
  Loader2,
} from 'lucide-react';
import { useBucketStore } from '../../stores/useBucketStore';
import { Bucket, LoadingState } from '../../types';

export const BucketSidebar: React.FC = () => {
  const {
    buckets,
    selectedBucket,
    loadingState,
    error,
    selectBucket,
    refreshBuckets,
  } = useBucketStore();

  const isLoading = loadingState === LoadingState.Loading;
  const isError = loadingState === LoadingState.Error;
  const isEmpty = buckets.length === 0 && loadingState === LoadingState.Success;

  const handleBucketClick = (bucket: Bucket) => {
    selectBucket(bucket);
  };

  const handleRefresh = () => {
    refreshBuckets();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInDays === 0) return 'Today';
      if (diffInDays === 1) return 'Yesterday';
      if (diffInDays < 7) return `${diffInDays}d ago`;
      if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
      if (diffInDays < 365) return `${Math.floor(diffInDays / 30)}mo ago`;
      return `${Math.floor(diffInDays / 365)}y ago`;
    } catch {
      return '';
    }
  };

  return (
    <div className="flex h-full flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Buckets
        </h2>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          aria-label="Refresh buckets"
          title="Refresh"
        >
          <RefreshCw
            className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="mb-3 h-8 w-8 animate-spin text-blue-500" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading buckets...
            </p>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center px-4 py-12">
            <AlertCircle className="mb-3 h-8 w-8 text-red-500" />
            <p className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              Failed to load buckets
            </p>
            <p className="mb-4 text-center text-xs text-gray-500 dark:text-gray-400">
              {error || 'An unknown error occurred'}
            </p>
            <button
              onClick={handleRefresh}
              className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Try Again
            </button>
          </div>
        )}

        {isEmpty && (
          <div className="flex flex-col items-center justify-center px-4 py-12">
            <Inbox className="mb-3 h-8 w-8 text-gray-400" />
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              No buckets found
            </p>
            <p className="mt-1 text-center text-xs text-gray-500 dark:text-gray-400">
              Create a bucket in the Cloudflare dashboard to get started
            </p>
          </div>
        )}

        {!isLoading && !isError && !isEmpty && (
          <div className="py-2">
            {buckets.map((bucket) => (
              <BucketRow
                key={bucket.name}
                bucket={bucket}
                isSelected={selectedBucket?.name === bucket.name}
                onClick={() => handleBucketClick(bucket)}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface BucketRowProps {
  bucket: Bucket;
  isSelected: boolean;
  onClick: () => void;
  formatDate: (dateString?: string) => string;
}

const BucketRow: React.FC<BucketRowProps> = ({
  bucket,
  isSelected,
  onClick,
  formatDate,
}) => {
  return (
    <button
      onClick={onClick}
      className={`group relative w-full px-4 py-2.5 text-left transition-colors ${
        isSelected
          ? 'bg-blue-50 dark:bg-blue-900/20'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
      role="option"
      aria-selected={isSelected}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute left-0 top-0 h-full w-1 bg-blue-500" />
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`mt-0.5 rounded-md p-1.5 transition-colors ${
            isSelected
              ? 'bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300'
              : 'bg-gray-200 text-gray-600 group-hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-400 dark:group-hover:bg-gray-600'
          }`}
        >
          <Folder className="h-4 w-4" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div
            className={`truncate text-sm font-medium ${
              isSelected
                ? 'text-blue-900 dark:text-blue-100'
                : 'text-gray-900 dark:text-gray-100'
            }`}
            title={bucket.name}
          >
            {bucket.name}
          </div>

          {bucket.creationDate && (
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(bucket.creationDate)}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
};
