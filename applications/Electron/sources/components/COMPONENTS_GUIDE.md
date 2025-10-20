# Components Guide

This guide documents all UI components created for the Cloudflare R2 Object Storage Browser Electron application.

## Table of Contents

- [Debug Components](#debug-components)
  - [DebugPanel](#debugpanel)
  - [APIResponseTab](#apiresponsetab)
  - [ServerLogsTab](#serverlogstab)
- [Modal Components](#modal-components)
  - [SettingsModal](#settingsmodal)
- [Loading Components](#loading-components)
  - [LoadingOverlay](#loadingoverlay)
- [Usage Examples](#usage-examples)

---

## Debug Components

Located in: `src/components/debug/`

### DebugPanel

Main debug panel with tabbed interface for API logs and server logs.

**Features:**
- Tab navigation (API Response, Server Logs)
- Collapsible panel
- Close button
- Integrated with UIStore for visibility control

**Props:** None (controlled via UIStore)

**Usage:**
```tsx
import { DebugPanel } from '@/components/debug';

function App() {
  return (
    <div>
      {/* Your app content */}
      <DebugPanel />
    </div>
  );
}
```

**Store Integration:**
```tsx
import { useUIStore } from '@/stores';

// Toggle visibility
const { toggleDebugPanel, setDebugPanelVisible } = useUIStore();

// Show panel
setDebugPanelVisible(true);

// Hide panel
setDebugPanelVisible(false);

// Toggle
toggleDebugPanel();
```

---

### APIResponseTab

Displays API request/response logs with search and export capabilities.

**Features:**
- Method badges (GET, POST, PUT, DELETE, PATCH) with color coding
- Expandable log entries
- Request/response body display with JSON formatting
- Error highlighting
- Search functionality
- Copy individual logs to clipboard
- Export all logs to JSON file
- Clear logs button
- Auto-scroll to latest logs
- Timestamps

**Props:** None (controlled via DebugStore)

**Usage:**
```tsx
import { APIResponseTab } from '@/components/debug';

// Used within DebugPanel
<Tab.Panel>
  <APIResponseTab />
</Tab.Panel>
```

**Store Integration:**
```tsx
import { useDebugStore } from '@/stores';

// Add API log entry
const { addAPILog } = useDebugStore();

addAPILog({
  method: 'GET',
  endpoint: '/buckets',
  status: 200,
  responseBody: { buckets: [...] },
  duration: 150,
});

// Add error log
addAPILog({
  method: 'POST',
  endpoint: '/buckets/my-bucket/objects',
  status: 500,
  error: 'Internal server error',
});
```

**Color Coding:**
- GET: Blue
- POST: Green
- PUT: Orange
- DELETE: Red
- PATCH: Purple
- Status 2xx: Green
- Status 4xx/5xx: Red
- Status 3xx: Yellow

---

### ServerLogsTab

Displays server logs with filtering and search capabilities.

**Features:**
- Line numbers
- Log level badges (INFO, WARN, ERROR, DEBUG) with color coding
- Log level filtering dropdown
- Search functionality
- Auto-scroll toggle
- Export logs to text file
- Clear logs button
- Monospace font for better readability
- Source tracking

**Props:** None (controlled via DebugStore)

**Usage:**
```tsx
import { ServerLogsTab } from '@/components/debug';

// Used within DebugPanel
<Tab.Panel>
  <ServerLogsTab />
</Tab.Panel>
```

**Store Integration:**
```tsx
import { useDebugStore } from '@/stores';

// Add server log entry
const { addServerLog } = useDebugStore();

addServerLog({
  level: 'info',
  message: 'Server started on port 3000',
  source: 'server',
});

addServerLog({
  level: 'error',
  message: 'Failed to connect to R2',
  source: 'r2-client',
});

// Filter logs
const { setLogsLevelFilter, setLogsSearchQuery } = useDebugStore();

setLogsLevelFilter('error'); // Show only errors
setLogsSearchQuery('connection'); // Search for 'connection'

// Toggle auto-scroll
const { setAutoScrollLogs } = useDebugStore();
setAutoScrollLogs(false);
```

**Color Coding:**
- INFO: Blue
- WARN: Yellow
- ERROR: Red
- DEBUG: Gray

---

## Modal Components

Located in: `src/components/modals/`

### SettingsModal

Modal dialog for configuring Cloudflare R2 credentials.

**Features:**
- Three input fields:
  - Account ID (text)
  - Access Key ID (text)
  - Secret Access Key (password)
- Help text for each field
- Form validation
- Save button with loading state
- Clear button with confirmation
- Success/error feedback
- Auto-close on successful save
- Backdrop blur effect

**Props:** None (controlled via UIStore and SettingsStore)

**Usage:**
```tsx
import { SettingsModal } from '@/components/modals';

function App() {
  return (
    <div>
      {/* Your app content */}
      <SettingsModal />
    </div>
  );
}
```

**Store Integration:**
```tsx
import { useUIStore, useSettingsStore } from '@/stores';

// Open settings modal
const { setSettingsVisible } = useUIStore();
setSettingsVisible(true);

// Access credentials
const { accountId, accessKeyId, hasCredentials } = useSettingsStore();

// Save credentials programmatically
const { saveSettings } = useSettingsStore();
await saveSettings({
  accountId: 'xxx',
  accessKeyId: 'yyy',
  secretAccessKey: 'zzz',
});

// Clear credentials
const { clearSettings } = useSettingsStore();
await clearSettings();
```

**Field Help Text:**
- **Account ID**: "Found in Cloudflare dashboard → R2"
- **Access Key ID**: "Create API token in R2 settings"
- **Secret Access Key**: "Shown only once when creating the API token"

---

## Loading Components

Located in: `src/components/loading/`

### LoadingOverlay

Full-screen loading overlay with progress indicator.

**Features:**
- Two modes:
  - **Determinate**: Progress bar with percentage (0-100%)
  - **Indeterminate**: Animated spinner
- Loading message (up to 5 lines with line-clamp)
- Optional cancel button
- Blocks user interaction
- Backdrop blur effect
- Smooth transitions
- ARIA attributes for accessibility

**Props:** None (controlled via UIStore)

**Usage:**
```tsx
import { LoadingOverlay } from '@/components/loading';

function App() {
  return (
    <div>
      {/* Your app content */}
      <LoadingOverlay />
    </div>
  );
}
```

**Store Integration:**
```tsx
import { useUIStore } from '@/stores';

const { showLoadingOverlay, updateLoadingOverlay, hideLoadingOverlay } = useUIStore();

// Show indeterminate loading
showLoadingOverlay('Loading buckets...');

// Show determinate loading with progress
showLoadingOverlay('Downloading files...', {
  progress: 0,
});

// Update progress
updateLoadingOverlay('Downloading files... (5/10)', 50);

// Show with cancel button
showLoadingOverlay('Processing files...', {
  isCancellable: true,
  onCancel: () => {
    console.log('User cancelled');
    // Perform cancellation logic
  },
});

// Hide overlay
hideLoadingOverlay();
```

**Progress Updates:**
```tsx
// Simulate file download with progress
async function downloadFiles() {
  showLoadingOverlay('Starting download...', { progress: 0 });

  for (let i = 0; i <= 100; i += 10) {
    await new Promise(resolve => setTimeout(resolve, 500));
    updateLoadingOverlay(`Downloading... ${i}%`, i);
  }

  hideLoadingOverlay();
}
```

---

## Usage Examples

### Complete Integration Example

```tsx
import React, { useEffect } from 'react';
import {
  DebugPanel,
  SettingsModal,
  LoadingOverlay,
} from '@/components';
import {
  useUIStore,
  useDebugStore,
  useSettingsStore,
} from '@/stores';

function App() {
  const { hasCredentials } = useSettingsStore();
  const { setSettingsVisible, showLoadingOverlay, hideLoadingOverlay } = useUIStore();
  const { addAPILog, addServerLog } = useDebugStore();

  // Show settings on first launch
  useEffect(() => {
    if (!hasCredentials) {
      setSettingsVisible(true);
    }
  }, [hasCredentials, setSettingsVisible]);

  // Example: Load data with logging
  const loadBuckets = async () => {
    showLoadingOverlay('Loading buckets...');

    try {
      const response = await fetch('/api/buckets');
      const data = await response.json();

      // Log API call
      addAPILog({
        method: 'GET',
        endpoint: '/api/buckets',
        status: response.status,
        responseBody: data,
        duration: 150,
      });

      // Log server message
      addServerLog({
        level: 'info',
        message: `Loaded ${data.buckets.length} buckets`,
        source: 'api-client',
      });

      return data;
    } catch (error) {
      // Log error
      addAPILog({
        method: 'GET',
        endpoint: '/api/buckets',
        status: 500,
        error: error.message,
      });

      addServerLog({
        level: 'error',
        message: `Failed to load buckets: ${error.message}`,
        source: 'api-client',
      });

      throw error;
    } finally {
      hideLoadingOverlay();
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {/* Your app content */}
      </main>

      {/* Debug panel */}
      <DebugPanel />

      {/* Settings modal */}
      <SettingsModal />

      {/* Loading overlay */}
      <LoadingOverlay />
    </div>
  );
}

export default App;
```

### API Client Integration

```tsx
// src/services/apiClient.ts
import { useDebugStore } from '@/stores';

export class APIClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async request(method: string, endpoint: string, options = {}) {
    const startTime = Date.now();
    const { addAPILog } = useDebugStore.getState();

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method,
        ...options,
      });

      const data = await response.json();
      const duration = Date.now() - startTime;

      // Log successful request
      addAPILog({
        method: method as any,
        endpoint,
        status: response.status,
        requestBody: options.body ? JSON.parse(options.body) : undefined,
        responseBody: data,
        duration,
      });

      return data;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log failed request
      addAPILog({
        method: method as any,
        endpoint,
        error: error.message,
        duration,
      });

      throw error;
    }
  }
}
```

### Server Log Integration

```tsx
// In your Electron main process or server manager
import { useServerStore, useDebugStore } from '@/stores';

export class ServerManager {
  startServer() {
    const serverProcess = spawn('node', ['server.js']);
    const { addLog } = useServerStore.getState();
    const { addServerLog } = useDebugStore.getState();

    serverProcess.stdout.on('data', (data) => {
      const message = data.toString();

      // Add to server store logs
      addLog(message);

      // Parse and add to debug store with level
      const level = this.parseLogLevel(message);
      addServerLog({
        level,
        message: message.trim(),
        source: 'server',
      });
    });

    serverProcess.stderr.on('data', (data) => {
      const message = data.toString();

      addLog(message);
      addServerLog({
        level: 'error',
        message: message.trim(),
        source: 'server',
      });
    });
  }

  parseLogLevel(message: string): 'info' | 'warn' | 'error' | 'debug' {
    if (message.toLowerCase().includes('error')) return 'error';
    if (message.toLowerCase().includes('warn')) return 'warn';
    if (message.toLowerCase().includes('debug')) return 'debug';
    return 'info';
  }
}
```

---

## Styling & Theming

All components support dark mode via Tailwind's `dark:` variants.

**Color Scheme:**
- **Primary**: Blue (600/500 for light/dark)
- **Success**: Green (600/400)
- **Warning**: Yellow (600/400)
- **Error**: Red (600/400)
- **Background**: White/Gray-800
- **Text**: Gray-900/Gray-100

**Transitions:**
- All interactive elements use `transition-colors` for smooth hover effects
- Modal animations use `duration-200` to `duration-300`
- Progress updates use `transition-all duration-300 ease-out`

---

## Accessibility

All components include proper ARIA attributes and keyboard navigation:

- **Buttons**: `aria-label` and `title` attributes
- **Progress bars**: `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- **Loading overlay**: `aria-live="polite"`, `aria-busy`
- **Modals**: Focus trap and ESC key support (via Headless UI)
- **Form fields**: Associated labels and help text

---

## Dependencies

- **React** 18.3+
- **@headlessui/react** 2.1+ (for modals and tabs)
- **lucide-react** 0.446+ (for icons)
- **clsx** 2.1+ (for conditional classes)
- **date-fns** 4.1+ (for date formatting)
- **zustand** 4.5+ (for state management)
- **tailwindcss** 3.4+ (for styling)

---

## File Structure

```
src/
├── components/
│   ├── debug/
│   │   ├── DebugPanel.tsx
│   │   ├── APIResponseTab.tsx
│   │   ├── ServerLogsTab.tsx
│   │   └── index.ts
│   ├── modals/
│   │   ├── SettingsModal.tsx
│   │   └── index.ts
│   └── loading/
│       ├── LoadingOverlay.tsx
│       └── index.ts
└── stores/
    ├── useDebugStore.ts
    ├── useUIStore.ts
    ├── useSettingsStore.ts
    └── index.ts
```

---

## TypeScript Types

### Debug Store Types

```typescript
type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface APILogEntry {
  id: string;
  timestamp: Date;
  method: HTTPMethod;
  endpoint: string;
  status?: number;
  requestBody?: any;
  responseBody?: any;
  error?: string;
  duration?: number;
}

interface ServerLogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source?: string;
}
```

### UI Store Types

```typescript
interface LoadingOverlay {
  isVisible: boolean;
  message: string;
  progress?: number;
  isCancellable: boolean;
  onCancel?: () => void;
}
```

---

## Performance Considerations

- **Virtual Scrolling**: Consider implementing virtual scrolling for large log lists (1000+ entries)
- **Log Limits**: Implement automatic log rotation to prevent memory issues
- **Debouncing**: Search inputs are not debounced by default - add debouncing for better performance
- **Memoization**: Use React.memo() for log entry components if experiencing lag

---

## Testing

Example test cases for components:

```tsx
// APIResponseTab.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { APIResponseTab } from './APIResponseTab';
import { useDebugStore } from '@/stores';

describe('APIResponseTab', () => {
  beforeEach(() => {
    useDebugStore.getState().clearAPILogs();
  });

  it('should display empty state when no logs', () => {
    render(<APIResponseTab />);
    expect(screen.getByText('No API logs')).toBeInTheDocument();
  });

  it('should display logs when available', () => {
    const { addAPILog } = useDebugStore.getState();
    addAPILog({
      method: 'GET',
      endpoint: '/buckets',
      status: 200,
    });

    render(<APIResponseTab />);
    expect(screen.getByText('/buckets')).toBeInTheDocument();
    expect(screen.getByText('GET')).toBeInTheDocument();
  });

  it('should filter logs by search query', () => {
    const { addAPILog, setAPISearchQuery } = useDebugStore.getState();
    addAPILog({ method: 'GET', endpoint: '/buckets', status: 200 });
    addAPILog({ method: 'POST', endpoint: '/objects', status: 201 });

    render(<APIResponseTab />);

    const searchInput = screen.getByPlaceholderText('Search API logs...');
    fireEvent.change(searchInput, { target: { value: 'buckets' } });

    expect(screen.getByText('/buckets')).toBeInTheDocument();
    expect(screen.queryByText('/objects')).not.toBeInTheDocument();
  });
});
```

---

## Future Enhancements

Potential improvements for these components:

1. **DebugPanel**:
   - Add filter by status code (2xx, 4xx, 5xx)
   - Add timeline view for API calls
   - Add performance metrics dashboard

2. **ServerLogsTab**:
   - Add log highlighting/syntax coloring
   - Add stack trace folding for errors
   - Add log export in multiple formats (JSON, CSV)

3. **SettingsModal**:
   - Add test connection button
   - Add multiple account profiles
   - Add import/export settings

4. **LoadingOverlay**:
   - Add multiple concurrent loading tasks
   - Add estimated time remaining
   - Add pause/resume capability

---

## Support & Contributing

For issues or feature requests related to these components:

1. Check existing documentation above
2. Review the TypeScript types and interfaces
3. Refer to the ELECTRON_PORT_ANALYSIS.md for original macOS behavior
4. Check Tailwind CSS documentation for styling questions

When contributing:
- Follow the existing code style and structure
- Add TypeScript types for all props and state
- Include JSDoc comments for components and functions
- Add ARIA attributes for accessibility
- Test dark mode appearance
- Update this guide with new features
