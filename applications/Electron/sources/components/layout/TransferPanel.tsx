import React, { useState } from 'react';

const TransferPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'failed'>('active');

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Transfer Queue
          </h3>
          <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'active'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'completed'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setActiveTab('failed')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'failed'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Failed
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            title="Clear completed"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Empty State */}
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <svg
              className="mx-auto w-12 h-12 mb-3 opacity-30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
            <p className="text-sm">
              {activeTab === 'active' && 'No active transfers'}
              {activeTab === 'completed' && 'No completed transfers'}
              {activeTab === 'failed' && 'No failed transfers'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferPanel;
