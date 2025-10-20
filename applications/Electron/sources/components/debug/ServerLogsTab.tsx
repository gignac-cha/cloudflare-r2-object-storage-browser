import React, { useEffect, useRef } from 'react';
import { useDebugStore } from '../../../../../src/stores/useDebugStore';
import { Search, Trash2, Download, ChevronsDown, ChevronsUp } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

/**
 * Log Level Badge Component
 *
 * Displays log level with appropriate color
 */
const LogLevelBadge: React.FC<{ level: string }> = ({ level }) => {
  const colors = {
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    warn: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    error: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    debug: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  };

  return (
    <span
      className={clsx(
        'px-2 py-0.5 text-xs font-semibold rounded uppercase',
        colors[level as keyof typeof colors] || colors.debug
      )}
    >
      {level}
    </span>
  );
};

/**
 * Server Log Entry Component
 *
 * Displays a single server log entry
 */
const ServerLogEntry: React.FC<{
  log: ReturnType<typeof useDebugStore>['serverLogs'][0];
  lineNumber: number;
}> = ({ log, lineNumber }) => {
  return (
    <div
      className={clsx(
        'flex items-start gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-750 font-mono text-xs',
        'border-b border-gray-100 dark:border-gray-800 last:border-b-0'
      )}
    >
      {/* Line number */}
      <span className="text-gray-400 dark:text-gray-600 select-none w-12 text-right flex-shrink-0">
        {lineNumber}
      </span>

      {/* Timestamp */}
      <span className="text-gray-500 dark:text-gray-500 flex-shrink-0">
        {format(log.timestamp, 'HH:mm:ss.SSS')}
      </span>

      {/* Level badge */}
      <div className="flex-shrink-0">
        <LogLevelBadge level={log.level} />
      </div>

      {/* Source */}
      {log.source && (
        <span className="text-purple-600 dark:text-purple-400 flex-shrink-0">[{log.source}]</span>
      )}

      {/* Message */}
      <span
        className={clsx(
          'flex-1 break-all',
          log.level === 'error'
            ? 'text-red-700 dark:text-red-300'
            : log.level === 'warn'
            ? 'text-yellow-700 dark:text-yellow-300'
            : 'text-gray-800 dark:text-gray-200'
        )}
      >
        {log.message}
      </span>
    </div>
  );
};

/**
 * ServerLogsTab Component
 *
 * Displays server logs with:
 * - Search/filter functionality
 * - Log level filtering
 * - Auto-scroll toggle
 * - Line numbers
 * - Monospace font
 * - Clear and Export buttons
 *
 * @example
 * ```tsx
 * <ServerLogsTab />
 * ```
 */
export const ServerLogsTab: React.FC = () => {
  const {
    getFilteredServerLogs,
    logsSearchQuery,
    setLogsSearchQuery,
    logsLevelFilter,
    setLogsLevelFilter,
    clearServerLogs,
    exportServerLogs,
    autoScrollLogs,
    setAutoScrollLogs,
  } = useDebugStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const logs = getFilteredServerLogs();

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScrollLogs && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScrollLogs]);

  /**
   * Export logs to file
   */
  const handleExport = async () => {
    try {
      const content = exportServerLogs();
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `server-logs-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  const levelOptions: Array<{ value: typeof logsLevelFilter; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'info', label: 'Info' },
    { value: 'warn', label: 'Warn' },
    { value: 'error', label: 'Error' },
    { value: 'debug', label: 'Debug' },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={logsSearchQuery}
            onChange={(e) => setLogsSearchQuery(e.target.value)}
            placeholder="Search server logs..."
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
        </div>

        {/* Level filter */}
        <select
          value={logsLevelFilter}
          onChange={(e) =>
            setLogsLevelFilter(e.target.value as typeof logsLevelFilter)
          }
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        >
          {levelOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Auto-scroll toggle */}
        <button
          onClick={() => setAutoScrollLogs(!autoScrollLogs)}
          className={clsx(
            'p-1.5 rounded transition-colors',
            autoScrollLogs
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
          )}
          aria-label={autoScrollLogs ? 'Disable auto-scroll' : 'Enable auto-scroll'}
          title={autoScrollLogs ? 'Auto-scroll enabled' : 'Auto-scroll disabled'}
        >
          {autoScrollLogs ? (
            <ChevronsDown className="w-4 h-4" />
          ) : (
            <ChevronsUp className="w-4 h-4" />
          )}
        </button>

        {/* Export */}
        <button
          onClick={handleExport}
          disabled={logs.length === 0}
          className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Export logs"
          title="Export logs"
        >
          <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Clear */}
        <button
          onClick={clearServerLogs}
          disabled={logs.length === 0}
          className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Clear logs"
          title="Clear logs"
        >
          <Trash2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Logs list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-white dark:bg-gray-800">
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <div className="text-sm">No server logs</div>
              <div className="text-xs mt-1">
                {logsLevelFilter !== 'all' || logsSearchQuery
                  ? 'No logs match the current filter'
                  : 'Server logs will appear here'}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-1">
            {logs.map((log, index) => (
              <ServerLogEntry key={log.id} log={log} lineNumber={index + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
