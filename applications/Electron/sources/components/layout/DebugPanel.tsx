import React, { useState } from 'react';

interface DebugPanelProps {
  serverLogs: string[];
}

const DebugPanel: React.FC<DebugPanelProps> = ({ serverLogs }) => {
  const [activeTab, setActiveTab] = useState<'api' | 'logs'>('api');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = serverLogs.filter((log) =>
    log.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Debug Panel</h3>
          <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab('api')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'api'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              API Response
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'logs'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Server Logs
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Search */}
          {activeTab === 'logs' && (
            <div className="relative">
              <input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Actions */}
          <button
            className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            title="Export logs"
          >
            Export
          </button>
          <button
            className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            title="Clear logs"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-900 font-mono text-xs">
        {activeTab === 'api' ? (
          <div className="text-gray-400">
            <p>No API requests yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredLogs.length === 0 ? (
              <p className="text-gray-500">
                {searchQuery ? 'No matching logs found' : 'No server logs yet'}
              </p>
            ) : (
              filteredLogs.map((log, index) => (
                <div key={index} className="text-gray-300 hover:bg-gray-800 px-2 py-0.5 rounded">
                  <span className="text-gray-600 mr-2">{index + 1}</span>
                  {log}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugPanel;
