import React, { useEffect, useRef } from 'react';
import { useDebugStore } from '../../../../../src/stores/useDebugStore';
import { Search, Copy, Trash2, Download } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

/**
 * Method Badge Component
 *
 * Displays HTTP method with appropriate color
 */
const MethodBadge: React.FC<{ method: string }> = ({ method }) => {
  const colors = {
    GET: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    POST: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    PUT: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    DELETE: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    PATCH: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  };

  return (
    <span
      className={clsx(
        'px-2 py-0.5 text-xs font-semibold rounded uppercase',
        colors[method as keyof typeof colors] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
      )}
    >
      {method}
    </span>
  );
};

/**
 * API Log Entry Component
 *
 * Displays a single API request/response log
 */
const APILogEntry: React.FC<{
  log: ReturnType<typeof useDebugStore>['apiLogs'][0];
  onCopy: () => void;
}> = ({ log, onCopy }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <MethodBadge method={log.method} />
          <span className="font-mono text-sm text-gray-900 dark:text-gray-100 truncate">
            {log.endpoint}
          </span>
          {log.status && (
            <span
              className={clsx(
                'text-xs font-medium',
                log.status >= 200 && log.status < 300
                  ? 'text-green-600 dark:text-green-400'
                  : log.status >= 400
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-yellow-600 dark:text-yellow-400'
              )}
            >
              {log.status}
            </span>
          )}
          {log.duration !== undefined && (
            <span className="text-xs text-gray-500 dark:text-gray-400">{log.duration}ms</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {format(log.timestamp, 'HH:mm:ss')}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopy();
            }}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            aria-label="Copy to clipboard"
          >
            <Copy className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          {/* Request body */}
          {log.requestBody && (
            <div>
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Request Body:
              </div>
              <pre className="p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs overflow-x-auto">
                <code className="text-gray-800 dark:text-gray-200">
                  {JSON.stringify(log.requestBody, null, 2)}
                </code>
              </pre>
            </div>
          )}

          {/* Response body */}
          {log.responseBody && (
            <div>
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Response Body:
              </div>
              <pre className="p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs overflow-x-auto">
                <code className="text-gray-800 dark:text-gray-200">
                  {JSON.stringify(log.responseBody, null, 2)}
                </code>
              </pre>
            </div>
          )}

          {/* Error */}
          {log.error && (
            <div>
              <div className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">Error:</div>
              <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-800 dark:text-red-200">
                {log.error}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * APIResponseTab Component
 *
 * Displays API request/response logs with:
 * - Search functionality
 * - Method badges (GET, POST, PUT, DELETE)
 * - JSON syntax highlighting
 * - Timestamps
 * - Copy to clipboard
 * - Clear and Export buttons
 *
 * @example
 * ```tsx
 * <APIResponseTab />
 * ```
 */
export const APIResponseTab: React.FC = () => {
  const {
    getFilteredAPILogs,
    apiSearchQuery,
    setAPISearchQuery,
    clearAPILogs,
    exportAPILogs,
    autoScrollAPI,
  } = useDebugStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const logs = getFilteredAPILogs();

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScrollAPI && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScrollAPI]);

  /**
   * Copy log to clipboard
   */
  const handleCopyLog = async (log: typeof logs[0]) => {
    try {
      const text = JSON.stringify(
        {
          method: log.method,
          endpoint: log.endpoint,
          status: log.status,
          timestamp: log.timestamp,
          requestBody: log.requestBody,
          responseBody: log.responseBody,
          error: log.error,
          duration: log.duration,
        },
        null,
        2
      );
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  /**
   * Export logs to file
   */
  const handleExport = async () => {
    try {
      const content = exportAPILogs();
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `api-logs-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={apiSearchQuery}
            onChange={(e) => setAPISearchQuery(e.target.value)}
            placeholder="Search API logs..."
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
        </div>

        {/* Actions */}
        <button
          onClick={handleExport}
          disabled={logs.length === 0}
          className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Export logs"
          title="Export logs"
        >
          <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>

        <button
          onClick={clearAPILogs}
          disabled={logs.length === 0}
          className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Clear logs"
          title="Clear logs"
        >
          <Trash2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Logs list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <div className="text-sm">No API logs</div>
              <div className="text-xs mt-1">API requests and responses will appear here</div>
            </div>
          </div>
        ) : (
          <div>
            {logs.map((log) => (
              <APILogEntry key={log.id} log={log} onCopy={() => handleCopyLog(log)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
