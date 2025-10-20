import React from 'react';
import { Tab } from '@headlessui/react';
import { useUIStore } from '../../../../../src/stores/useUIStore';
import { APIResponseTab } from './APIResponseTab';
import { ServerLogsTab } from './ServerLogsTab';
import { X } from 'lucide-react';
import clsx from 'clsx';

/**
 * DebugPanel Component
 *
 * Provides debugging information with two tabs:
 * - API Response: Shows API request/response logs
 * - Server Logs: Shows server logs with filtering
 *
 * Features:
 * - Tab navigation
 * - Collapsible panel
 * - Close button
 * - Integrated with UIStore for visibility
 *
 * @example
 * ```tsx
 * <DebugPanel />
 * ```
 */
export const DebugPanel: React.FC = () => {
  const { isDebugPanelVisible, setDebugPanelVisible, debugPanelActiveTab, setDebugPanelActiveTab } =
    useUIStore();

  // Don't render if not visible
  if (!isDebugPanelVisible) {
    return null;
  }

  const tabs = [
    { id: 'api' as const, label: 'API Response' },
    { id: 'logs' as const, label: 'Server Logs' },
  ];

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Debug Panel</h2>
        <button
          onClick={() => setDebugPanelVisible(false)}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Close debug panel"
        >
          <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Tabs */}
      <Tab.Group
        selectedIndex={tabs.findIndex((tab) => tab.id === debugPanelActiveTab)}
        onChange={(index) => setDebugPanelActiveTab(tabs[index].id)}
      >
        <Tab.List className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              className={({ selected }) =>
                clsx(
                  'px-4 py-2 text-sm font-medium focus:outline-none transition-colors',
                  selected
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-800'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                )
              }
            >
              {tab.label}
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels className="h-64 overflow-hidden">
          <Tab.Panel className="h-full">
            <APIResponseTab />
          </Tab.Panel>
          <Tab.Panel className="h-full">
            <ServerLogsTab />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};
