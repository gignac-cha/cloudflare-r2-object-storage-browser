import React, { useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Upload,
  Download,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { useFileStore } from '../../stores/useFileStore';
import { useBucketStore } from '../../stores/useBucketStore';

interface ToolbarProps {
  onUpload?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  onRefresh?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onUpload,
  onDownload,
  onDelete,
  onRefresh,
}) => {
  const {
    selectedObjects,
    canGoBack,
    canGoForward,
    canGoUp,
    goBack,
    goForward,
    goUp,
  } = useFileStore();

  const { selectedBucket } = useBucketStore();

  const selectedCount = selectedObjects.size;
  const hasSelection = selectedCount > 0;
  const hasBucket = !!selectedBucket;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we're in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Cmd/Ctrl + [ : Go back
      if ((e.metaKey || e.ctrlKey) && e.key === '[') {
        e.preventDefault();
        if (canGoBack()) {
          goBack();
        }
      }

      // Cmd/Ctrl + ] : Go forward
      if ((e.metaKey || e.ctrlKey) && e.key === ']') {
        e.preventDefault();
        if (canGoForward()) {
          goForward();
        }
      }

      // Cmd/Ctrl + ArrowUp : Go up
      if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowUp') {
        e.preventDefault();
        if (canGoUp()) {
          goUp();
        }
      }

      // Cmd/Ctrl + R : Refresh
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault();
        if (onRefresh) {
          onRefresh();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canGoBack, canGoForward, canGoUp, goBack, goForward, goUp, onRefresh]);

  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
      {/* Navigation buttons */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          icon={ChevronLeft}
          label="Back"
          onClick={goBack}
          disabled={!canGoBack()}
          shortcut="⌘["
        />
        <ToolbarButton
          icon={ChevronRight}
          label="Forward"
          onClick={goForward}
          disabled={!canGoForward()}
          shortcut="⌘]"
        />
        <ToolbarButton
          icon={ChevronUp}
          label="Up"
          onClick={goUp}
          disabled={!canGoUp()}
          shortcut="⌘↑"
        />

        {/* Divider */}
        <div className="mx-2 h-6 w-px bg-gray-300 dark:bg-gray-600" />

        {/* Action buttons */}
        <ToolbarButton
          icon={Upload}
          label="Upload"
          onClick={onUpload}
          disabled={!hasBucket}
        />
        <ToolbarButton
          icon={Download}
          label="Download"
          onClick={onDownload}
          disabled={!hasSelection}
          badge={hasSelection ? selectedCount : undefined}
        />
        <ToolbarButton
          icon={Trash2}
          label="Delete"
          onClick={onDelete}
          disabled={!hasSelection}
          variant="danger"
          badge={hasSelection ? selectedCount : undefined}
        />

        {/* Divider */}
        <div className="mx-2 h-6 w-px bg-gray-300 dark:bg-gray-600" />

        <ToolbarButton
          icon={RefreshCw}
          label="Refresh"
          onClick={onRefresh}
          disabled={!hasBucket}
          shortcut="⌘R"
        />
      </div>

      {/* Selection counter */}
      {hasSelection && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span>
            {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
          </span>
        </div>
      )}
    </div>
  );
};

interface ToolbarButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'danger';
  badge?: number;
  shortcut?: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  variant = 'default',
  badge,
  shortcut,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const getButtonStyles = () => {
    if (disabled) {
      return 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600';
    }

    if (variant === 'danger') {
      return 'bg-white text-red-600 hover:bg-red-50 active:bg-red-100 dark:bg-gray-800 dark:text-red-500 dark:hover:bg-red-900/20 dark:active:bg-red-900/30';
    }

    return 'bg-white text-gray-700 hover:bg-gray-100 active:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600';
  };

  const tooltipText = shortcut ? `${label} (${shortcut})` : label;

  return (
    <div className="relative">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`relative flex h-8 min-w-[2rem] items-center justify-center gap-1.5 rounded-md border px-3 transition-all ${getButtonStyles()} ${
          disabled
            ? 'border-gray-200 dark:border-gray-700'
            : 'border-gray-300 shadow-sm hover:shadow dark:border-gray-600'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={label}
        title={tooltipText}
      >
        <Icon className="h-4 w-4" />

        {/* Badge */}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-blue-500 px-1 text-xs font-medium text-white shadow-sm">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </button>

      {/* Tooltip */}
      {isHovered && !disabled && (
        <div className="absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white shadow-lg dark:bg-gray-700">
          {tooltipText}
          <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-gray-900 dark:bg-gray-700" />
        </div>
      )}
    </div>
  );
};
