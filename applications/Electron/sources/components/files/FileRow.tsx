/**
 * FileRow Component
 * Individual row in the file list table
 *
 * Features:
 * - File/folder icon with type-specific colors
 * - File name with cache indicator
 * - Hover effects
 * - Selection state
 * - Double-click handling
 */

import React from 'react';
import * as LucideIcons from 'lucide-react';
import { FileListItem } from '../../types/file';
import {
  formatFileSize,
  formatDate,
  formatAbsoluteDate,
  getFileIcon,
  getFileTypeDisplayName,
  getFileExtensionDisplay,
} from '../../tools/formatters';

export interface FileRowProps {
  /** File item data */
  item: FileListItem;

  /** Whether the row is selected */
  isSelected: boolean;

  /** Selection checkbox change handler */
  onSelectionChange: (key: string, selected: boolean) => void;

  /** Double-click handler for opening folders/files */
  onDoubleClick: (item: FileListItem) => void;

  /** Context menu handler */
  onContextMenu: (e: React.MouseEvent, item: FileListItem) => void;

  /** Single click handler for selection */
  onClick: (e: React.MouseEvent, item: FileListItem) => void;
}

/**
 * Get Lucide icon component by name
 */
const getIconComponent = (iconName: string): React.ComponentType<LucideIcons.LucideProps> => {
  // Convert kebab-case to PascalCase for Lucide icon names
  const pascalName = iconName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  return (LucideIcons as any)[pascalName] || LucideIcons.File;
};

export const FileRow: React.FC<FileRowProps> = ({
  item,
  isSelected,
  onSelectionChange,
  onDoubleClick,
  onContextMenu,
  onClick,
}) => {
  const icon = getFileIcon(item.fileType, false);
  const IconComponent = getIconComponent(icon.name);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelectionChange(item.key, e.target.checked);
  };

  const handleRowClick = (e: React.MouseEvent) => {
    onClick(e, item);
  };

  const handleRowDoubleClick = () => {
    onDoubleClick(item);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu(e, item);
  };

  // Format size (folders show "—")
  const sizeDisplay = item.isFolder ? '—' : formatFileSize(item.size);

  // Format modified date
  const relativeDate = formatDate(item.lastModified);
  const absoluteDate = formatAbsoluteDate(item.lastModified);

  // Get type display
  const typeDisplay = item.isFolder
    ? 'Folder'
    : getFileExtensionDisplay(item.name) || getFileTypeDisplayName(item.fileType);

  return (
    <tr
      className={`
        group cursor-pointer border-b border-gray-200 dark:border-gray-700
        transition-colors duration-150
        ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}
      `}
      onClick={handleRowClick}
      onDoubleClick={handleRowDoubleClick}
      onContextMenu={handleContextMenu}
      role="row"
      aria-selected={isSelected}
    >
      {/* Checkbox Column */}
      <td className="w-12 px-3 py-2 text-center" role="gridcell">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleCheckboxChange}
          onClick={(e) => e.stopPropagation()}
          className="
            w-4 h-4 rounded border-gray-300 dark:border-gray-600
            text-blue-600 focus:ring-2 focus:ring-blue-500
            cursor-pointer transition-colors
          "
          aria-label={`Select ${item.name}`}
        />
      </td>

      {/* Icon Column */}
      <td className="w-10 px-2 py-2" role="gridcell">
        <IconComponent
          size={20}
          style={{ color: icon.color }}
          className="flex-shrink-0"
          aria-hidden="true"
        />
      </td>

      {/* Name Column */}
      <td className="px-3 py-2 min-w-[200px]" role="gridcell">
        <div className="flex items-center gap-2">
          <span
            className="
              font-mono text-sm text-gray-900 dark:text-gray-100
              group-hover:text-blue-600 dark:group-hover:text-blue-400
              transition-colors truncate
            "
            title={item.name}
          >
            {item.name}
          </span>
          {item.isCached && (
            <span
              className="
                flex-shrink-0 px-1.5 py-0.5 text-xs font-medium
                bg-green-100 dark:bg-green-900/30
                text-green-700 dark:text-green-400
                rounded
              "
              title="File is cached locally"
            >
              cached
            </span>
          )}
        </div>
      </td>

      {/* Size Column */}
      <td
        className="px-3 py-2 w-24 text-right font-mono text-sm text-gray-700 dark:text-gray-300"
        role="gridcell"
      >
        {sizeDisplay}
      </td>

      {/* Modified Column */}
      <td
        className="px-3 py-2 w-36 text-sm text-gray-600 dark:text-gray-400"
        role="gridcell"
        title={absoluteDate}
      >
        {relativeDate}
      </td>

      {/* Type Column */}
      <td
        className="px-3 py-2 w-32 text-sm text-gray-600 dark:text-gray-400"
        role="gridcell"
      >
        {typeDisplay}
      </td>
    </tr>
  );
};

export default FileRow;
