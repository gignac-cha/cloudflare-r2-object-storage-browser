# File Preview Components

This directory contains all file preview components for the Cloudflare R2 Object Storage Browser Electron app. These components replicate macOS QuickLook functionality for various file types.

## Components

### 1. FilePreview (Main Router)

The main component that routes to appropriate preview based on file type.

```tsx
import { FilePreview } from './components/preview';
import { FileType } from './utils/formatters';

<FilePreview
  src="https://example.com/file.jpg"
  fileName="example.jpg"
  fileType={FileType.IMAGE}
/>
```

### 2. ImagePreview

Displays images with zoom, rotation, and fullscreen controls.

**Features:**
- Zoom in/out (0.25x - 5x)
- 90° rotation
- Fullscreen mode
- Pan/drag when zoomed
- Mouse wheel zoom
- Reset view

```tsx
import { ImagePreview } from './components/preview';

<ImagePreview
  src="https://example.com/photo.jpg"
  fileName="photo.jpg"
  alt="My photo"
/>
```

### 3. PDFPreview

Displays PDF files with page navigation and zoom controls.

**Features:**
- Page-by-page navigation
- Jump to specific page
- Zoom controls (50% - 300%)
- Page counter
- Text selection
- Annotation layer

**Dependencies:**
- `react-pdf`
- `pdfjs-dist`

```tsx
import { PDFPreview } from './components/preview';

<PDFPreview
  src="https://example.com/document.pdf"
  fileName="document.pdf"
/>
```

### 4. VideoPreview

Displays video files with playback controls using react-player.

**Features:**
- Play/pause
- Volume control with mute toggle
- Progress bar with seek
- Time display
- Fullscreen support
- Custom styled controls

**Supported formats:**
- MP4, MOV, AVI, MKV, WebM, etc.

```tsx
import { VideoPreview } from './components/preview';

<VideoPreview
  src="https://example.com/video.mp4"
  fileName="video.mp4"
/>
```

### 5. AudioPreview

Displays audio files with playback controls using react-player.

**Features:**
- Play/pause with visual feedback
- Volume control with mute toggle
- Progress bar with seek
- Time display
- Animated audio icon
- Gradient background

**Supported formats:**
- MP3, WAV, OGG, FLAC, M4A, AAC, etc.

```tsx
import { AudioPreview } from './components/preview';

<AudioPreview
  src="https://example.com/song.mp3"
  fileName="song.mp3"
/>
```

### 6. CodePreview

Displays code and text files with syntax highlighting using Monaco Editor.

**Features:**
- Syntax highlighting for 50+ languages
- Line numbers
- Minimap
- Read-only mode
- Dark/light theme auto-detection
- Copy to clipboard
- File info display (language, lines, size)

**Supported languages:**
- JavaScript/TypeScript, Python, Java, C/C++, Go, Rust, PHP, Ruby, Swift
- HTML, CSS, SCSS, JSON, XML, YAML
- Shell scripts, SQL, GraphQL, Markdown
- And many more...

```tsx
import { CodePreview } from './components/preview';

<CodePreview
  src="https://example.com/script.js"
  fileName="script.js"
  content="// Optional pre-loaded content"
/>
```

### 7. QuickLookModal

Full-screen modal wrapper for file previews, matching macOS QuickLook functionality.

**Features:**
- Full-screen overlay
- ESC key to close
- File name header
- Auto-routing to correct preview component
- Backdrop blur effect
- Keyboard accessible

```tsx
import { QuickLookModal, useQuickLook } from './components/modals';

// Using the hook
function MyComponent() {
  const { isOpen, fileUrl, fileName, fileType, openQuickLook, closeQuickLook } = useQuickLook();

  const handlePreviewFile = () => {
    openQuickLook(
      'https://example.com/file.jpg',
      'file.jpg',
      FileType.IMAGE
    );
  };

  return (
    <>
      <button onClick={handlePreviewFile}>Preview File</button>

      <QuickLookModal
        isOpen={isOpen}
        onClose={closeQuickLook}
        fileUrl={fileUrl}
        fileName={fileName}
        fileType={fileType}
      />
    </>
  );
}
```

## File Type Detection

File types are automatically detected based on file extensions using the `getFileType` utility:

```tsx
import { getFileType, FileType } from './utils/formatters';

const fileType = getFileType('document.pdf', false); // FileType.DOCUMENT
const imageType = getFileType('photo.jpg', false); // FileType.IMAGE
const folderType = getFileType('folder/', true); // FileType.FOLDER
```

## Unsupported File Types

For unsupported file types, the `FilePreview` component displays:

1. **Documents** (non-PDF): Download prompt with icon
2. **Archives**: Download prompt with archive icon
3. **Folders**: "Preview not available" message
4. **Unknown**: Attempts text preview, or shows unsupported message

## Installation

Required dependencies:

```bash
npm install react-pdf pdfjs-dist react-player @monaco-editor/react lucide-react
```

## Styling

All components use Tailwind CSS for styling with:
- Dark mode support
- Responsive design
- Smooth transitions
- Consistent spacing

## Accessibility

All components include:
- ARIA labels
- Keyboard navigation
- Focus management
- Screen reader support
- Semantic HTML

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (with backdrop-filter)
- Electron: Full support

## Performance Considerations

1. **Large PDFs**: Pages are loaded on-demand
2. **Videos**: Streaming supported via react-player
3. **Code files**: Monaco Editor uses web workers
4. **Images**: Native browser rendering with GPU acceleration

## Future Enhancements

Potential additions:
- Image gallery with arrow navigation
- PDF thumbnail sidebar
- Video/audio playlist support
- Code diff viewer
- 3D model preview
- Office document preview (via conversion)

## License

MIT
