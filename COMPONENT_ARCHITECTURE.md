# Component Architecture Overview

**Visual guide to the debug components, settings modal, and loading overlay**

---

## Component Hierarchy

```
App.tsx
├── MainLayout
│   ├── Header
│   ├── Sidebar
│   ├── Content
│   └── DebugPanel ✨ NEW
│       ├── Tab: API Response
│       │   └── APIResponseTab ✨ NEW
│       └── Tab: Server Logs
│           └── ServerLogsTab ✨ NEW
│
├── SettingsModal ✨ NEW (Portal)
└── LoadingOverlay ✨ NEW (Portal)
```

---

## State Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Zustand Stores (Root)                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  useDebugStore ✨ NEW                                       │
│  ├── apiLogs: APILogEntry[]                                │
│  ├── serverLogs: ServerLogEntry[]                          │
│  ├── addAPILog()                                           │
│  ├── addServerLog()                                        │
│  ├── clearAPILogs() / clearServerLogs()                   │
│  ├── exportAPILogs() / exportServerLogs()                 │
│  └── getFilteredAPILogs() / getFilteredServerLogs()       │
│                                                             │
│  useUIStore (Updated)                                       │
│  ├── isDebugPanelVisible                                   │
│  ├── debugPanelActiveTab                                   │
│  ├── isSettingsVisible                                     │
│  ├── loadingOverlay { isVisible, message, progress }      │
│  ├── toggleDebugPanel()                                    │
│  ├── setSettingsVisible()                                  │
│  ├── showLoadingOverlay()                                  │
│  └── hideLoadingOverlay()                                  │
│                                                             │
│  useSettingsStore (Existing)                                │
│  ├── accountId                                             │
│  ├── accessKeyId                                           │
│  ├── secretAccessKey                                       │
│  ├── hasCredentials                                        │
│  ├── saveSettings()                                        │
│  └── clearSettings()                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### API Logging Flow

```
API Client
    │
    │ fetch('/buckets')
    ↓
┌────────────────┐
│  HTTP Request  │
└────────┬───────┘
         │
         │ startTime = Date.now()
         ↓
┌────────────────┐
│    Response    │
└────────┬───────┘
         │
         │ duration = Date.now() - startTime
         ↓
┌────────────────────────────────┐
│  useDebugStore.addAPILog()     │
│  {                             │
│    method: 'GET',              │
│    endpoint: '/buckets',       │
│    status: 200,                │
│    responseBody: data,         │
│    duration: 150               │
│  }                             │
└────────┬───────────────────────┘
         │
         ↓
┌────────────────────────────────┐
│  DebugPanel > APIResponseTab   │
│  Displays log in UI            │
└────────────────────────────────┘
```

### Server Logging Flow

```
Server Process (stdout/stderr)
    │
    │ "Server started on port 3000"
    ↓
┌──────────────────┐
│  Server Manager  │
│  (stdout.on())   │
└────────┬─────────┘
         │
         │ Parse log level
         ↓
┌────────────────────────────────┐
│  useServerStore.addLog()       │
│  (Raw log string)              │
└────────┬───────────────────────┘
         │
         │
         ↓
┌────────────────────────────────┐
│  useDebugStore.addServerLog()  │
│  {                             │
│    level: 'info',              │
│    message: '...',             │
│    source: 'server'            │
│  }                             │
└────────┬───────────────────────┘
         │
         ↓
┌────────────────────────────────┐
│  DebugPanel > ServerLogsTab    │
│  Displays log in UI            │
└────────────────────────────────┘
```

### Settings Flow

```
User clicks Settings
    │
    ↓
┌────────────────────────────────┐
│  useUIStore.setSettingsVisible │
│  (true)                        │
└────────┬───────────────────────┘
         │
         ↓
┌────────────────────────────────┐
│  SettingsModal renders         │
│  (Headless UI Dialog)          │
└────────┬───────────────────────┘
         │
         │ User enters credentials
         ↓
┌────────────────────────────────┐
│  Form validation               │
└────────┬───────────────────────┘
         │
         │ Click Save
         ↓
┌────────────────────────────────┐
│  useSettingsStore.saveSettings │
│  {                             │
│    accountId: 'xxx',           │
│    accessKeyId: 'yyy',         │
│    secretAccessKey: 'zzz'      │
│  }                             │
└────────┬───────────────────────┘
         │
         │ IPC to Electron main
         ↓
┌────────────────────────────────┐
│  Save to:                      │
│  ~/.cloudflare-r2.../          │
│  settings.json                 │
└────────┬───────────────────────┘
         │
         │ Success
         ↓
┌────────────────────────────────┐
│  Modal auto-closes (1s delay)  │
└────────────────────────────────┘
```

### Loading Overlay Flow

```
Start operation
    │
    ↓
┌────────────────────────────────────┐
│  useUIStore.showLoadingOverlay()   │
│  'Loading buckets...'              │
└────────┬───────────────────────────┘
         │
         ↓
┌────────────────────────────────────┐
│  LoadingOverlay renders            │
│  (Backdrop + Spinner/Progress)     │
└────────┬───────────────────────────┘
         │
         │ For determinate progress:
         │ updateLoadingOverlay(msg, progress)
         ↓
┌────────────────────────────────────┐
│  Progress bar updates              │
│  (0% → 25% → 50% → 75% → 100%)    │
└────────┬───────────────────────────┘
         │
         │ Operation complete
         ↓
┌────────────────────────────────────┐
│  useUIStore.hideLoadingOverlay()   │
└────────┬───────────────────────────┘
         │
         ↓
┌────────────────────────────────────┐
│  Overlay fades out (200ms)         │
└────────────────────────────────────┘
```

---

## Component Structure

### DebugPanel Layout

```
┌─────────────────────────────────────────────────────────┐
│  Debug Panel                                      [X]   │
├─────────────────────────────────────────────────────────┤
│  [ API Response ]  [ Server Logs ]                      │
├─────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────┐ │
│  │  [Search] [Export] [Clear]                        │ │
│  ├───────────────────────────────────────────────────┤ │
│  │                                                   │ │
│  │  GET  /buckets              200    14:23:45      │ │
│  │  POST /objects              201    14:24:12      │ │
│  │  DELETE /objects/file.txt   204    14:25:01      │ │
│  │                                                   │ │
│  │  Click to expand for request/response details... │ │
│  │                                                   │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
        ↕ Resizable (264px height)
```

### APIResponseTab Expanded Entry

```
┌─────────────────────────────────────────────────────────┐
│  POST  /buckets/test/objects   201  150ms   14:24:12   │
│                                                    [📋] │
├─────────────────────────────────────────────────────────┤
│  Request Body:                                          │
│  {                                                      │
│    "key": "folder/file.txt",                           │
│    "size": 1024                                        │
│  }                                                      │
│                                                         │
│  Response Body:                                         │
│  {                                                      │
│    "status": "success",                                │
│    "data": {                                           │
│      "etag": "abc123",                                 │
│      "url": "https://..."                              │
│    }                                                   │
│  }                                                      │
└─────────────────────────────────────────────────────────┘
```

### ServerLogsTab Layout

```
┌─────────────────────────────────────────────────────────┐
│  [Search] [Level: All ▼] [🔽] [Export] [Clear]         │
├─────────────────────────────────────────────────────────┤
│   1  14:23:45.123  INFO   [server]  Started on 3000    │
│   2  14:24:12.456  WARN   [monitor] High memory usage  │
│   3  14:25:01.789  ERROR  [r2] Connection failed       │
│   4  14:25:30.012  INFO   [server]  Request completed  │
│   5  14:26:15.345  DEBUG  [cache]  Cache hit           │
│                                                         │
│  Monospace font, line numbers, color-coded levels      │
└─────────────────────────────────────────────────────────┘
```

### SettingsModal Layout

```
        ┌───────────────────────────────────────┐
        │  R2 Settings                    [X]   │
        ├───────────────────────────────────────┤
        │                                       │
        │  Account ID                           │
        │  ┌─────────────────────────────────┐  │
        │  │ Enter your account ID...        │  │
        │  └─────────────────────────────────┘  │
        │  Found in Cloudflare dashboard → R2   │
        │                                       │
        │  Access Key ID                        │
        │  ┌─────────────────────────────────┐  │
        │  │ Enter your access key...        │  │
        │  └─────────────────────────────────┘  │
        │  Create API token in R2 settings      │
        │                                       │
        │  Secret Access Key                    │
        │  ┌─────────────────────────────────┐  │
        │  │ ••••••••••••••••••••            │  │
        │  └─────────────────────────────────┘  │
        │  Shown only once when creating token  │
        │                                       │
        ├───────────────────────────────────────┤
        │              [Clear]  [💾 Save]       │
        └───────────────────────────────────────┘
```

### LoadingOverlay - Indeterminate

```
    ┌─────────────────────────────────────────────────┐
    │                                                 │
    │                   ⚪ ◐ ◑ ◒                       │
    │              (Animated Spinner)                 │
    │                                                 │
    │          Loading buckets...                     │
    │                                                 │
    └─────────────────────────────────────────────────┘
           Semi-transparent backdrop with blur
```

### LoadingOverlay - Determinate

```
    ┌─────────────────────────────────────────────────┐
    │                                                 │
    │                     75%                         │
    │                                                 │
    │  ┌─────────────────────────────────────────┐   │
    │  │████████████████████████░░░░░░░░░░░░░░░░│   │
    │  └─────────────────────────────────────────┘   │
    │                                                 │
    │     Downloading files... (7/10)                 │
    │                                                 │
    │              [Cancel]                           │
    │                                                 │
    └─────────────────────────────────────────────────┘
```

---

## Color System

### Method Badges (APIResponseTab)

| Method  | Background        | Text            |
|---------|-------------------|-----------------|
| GET     | blue-100/900      | blue-700/300    |
| POST    | green-100/900     | green-700/300   |
| PUT     | orange-100/900    | orange-700/300  |
| DELETE  | red-100/900       | red-700/300     |
| PATCH   | purple-100/900    | purple-700/300  |

### Log Level Badges (ServerLogsTab)

| Level   | Background        | Text            |
|---------|-------------------|-----------------|
| INFO    | blue-100/900      | blue-700/300    |
| WARN    | yellow-100/900    | yellow-700/300  |
| ERROR   | red-100/900       | red-700/300     |
| DEBUG   | gray-100/700      | gray-700/300    |

### Status Codes (APIResponseTab)

| Status      | Color            |
|-------------|------------------|
| 2xx Success | green-600/400    |
| 3xx Redirect| yellow-600/400   |
| 4xx Client  | red-600/400      |
| 5xx Server  | red-600/400      |

---

## Responsive Behavior

### DebugPanel
- **Desktop**: Full width, 264px height
- **Tablet**: Full width, scrollable content
- **Mobile**: Full width, reduced height (180px)

### SettingsModal
- **Desktop**: 448px width (max-w-md), centered
- **Tablet**: Same as desktop
- **Mobile**: Full width with 16px margin

### LoadingOverlay
- **All screens**: Full viewport overlay, centered content

---

## Accessibility Features

### Keyboard Navigation

| Key Combination        | Action                    |
|------------------------|---------------------------|
| Cmd/Ctrl + Shift + D   | Toggle debug panel        |
| Tab                    | Navigate form fields      |
| Enter                  | Submit forms              |
| Escape                 | Close modals              |
| Arrow Keys             | Navigate tabs             |

### ARIA Attributes

```tsx
// Progress bar
<div
  role="progressbar"
  aria-valuenow={50}
  aria-valuemin={0}
  aria-valuemax={100}
/>

// Loading overlay
<div
  aria-live="polite"
  aria-busy={true}
/>

// Buttons
<button
  aria-label="Close debug panel"
  aria-disabled={false}
/>

// Search inputs
<input
  placeholder="Search API logs..."
  aria-label="Search API logs"
/>
```

### Screen Reader Support

- All icons have descriptive labels
- Form fields have associated labels
- Status messages are announced
- Loading states are communicated
- Error messages are accessible

---

## Performance Optimization

### Current Implementation

✅ **Implemented:**
- Auto-scroll only when enabled
- Expandable log entries (not all expanded)
- Line-clamp for long messages
- Conditional rendering (visibility checks)
- Transition animations (200-300ms)

📋 **Recommended Future Optimizations:**
- Virtual scrolling for 1000+ logs (react-window)
- Log rotation (max 1000 entries)
- Search input debouncing (300ms)
- React.memo() for log entries
- useMemo() for filtered results

### Memory Considerations

```typescript
// Current: All logs in memory
apiLogs: APILogEntry[]  // Unlimited growth

// Recommended: Limit and rotate
const MAX_LOGS = 1000;
if (apiLogs.length > MAX_LOGS) {
  apiLogs = apiLogs.slice(-MAX_LOGS);
}
```

---

## Integration Points

### Where to Add API Logging

```typescript
// ✅ API Client
// ✅ File Operations (upload/download)
// ✅ Bucket Operations (list/create/delete)
// ✅ Transfer Queue Operations
// ✅ Error Handlers
```

### Where to Add Server Logging

```typescript
// ✅ Server stdout/stderr
// ✅ Server startup/shutdown
// ✅ Port detection
// ✅ Error events
// ✅ Important operations
```

### Where to Show Loading

```typescript
// ✅ Bucket loading
// ✅ File listing
// ✅ File downloads (with progress)
// ✅ File uploads (with progress)
// ✅ Batch operations
// ✅ Settings save
```

---

## File Dependencies

```
DebugPanel.tsx
├── useUIStore (visibility, activeTab)
├── APIResponseTab.tsx
│   ├── useDebugStore (logs, search, export)
│   ├── lucide-react (icons)
│   ├── date-fns (formatting)
│   └── clsx (conditional classes)
└── ServerLogsTab.tsx
    ├── useDebugStore (logs, search, filter, export)
    ├── lucide-react (icons)
    ├── date-fns (formatting)
    └── clsx (conditional classes)

SettingsModal.tsx
├── useUIStore (visibility)
├── useSettingsStore (credentials, save, clear)
├── @headlessui/react (Dialog, Transition)
├── lucide-react (icons)
└── clsx (conditional classes)

LoadingOverlay.tsx
├── useUIStore (overlay state, progress)
├── @headlessui/react (Transition)
├── lucide-react (Loader2, X icons)
└── clsx (conditional classes)
```

---

## Browser DevTools

### Debug Panel in Chrome DevTools

```javascript
// Access stores in console
window.__ZUSTAND__ = {
  debug: useDebugStore.getState(),
  ui: useUIStore.getState(),
  settings: useSettingsStore.getState(),
};

// Quick actions
useUIStore.getState().toggleDebugPanel();
useDebugStore.getState().clearAPILogs();
useSettingsStore.getState().clearSettings();
```

---

## Summary

This architecture provides:

✅ **Separation of Concerns**: UI, State, and Logic are separated
✅ **Type Safety**: Full TypeScript coverage
✅ **Accessibility**: ARIA attributes and keyboard navigation
✅ **Performance**: Efficient rendering and state updates
✅ **Maintainability**: Clear component structure and documentation
✅ **Extensibility**: Easy to add new features
✅ **Testability**: Components can be tested in isolation
✅ **Developer Experience**: Comprehensive debugging tools

---

**Architecture Complete** ✅
