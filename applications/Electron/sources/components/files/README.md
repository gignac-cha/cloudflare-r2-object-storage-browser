# File List Components

Comprehensive file list UI components for the Cloudflare R2 Object Storage Browser, ported from the macOS SwiftUI application.

## Overview

This module provides a complete file browsing experience with:

- **Multi-column table** with sorting and selection
- **Virtual scrolling** for large file lists
- **Context menus** with different actions for files, folders, and multi-selection
- **Keyboard shortcuts** for common operations
- **File type icons** with color coding
- **Loading and empty states**

## Components

### FileList

Main table component that displays files and folders.

```tsx
import { FileList } from '@/components/files';

<FileList
  items={fileItems}
  isLoading={false}
  selectedKeys={selectedKeys}
  onSelectionChange={setSelectedKeys}
  onItemOpen={handleOpenItem}
  onContextAction={handleContextAction}
  onSortChange={handleSortChange}
  sortConfig={{ column: 'name', direction: 'asc' }}
  enableVirtualization={true}
  virtualScrollHeight={600}
/>
```

**Props:**

- `items: FileListItem[]` - Array of file/folder items to display
- `isLoading?: boolean` - Show loading state
- `error?: string | null` - Show error state with message
- `selectedKeys?: Set<string>` - Set of selected item keys
- `onSelectionChange?: (keys: Set<string>) => void` - Selection change handler
- `onItemOpen?: (item: FileListItem) => void` - Double-click/Enter handler
- `onContextAction?: (action: FileContextAction, items: FileListItem[]) => void` - Context menu action handler
- `onSortChange?: (sort: SortConfig) => void` - Sort configuration change
- `sortConfig?: SortConfig` - Current sort configuration
- `enableVirtualization?: boolean` - Enable virtual scrolling (default: true)
- `virtualScrollHeight?: number` - Container height in pixels (default: 600)

**Features:**

- ✅ Multi-select with checkboxes
- ✅ Cmd/Ctrl-click for toggle selection
- ✅ Shift-click for range selection
- ✅ Click column headers to sort
- ✅ Folders always appear before files
- ✅ Double-click to open folders/preview files
- ✅ Right-click for context menu
- ✅ Keyboard shortcuts (Space for Quick Look, Enter to open, etc.)
- ✅ Virtual scrolling for 50+ items
- ✅ Loading, error, and empty states
- ✅ Selection counter badge

### FileRow

Individual table row component.

```tsx
import { FileRow } from '@/components/files';

<FileRow
  item={fileItem}
  isSelected={isSelected}
  onSelectionChange={handleSelectionChange}
  onDoubleClick={handleDoubleClick}
  onContextMenu={handleContextMenu}
  onClick={handleClick}
/>
```

**Props:**

- `item: FileListItem` - File item data
- `isSelected: boolean` - Whether the row is selected
- `onSelectionChange: (key: string, selected: boolean) => void` - Checkbox handler
- `onDoubleClick: (item: FileListItem) => void` - Double-click handler
- `onContextMenu: (e: React.MouseEvent, item: FileListItem) => void` - Right-click handler
- `onClick: (e: React.MouseEvent, item: FileListItem) => void` - Click handler

**Features:**

- ✅ File type icon with color
- ✅ Cached file indicator badge
- ✅ Hover effects
- ✅ Selection highlight
- ✅ Monospace font for file names
- ✅ Relative date with absolute tooltip
- ✅ File size formatting
- ✅ File type/extension display

### ContextMenu

Right-click context menu with different actions based on selection.

```tsx
import { ContextMenu } from '@/components/files';

<ContextMenu
  position={{ x: 100, y: 200 }}
  items={selectedItems}
  hasCachedItems={true}
  onClose={closeMenu}
  onAction={handleAction}
/>
```

**Props:**

- `position: { x: number; y: number }` - Menu position (from mouse event)
- `items: FileListItem[]` - Selected items
- `hasCachedItems: boolean` - Whether any item is cached locally
- `onClose: () => void` - Close menu handler
- `onAction: (action: FileContextAction, items: FileListItem[]) => void` - Action handler

**Menu Types:**

**Single File:**
- Quick Look (Space)
- Download (⌘D)
- Save As... (if cached)
- Open in Browser
- Copy Path (⌘C)
- Copy URL
- Get Info (⌘I)
- Delete (⌘⌫)

**Single Folder:**
- Open (⏎)
- Delete Folder and Contents (⌘⌫)

**Multi-selection:**
- Download N Items
- Delete N Items

## Utilities

### formatters.ts

Utility functions for formatting and file operations.

**Functions:**

```typescript
// Format file size (bytes → KB/MB/GB)
formatFileSize(1048576) // "1.0 MB"

// Format relative date
formatDate("2025-10-15T12:00:00Z") // "2h ago"

// Format absolute date for tooltips
formatAbsoluteDate("2025-10-15T12:00:00Z") // "Oct 15, 2025 at 12:00 PM"

// Get file type from name
getFileType("document.pdf", false) // FileType.DOCUMENT

// Get file extension
getFileExtension("document.pdf") // "pdf"

// Get file icon configuration
getFileIcon(FileType.IMAGE) // { name: "image", color: "#f472b6" }

// Get file type display name
getFileTypeDisplayName(FileType.CODE) // "Code"

// Get file extension display
getFileExtensionDisplay("document.pdf") // ".PDF"

// Format transfer speed
formatTransferSpeed(1048576) // "1.0 MB/s"

// Format duration
formatDuration(150) // "2m 30s"

// Truncate file name
truncateFileName("very-long-file-name.pdf", 20) // "very-long-f....pdf"

// Sort file list (folders first)
sortFileList(items, 'name', 'asc')
```

**File Type Categories:**

- `FOLDER` - Directories
- `IMAGE` - jpg, png, gif, svg, etc.
- `VIDEO` - mp4, mov, avi, mkv, etc.
- `AUDIO` - mp3, wav, ogg, flac, etc.
- `DOCUMENT` - pdf, doc, txt, xls, ppt, etc.
- `ARCHIVE` - zip, rar, 7z, tar, gz, etc.
- `CODE` - js, ts, py, java, html, css, etc.
- `DATA` - json, xml, yaml, csv, sql, etc.
- `UNKNOWN` - Other file types

## Types

### file.ts

TypeScript type definitions.

**Key Types:**

```typescript
interface R2Object {
  key: string;
  size: number;
  lastModified: string;
  etag?: string;
  storageClass?: string;
  isFolder: boolean;
  name: string;
  fileExtension?: string;
  fileType: FileType;
}

interface FileListItem extends R2Object {
  id: string;
  isSelected?: boolean;
  isCached?: boolean;
  cachePath?: string;
}

interface SortConfig {
  column: 'name' | 'size' | 'lastModified' | 'type';
  direction: 'asc' | 'desc';
}

type FileContextAction =
  | 'open' | 'delete-folder'  // Folder actions
  | 'quick-look' | 'download' | 'save-as' | 'open-browser' | 'copy-path' | 'copy-url' | 'get-info' | 'delete'  // File actions
  | 'download-selected' | 'delete-selected';  // Multi-select actions
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Space` | Quick Look (preview file) |
| `Enter` | Open folder or file |
| `Escape` | Clear selection |
| `Cmd+A` | Select all |
| `Cmd+C` | Copy path to clipboard |
| `Cmd+D` | Download selected items |
| `Cmd+I` | Get file info |
| `Cmd+⌫` | Delete selected items |
| `Click` | Select single item |
| `Cmd+Click` | Toggle item selection |
| `Shift+Click` | Range selection |

## Virtual Scrolling

The FileList component uses `@tanstack/react-virtual` for efficient rendering of large file lists.

**When enabled:**
- Only visible rows are rendered
- Automatic when list has 50+ items
- Configurable with `enableVirtualization` prop
- Set scroll container height with `virtualScrollHeight` prop

**Performance:**
- Handles 10,000+ items smoothly
- Constant memory usage regardless of list size
- Smooth scrolling with 60fps

## Dark Mode Support

All components support dark mode via Tailwind's `dark:` variants.

```css
/* Light mode */
bg-white text-gray-900

/* Dark mode */
dark:bg-gray-900 dark:text-gray-100
```

## Accessibility

Full keyboard navigation and screen reader support:

- Proper ARIA roles (`grid`, `row`, `gridcell`, `columnheader`)
- Keyboard navigation (arrows, space, enter)
- Focus indicators
- ARIA labels and descriptions
- Sort direction announcements

## Dependencies

Required npm packages:

```json
{
  "@tanstack/react-table": "^8.x",
  "@tanstack/react-virtual": "^3.x",
  "lucide-react": "^0.x",
  "react": "^18.x"
}
```

## Usage Example

```tsx
import React, { useState } from 'react';
import { FileList } from '@/components/files';
import { FileListItem, FileContextAction, SortConfig } from '@/types/file';

function FileExplorer() {
  const [items, setItems] = useState<FileListItem[]>([
    {
      id: '1',
      key: 'documents/',
      name: 'documents',
      size: 0,
      lastModified: '2025-10-15T12:00:00Z',
      isFolder: true,
      fileType: FileType.FOLDER,
    },
    {
      id: '2',
      key: 'image.jpg',
      name: 'image.jpg',
      size: 1048576,
      lastModified: '2025-10-15T11:00:00Z',
      isFolder: false,
      fileType: FileType.IMAGE,
      fileExtension: 'jpg',
      isCached: true,
    },
  ]);

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: 'name',
    direction: 'asc',
  });

  const handleItemOpen = (item: FileListItem) => {
    if (item.isFolder) {
      console.log('Open folder:', item.key);
      // Navigate to folder
    } else {
      console.log('Preview file:', item.key);
      // Show quick look preview
    }
  };

  const handleContextAction = (action: FileContextAction, items: FileListItem[]) => {
    console.log('Context action:', action, items);

    switch (action) {
      case 'download':
        // Download files
        break;
      case 'delete':
        // Delete files
        break;
      case 'quick-look':
        // Show preview
        break;
      // ... handle other actions
    }
  };

  return (
    <FileList
      items={items}
      selectedKeys={selectedKeys}
      onSelectionChange={setSelectedKeys}
      onItemOpen={handleItemOpen}
      onContextAction={handleContextAction}
      onSortChange={setSortConfig}
      sortConfig={sortConfig}
    />
  );
}
```

## Styling

Components use Tailwind CSS for styling. Key design tokens:

**Colors:**
- Primary: `blue-500` / `blue-600`
- Success: `green-500`
- Destructive: `red-600`
- Gray scale: `gray-50` → `gray-900`

**Spacing:**
- Row height: `44px` (py-2)
- Icon size: `20px`
- Padding: `px-3` (12px)

**Typography:**
- File names: `font-mono text-sm`
- Headers: `text-xs font-semibold uppercase`
- Sizes/dates: `text-sm`

## Testing

Example test with React Testing Library:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { FileList } from './FileList';

test('selects item on click', () => {
  const items = [/* ... */];
  const onSelectionChange = jest.fn();

  render(
    <FileList
      items={items}
      onSelectionChange={onSelectionChange}
    />
  );

  const row = screen.getByText('document.pdf');
  fireEvent.click(row);

  expect(onSelectionChange).toHaveBeenCalled();
});
```

## Future Enhancements

Potential improvements:

- [ ] Drag-and-drop file upload
- [ ] Inline file renaming
- [ ] Thumbnail previews for images
- [ ] File size column chart (visual indicator)
- [ ] Column resize/reorder
- [ ] Saved sort preferences
- [ ] Custom column visibility
- [ ] Grid view (alternative to table)
- [ ] Breadcrumb integration
- [ ] Search/filter in list

## References

- **macOS Source:** `/Views/FileListView.swift` (405 lines)
- **TanStack Table:** https://tanstack.com/table/
- **TanStack Virtual:** https://tanstack.com/virtual/
- **Lucide Icons:** https://lucide.dev/
- **Design Spec:** ELECTRON_PORT_ANALYSIS.md (Lines 197-253)
