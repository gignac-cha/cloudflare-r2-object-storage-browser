/**
 * FileList Component
 * Main file list table with TanStack Table
 *
 * Features:
 * - 5 columns: Checkbox, Icon, Name, Size, Modified, Type
 * - Multi-select with checkboxes and shift/cmd-click
 * - Sorting by any column (folders always first)
 * - Double-click to open folders/preview files
 * - Context menu (right-click)
 * - Loading and empty states
 * - Virtual scrolling for large lists
 * - Keyboard navigation
 *
 * Table Structure:
 * | ☐ | 📁 | Name              | Size    | Modified   | Type     |
 * |---|----|--------------------|---------|------------|----------|
 * | ☐ | 📁 | folder1            | —       | 2h ago     | Folder   |
 * | ☐ | 📄 | document.pdf       | 1.5 MB  | 1 day ago  | .PDF     |
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnDef,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import * as LucideIcons from 'lucide-react';

import { FileListItem, FileContextAction, SortConfig } from '../../types/file';
import { sortFileList } from '../../tools/formatters';
import FileRow from './FileRow';
import ContextMenu from './ContextMenu';

export interface FileListProps {
  /** File and folder items to display */
  items: FileListItem[];

  /** Whether the list is loading */
  isLoading?: boolean;

  /** Error message if loading failed */
  error?: string | null;

  /** Selected item keys */
  selectedKeys?: Set<string>;

  /** Selection change handler */
  onSelectionChange?: (keys: Set<string>) => void;

  /** Double-click handler (open folder or preview file) */
  onItemOpen?: (item: FileListItem) => void;

  /** Context menu action handler */
  onContextAction?: (action: FileContextAction, items: FileListItem[]) => void;

  /** Sort configuration change handler */
  onSortChange?: (sort: SortConfig) => void;

  /** Current sort configuration */
  sortConfig?: SortConfig;

  /** Enable virtual scrolling for large lists */
  enableVirtualization?: boolean;

  /** Virtual scroll container height in pixels */
  virtualScrollHeight?: number;
}

const columnHelper = createColumnHelper<FileListItem>();

export const FileList: React.FC<FileListProps> = ({
  items,
  isLoading = false,
  error = null,
  selectedKeys = new Set<string>(),
  onSelectionChange,
  onItemOpen,
  onContextAction,
  onSortChange,
  sortConfig,
  enableVirtualization = true,
  virtualScrollHeight = 600,
}) => {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<{
    position: { x: number; y: number };
    items: FileListItem[];
  } | null>(null);
  const [lastSelectedKey, setLastSelectedKey] = useState<string | null>(null);

  // Sort items (folders first, then by sort config)
  const sortedItems = useMemo(() => {
    if (!sortConfig) return items;
    return sortFileList(items, sortConfig.column, sortConfig.direction);
  }, [items, sortConfig]);

  // Check if any selected item is cached
  const hasCachedItems = useMemo(() => {
    return Array.from(selectedKeys).some((key) => {
      const item = items.find((i) => i.key === key);
      return item?.isCached;
    });
  }, [selectedKeys, items]);

  // Selection handlers
  const handleSelectionChange = useCallback(
    (key: string, selected: boolean) => {
      if (!onSelectionChange) return;

      const newSelection = new Set(selectedKeys);
      if (selected) {
        newSelection.add(key);
      } else {
        newSelection.delete(key);
      }
      onSelectionChange(newSelection);
      setLastSelectedKey(key);
    },
    [selectedKeys, onSelectionChange]
  );

  const handleSelectAll = useCallback(
    (selected: boolean) => {
      if (!onSelectionChange) return;

      if (selected) {
        onSelectionChange(new Set(items.map((item) => item.key)));
      } else {
        onSelectionChange(new Set());
      }
    },
    [items, onSelectionChange]
  );

  // Row click handler (with cmd/shift support)
  const handleRowClick = useCallback(
    (e: React.MouseEvent, item: FileListItem) => {
      if (!onSelectionChange) return;

      const newSelection = new Set(selectedKeys);

      if (e.metaKey || e.ctrlKey) {
        // Cmd/Ctrl-click: toggle selection
        if (newSelection.has(item.key)) {
          newSelection.delete(item.key);
        } else {
          newSelection.add(item.key);
        }
      } else if (e.shiftKey && lastSelectedKey) {
        // Shift-click: range selection
        const lastIndex = items.findIndex((i) => i.key === lastSelectedKey);
        const currentIndex = items.findIndex((i) => i.key === item.key);

        if (lastIndex !== -1 && currentIndex !== -1) {
          const start = Math.min(lastIndex, currentIndex);
          const end = Math.max(lastIndex, currentIndex);

          for (let i = start; i <= end; i++) {
            newSelection.add(items[i].key);
          }
        }
      } else {
        // Regular click: select only this item
        newSelection.clear();
        newSelection.add(item.key);
      }

      onSelectionChange(newSelection);
      setLastSelectedKey(item.key);
    },
    [selectedKeys, lastSelectedKey, items, onSelectionChange]
  );

  // Double-click handler
  const handleRowDoubleClick = useCallback(
    (item: FileListItem) => {
      onItemOpen?.(item);
    },
    [onItemOpen]
  );

  // Context menu handlers
  const handleContextMenu = useCallback(
    (e: React.MouseEvent, item: FileListItem) => {
      e.preventDefault();

      // If right-clicked item is not selected, select only it
      if (!selectedKeys.has(item.key)) {
        onSelectionChange?.(new Set([item.key]));
      }

      // Get all selected items
      const selectedItems = items.filter((i) => selectedKeys.has(i.key));

      setContextMenu({
        position: { x: e.clientX, y: e.clientY },
        items: selectedItems.length > 0 ? selectedItems : [item],
      });
    },
    [items, selectedKeys, onSelectionChange]
  );

  const handleContextAction = useCallback(
    (action: FileContextAction, items: FileListItem[]) => {
      onContextAction?.(action, items);
    },
    [onContextAction]
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape: clear selection
      if (e.key === 'Escape') {
        onSelectionChange?.(new Set());
        return;
      }

      // Cmd+A: select all
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault();
        handleSelectAll(true);
        return;
      }

      // Enter: open selected items
      if (e.key === 'Enter' && selectedKeys.size === 1) {
        const selectedItem = items.find((i) => selectedKeys.has(i.key));
        if (selectedItem) {
          onItemOpen?.(selectedItem);
        }
        return;
      }

      // Space: quick look (if single selection)
      if (e.key === ' ' && selectedKeys.size === 1 && !e.shiftKey) {
        e.preventDefault();
        const selectedItem = items.find((i) => selectedKeys.has(i.key));
        if (selectedItem && !selectedItem.isFolder) {
          onContextAction?.('quick-look', [selectedItem]);
        }
        return;
      }

      // Delete/Backspace: delete selected
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedKeys.size > 0) {
        if (e.metaKey || e.ctrlKey) {
          const selectedItems = items.filter((i) => selectedKeys.has(i.key));
          if (selectedItems.length === 1 && selectedItems[0].isFolder) {
            onContextAction?.('delete-folder', selectedItems);
          } else if (selectedItems.length > 1) {
            onContextAction?.('delete-selected', selectedItems);
          } else {
            onContextAction?.('delete', selectedItems);
          }
        }
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [items, selectedKeys, onSelectionChange, onItemOpen, onContextAction, handleSelectAll]);

  // Check if all items are selected
  const isAllSelected = items.length > 0 && selectedKeys.size === items.length;
  const isSomeSelected = selectedKeys.size > 0 && selectedKeys.size < items.length;

  // Virtual scrolling setup
  const rowVirtualizer = useVirtualizer({
    count: sortedItems.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 44, // Row height in pixels
    enabled: enableVirtualization && sortedItems.length > 50,
    overscan: 10,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalHeight = rowVirtualizer.getTotalSize();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-white dark:bg-gray-900">
        <div className="text-center">
          <LucideIcons.Loader2 className="w-8 h-8 mx-auto mb-3 text-blue-500 animate-spin" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading files...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-white dark:bg-gray-900">
        <div className="text-center max-w-md">
          <LucideIcons.AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Failed to Load Files
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-white dark:bg-gray-900">
        <div className="text-center">
          <LucideIcons.Inbox className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Files or Folders
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This location is empty
          </p>
        </div>
      </div>
    );
  }

  // Render table
  return (
    <div className="relative flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Table Container */}
      <div
        ref={tableContainerRef}
        className="flex-1 overflow-auto"
        style={{ height: enableVirtualization ? virtualScrollHeight : 'auto' }}
      >
        <table className="w-full border-collapse" role="grid">
          {/* Table Header */}
          <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr role="row">
              {/* Select All Checkbox */}
              <th className="w-12 px-3 py-3 text-center" role="columnheader">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isSomeSelected;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="
                    w-4 h-4 rounded border-gray-300 dark:border-gray-600
                    text-blue-600 focus:ring-2 focus:ring-blue-500
                    cursor-pointer
                  "
                  aria-label="Select all files"
                />
              </th>

              {/* Icon */}
              <th className="w-10 px-2 py-3" role="columnheader" />

              {/* Name */}
              <th
                className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => onSortChange?.({ column: 'name', direction: sortConfig?.column === 'name' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                role="columnheader"
                aria-sort={sortConfig?.column === 'name' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <div className="flex items-center gap-2">
                  Name
                  {sortConfig?.column === 'name' && (
                    sortConfig.direction === 'asc' ? (
                      <LucideIcons.ChevronUp className="w-4 h-4" />
                    ) : (
                      <LucideIcons.ChevronDown className="w-4 h-4" />
                    )
                  )}
                </div>
              </th>

              {/* Size */}
              <th
                className="px-3 py-3 w-24 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => onSortChange?.({ column: 'size', direction: sortConfig?.column === 'size' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                role="columnheader"
                aria-sort={sortConfig?.column === 'size' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <div className="flex items-center justify-end gap-2">
                  Size
                  {sortConfig?.column === 'size' && (
                    sortConfig.direction === 'asc' ? (
                      <LucideIcons.ChevronUp className="w-4 h-4" />
                    ) : (
                      <LucideIcons.ChevronDown className="w-4 h-4" />
                    )
                  )}
                </div>
              </th>

              {/* Modified */}
              <th
                className="px-3 py-3 w-36 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => onSortChange?.({ column: 'lastModified', direction: sortConfig?.column === 'lastModified' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                role="columnheader"
                aria-sort={sortConfig?.column === 'lastModified' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <div className="flex items-center gap-2">
                  Modified
                  {sortConfig?.column === 'lastModified' && (
                    sortConfig.direction === 'asc' ? (
                      <LucideIcons.ChevronUp className="w-4 h-4" />
                    ) : (
                      <LucideIcons.ChevronDown className="w-4 h-4" />
                    )
                  )}
                </div>
              </th>

              {/* Type */}
              <th
                className="px-3 py-3 w-32 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => onSortChange?.({ column: 'type', direction: sortConfig?.column === 'type' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                role="columnheader"
                aria-sort={sortConfig?.column === 'type' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <div className="flex items-center gap-2">
                  Type
                  {sortConfig?.column === 'type' && (
                    sortConfig.direction === 'asc' ? (
                      <LucideIcons.ChevronUp className="w-4 h-4" />
                    ) : (
                      <LucideIcons.ChevronDown className="w-4 h-4" />
                    )
                  )}
                </div>
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody role="rowgroup">
            {enableVirtualization && sortedItems.length > 50 ? (
              <>
                {/* Virtual scroll spacer */}
                {virtualItems.length > 0 && (
                  <tr style={{ height: `${virtualItems[0].start}px` }} />
                )}

                {/* Virtualized rows */}
                {virtualItems.map((virtualRow) => {
                  const item = sortedItems[virtualRow.index];
                  return (
                    <FileRow
                      key={item.key}
                      item={item}
                      isSelected={selectedKeys.has(item.key)}
                      onSelectionChange={handleSelectionChange}
                      onDoubleClick={handleRowDoubleClick}
                      onContextMenu={handleContextMenu}
                      onClick={handleRowClick}
                    />
                  );
                })}

                {/* Virtual scroll spacer */}
                {virtualItems.length > 0 && (
                  <tr style={{ height: `${totalHeight - virtualItems[virtualItems.length - 1].end}px` }} />
                )}
              </>
            ) : (
              // Non-virtualized rows
              sortedItems.map((item) => (
                <FileRow
                  key={item.key}
                  item={item}
                  isSelected={selectedKeys.has(item.key)}
                  onSelectionChange={handleSelectionChange}
                  onDoubleClick={handleRowDoubleClick}
                  onContextMenu={handleContextMenu}
                  onClick={handleRowClick}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Selection Counter */}
      {selectedKeys.size > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800">
          <span className="text-sm text-blue-700 dark:text-blue-300">
            {selectedKeys.size} {selectedKeys.size === 1 ? 'item' : 'items'} selected
          </span>
          <button
            onClick={() => onSelectionChange?.(new Set())}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium"
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          position={contextMenu.position}
          items={contextMenu.items}
          hasCachedItems={hasCachedItems}
          onClose={closeContextMenu}
          onAction={handleContextAction}
        />
      )}
    </div>
  );
};

export default FileList;
