import React from 'react';
import { useUIStore } from '../../stores/uiStore';

interface HeaderProps {
  serverStatus: {
    isRunning: boolean;
    port: number | null;
  };
  onToggleTransferPanel: () => void;
  onToggleDebugPanel: () => void;
  isTransferPanelVisible: boolean;
  isDebugPanelVisible: boolean;
}

const Header: React.FC<HeaderProps> = ({
  serverStatus,
  onToggleTransferPanel,
  onToggleDebugPanel,
  isTransferPanelVisible,
  isDebugPanelVisible,
}) => {
  const { showSettings } = useUIStore();

  return (
    <header className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
      {/* App Title - with extra left padding for macOS traffic lights */}
      <div className="flex items-center space-x-3 pl-20 pr-4">
        <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            Cloudflare R2 Browser
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Object Storage Manager
          </p>
        </div>
      </div>

      {/* Center - Server Status */}
      <div className="flex items-center space-x-2">
        {serverStatus.isRunning ? (
          <>
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="relative">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
              </div>
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                Server Running
              </span>
              {serverStatus.port && (
                <span className="text-xs text-green-600 dark:text-green-400 font-mono">
                  :{serverStatus.port}
                </span>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full"></div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Server Stopped
            </span>
          </div>
        )}
      </div>

      {/* Right - Panel Toggles */}
      <div className="flex items-center space-x-2 pr-4">
        {/* Transfer Panel Toggle */}
        <button
          onClick={onToggleTransferPanel}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            isTransferPanelVisible
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          title="Toggle Transfer Queue"
        >
          <svg
            className="w-4 h-4"
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
        </button>

        {/* Debug Panel Toggle */}
        <button
          onClick={onToggleDebugPanel}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            isDebugPanelVisible
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          title="Toggle Debug Panel (Cmd+Shift+D)"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
        </button>

        {/* Settings Button */}
        <button
          onClick={showSettings}
          className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Settings (Cmd+,)"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;
