/**
 * ContextMenu Component
 * Right-click context menu for files and folders
 *
 * Features:
 * - Different menus for files, folders, and multi-selection
 * - Keyboard shortcuts display
 * - Icon support
 * - Destructive action styling
 * - Separators
 * - Disabled state
 *
 * Context Menu Types:
 * - File: Quick Look, Download, Save As, Open in Browser, Copy Path, Copy URL, Get Info, Delete
 * - Folder: Open, Delete Folder and Contents
 * - Multi-select: Download Selected, Delete Selected
 */

import React, { useEffect, useRef, useCallback } from 'react';
import * as LucideIcons from 'lucide-react';
import { FileListItem, ContextMenuItem, FileContextAction } from '../../types/file';

export interface ContextMenuProps {
  /** Mouse position for menu placement */
  position: { x: number; y: number };

  /** Selected items */
  items: FileListItem[];

  /** Whether any selected item is cached */
  hasCachedItems: boolean;

  /** Close menu handler */
  onClose: () => void;

  /** Action handler */
  onAction: (action: FileContextAction, items: FileListItem[]) => void;
}

/**
 * Get Lucide icon component by name
 */
const getIconComponent = (iconName: string): React.ComponentType<LucideIcons.LucideProps> => {
  const pascalName = iconName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  return (LucideIcons as any)[pascalName] || LucideIcons.FileIcon;
};

/**
 * Build context menu items based on selection
 */
const buildMenuItems = (
  items: FileListItem[],
  hasCachedItems: boolean
): ContextMenuItem[] => {
  // No items selected
  if (items.length === 0) {
    return [];
  }

  // Multi-selection
  if (items.length > 1) {
    return [
      {
        action: 'download-selected',
        label: `Download ${items.length} Items`,
        icon: 'download',
        shortcut: '⌘D',
      },
      {
        action: 'delete-selected',
        label: `Delete ${items.length} Items`,
        icon: 'trash-2',
        destructive: true,
        shortcut: '⌘⌫',
      },
    ];
  }

  // Single item
  const item = items[0];

  // Folder menu
  if (item.isFolder) {
    return [
      {
        action: 'open',
        label: 'Open',
        icon: 'folder-open',
        shortcut: '⏎',
      },
      {
        action: 'delete-folder',
        label: 'Delete Folder and Contents',
        icon: 'trash-2',
        destructive: true,
        shortcut: '⌘⌫',
      },
    ];
  }

  // File menu
  return [
    {
      action: 'quick-look',
      label: 'Quick Look',
      icon: 'eye',
      shortcut: 'Space',
    },
    {
      action: 'download',
      label: 'Download',
      icon: 'download',
      shortcut: '⌘D',
      separator: true,
    },
    {
      action: 'save-as',
      label: 'Save As...',
      icon: 'save',
      disabled: !hasCachedItems,
      separator: true,
    },
    {
      action: 'open-browser',
      label: 'Open in Browser',
      icon: 'external-link',
    },
    {
      action: 'copy-path',
      label: 'Copy Path',
      icon: 'clipboard',
      shortcut: '⌘C',
    },
    {
      action: 'copy-url',
      label: 'Copy URL',
      icon: 'link',
      separator: true,
    },
    {
      action: 'get-info',
      label: 'Get Info',
      icon: 'info',
      shortcut: '⌘I',
      separator: true,
    },
    {
      action: 'delete',
      label: 'Delete',
      icon: 'trash-2',
      destructive: true,
      shortcut: '⌘⌫',
    },
  ];
};

export const ContextMenu: React.FC<ContextMenuProps> = ({
  position,
  items,
  hasCachedItems,
  onClose,
  onAction,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  const menuItems = buildMenuItems(items, hasCachedItems);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Add small delay to prevent immediate closure
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust menu position if it goes off screen
  useEffect(() => {
    if (menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let { x, y } = position;

      // Adjust horizontal position
      if (rect.right > viewportWidth) {
        x = viewportWidth - rect.width - 10;
      }

      // Adjust vertical position
      if (rect.bottom > viewportHeight) {
        y = viewportHeight - rect.height - 10;
      }

      menu.style.left = `${x}px`;
      menu.style.top = `${y}px`;
    }
  }, [position]);

  const handleItemClick = useCallback(
    (action: FileContextAction, disabled?: boolean) => {
      if (disabled) return;
      onAction(action, items);
      onClose();
    },
    [items, onAction, onClose]
  );

  if (menuItems.length === 0) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className="
        fixed z-50 min-w-[200px] max-w-[280px]
        bg-white dark:bg-gray-800
        border border-gray-200 dark:border-gray-700
        rounded-lg shadow-xl
        py-1
        backdrop-blur-lg
      "
      style={{
        left: position.x,
        top: position.y,
      }}
      role="menu"
      aria-orientation="vertical"
    >
      {menuItems.map((item, index) => {
        const IconComponent = item.icon ? getIconComponent(item.icon) : null;

        return (
          <React.Fragment key={`${item.action}-${index}`}>
            <button
              className={`
                w-full px-3 py-2 flex items-center gap-3
                text-sm text-left
                transition-colors
                ${
                  item.disabled
                    ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : item.destructive
                    ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
              onClick={() => handleItemClick(item.action, item.disabled)}
              disabled={item.disabled}
              role="menuitem"
              aria-disabled={item.disabled}
            >
              {/* Icon */}
              {IconComponent && (
                <IconComponent
                  size={16}
                  className="flex-shrink-0"
                  aria-hidden="true"
                />
              )}

              {/* Label */}
              <span className="flex-1">{item.label}</span>

              {/* Keyboard Shortcut */}
              {item.shortcut && (
                <span
                  className="
                    text-xs font-mono
                    text-gray-400 dark:text-gray-500
                  "
                >
                  {item.shortcut}
                </span>
              )}
            </button>

            {/* Separator */}
            {item.separator && (
              <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ContextMenu;
