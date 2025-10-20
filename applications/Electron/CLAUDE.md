# Electron App - Development Guidelines

---

# 🚨 CRITICAL REQUIREMENTS

> [!CAUTION]
> **RULE #1: Import Extensions**
>
> Always `.ts` extensions in imports. Never `.js` or no extension.
> ```typescript
> import { options } from './options.ts';  // ✅ CORRECT
> import { options } from './options.js';  // ❌ WRONG
> ```

> [!CAUTION]
> **RULE #2: Nullish Coalescing**
>
> Always `??` for defaults. Never `||` operator.
> ```typescript
> const port = config.port ?? 3000;  // ✅ CORRECT
> const port = config.port || 3000;  // ❌ WRONG (0 becomes 3000)
> ```

> [!CAUTION]
> **RULE #3: IPC Type Safety**
>
> Always type IPC handlers and avoid `any`:
> ```typescript
> // ✅ CORRECT
> ipcMain.handle('settings:get', (_event, key: string) => {
>   return store.get(key);
> });
>
> // ❌ WRONG
> ipcMain.handle('settings:get', (event, key) => {  // implicit any
>   return store.get(key);
> });
> ```

> [!WARNING]
> **RULE #4: Research Before Implementation**
>
> Always research new technologies. Never rely solely on training data.
>
> Steps: WebSearch → WebFetch docs → Verify sources → Implement

**→ Fix violations immediately without asking.**

---

## 🎯 Project Structure

### Directory Layout
```
applications/Electron/
├── electron/           # Main process (Node.js)
│   ├── main.ts        # Entry point, window management
│   ├── preload.ts     # IPC bridge (context isolation)
│   └── ipc/           # IPC handlers
├── sources/           # Renderer process (React)
│   ├── components/    # React components
│   ├── stores/        # Zustand state management
│   ├── services/      # API client, IPC wrapper
│   └── tools/         # Utilities
└── outputs/           # Build output
    ├── electron/      # Main/preload process build
    └── renderer/      # Renderer process build (HTML, JS, CSS)
```

## 🎯 Naming Conventions

### Files & Directories
- **Components**: PascalCase with `.tsx` extension
  - `Button.tsx`, `FileList.tsx`, `MainLayout.tsx`
- **Stores**: camelCase with `use` prefix
  - `useFileStore.ts`, `useSettingsStore.ts`
- **Services**: camelCase
  - `apiClient.ts`, `cacheManager.ts`
- **Utils**: camelCase
  - `formatters.ts`, `fileUtils.ts`
- **Main Process**: camelCase
  - `main.ts`, `preload.ts`, `serverManager.ts`

### Imports
- **NO file extensions** in imports (Vite handles resolution):
  ```typescript
  import { Button } from './Button';              // ✅ Correct
  import { useFileStore } from '@/stores/useFileStore';  // ✅ Correct
  import { Button } from './Button.tsx';          // ❌ Wrong
  ```

- **Use path aliases** defined in tsconfig.json:
  ```typescript
  import { Button } from '@/components/Button';   // ✅ Correct
  import { Button } from '../../components/Button'; // ❌ Avoid
  ```

- **Type imports** for type-only imports:
  ```typescript
  import type { BrowserWindow } from 'electron';  // ✅ Correct for types
  import { app, BrowserWindow } from 'electron';  // ✅ Correct for values
  ```

### Components
- **Functional components** with TypeScript:
  ```typescript
  interface ButtonProps {
    label: string;
    onClick: () => void;
  }

  export function Button({ label, onClick }: ButtonProps) {
    return <button onClick={onClick}>{label}</button>;
  }
  ```

- **Prefer named exports** over default exports:
  ```typescript
  export function Button() { }  // ✅ Correct
  export default Button;        // ⚠️ Avoid (harder to refactor)
  ```

### State Management (Zustand)
- **Store naming**: `use<Entity>Store`
- **Actions**: verb-first naming
  ```typescript
  export const useFileStore = create<FileStore>((set) => ({
    files: [],
    setFiles: (files) => set({ files }),
    addFile: (file) => set((state) => ({ files: [...state.files, file] })),
    clearFiles: () => set({ files: [] }),
  }));
  ```

## 🎯 Code Style

### React Components
- **Use hooks at top level**:
  ```typescript
  export function FileList() {
    const files = useFileStore(state => state.files);  // ✅ Top level
    const [selected, setSelected] = useState<string[]>([]);

    // Don't put hooks in conditionals or loops
  }
  ```

- **Destructure props**:
  ```typescript
  export function FileRow({ file, onSelect }: FileRowProps) {  // ✅ Correct
    return <div onClick={() => onSelect(file.key)}>...</div>;
  }
  ```

### IPC Communication
- **Main process handlers**:
  ```typescript
  // electron/main.ts
  ipcMain.handle('settings:get', (_event, key: string) => {
    return store.get(key);
  });
  ```

- **Preload bridge**:
  ```typescript
  // electron/preload.ts
  contextBridge.exposeInMainWorld('electronAPI', {
    settings: {
      get: (key: string) => ipcRenderer.invoke('settings:get', key),
    },
  });
  ```

- **Renderer usage**:
  ```typescript
  // src/services/ipc.ts
  export async function getSettings(key: string) {
    return window.electronAPI.settings.get(key);
  }
  ```

### Error Handling
- **Always handle errors**:
  ```typescript
  // ✅ Correct
  try {
    const data = await apiClient.listBuckets();
    setData(data);
  } catch (error) {
    console.error('Failed to list buckets:', error);
    showError('Failed to load buckets');
  }

  // ❌ Wrong
  const data = await apiClient.listBuckets();  // Unhandled promise rejection
  ```

---

## 📚 References

### Electron (Latest: v33.x as of 2025)
- [Electron Documentation](https://www.electronjs.org/docs/latest) - Official docs (use /docs/latest for current version)
- [Electron Main Process](https://www.electronjs.org/docs/latest/tutorial/process-model#the-main-process)
- [Electron Renderer Process](https://www.electronjs.org/docs/latest/tutorial/process-model#the-renderer-process)
- [Context Isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation) - Security best practices
- [IPC (Inter-Process Communication)](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [GitHub Repository](https://github.com/electron/electron) - Source code and issues

### Frontend
- [React Documentation](https://react.dev/) - Official React docs (React 19+)
- [React 19 Release Notes](https://react.dev/blog/2024/12/05/react-19) - Latest features
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - Official TS documentation
- [Vite Documentation](https://vite.dev/) - Build tool (Vite 5/6)
- [Tailwind CSS](https://tailwindcss.com/docs) - Utility-first CSS framework
- [Zustand Documentation](https://zustand.docs.pmnd.rs/) - Bear necessities for state management
- [Zustand GitHub](https://github.com/pmndrs/zustand) - Official repository

### Build & Tools
- [electron-builder](https://www.electron.build/) - Complete packaging solution
- [electron-builder Configuration](https://www.electron.build/configuration.html) - All config options
- [vite-plugin-electron](https://github.com/electron-vite/vite-plugin-electron) - Vite integration
- [electron-store](https://github.com/sindresorhus/electron-store) - Persistent storage (use v8.x)

### Additional Libraries
- [TanStack Table](https://tanstack.com/table/latest) - Headless table library
- [Lucide Icons](https://lucide.dev/) - Icon library
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Code editor (VS Code engine)
- [react-pdf](https://github.com/wojtekmaj/react-pdf) - PDF renderer
- [Allotment](https://github.com/johnwalley/allotment) - Split pane component

---

## 🔧 Known Issues

### Dev Mode
- **vite-plugin-electron bundling issue** with electron module
  - Electron imports get mangled: `electron.app` becomes undefined
  - **Workaround**: Use `pnpm build:electron` then run the app manually
  - **Alternative**: Use separate TypeScript compilation with `tsc` for main process

### Dependencies
- **Node.js v24.4.x**: Has memory allocation bug with pnpm
  - Error: `FATAL ERROR: invalid array length Allocation failed`
  - **Solution**: Use Node.js v24.3.0 or v22 LTS
  - Tracked in: [pnpm/pnpm#9743](https://github.com/pnpm/pnpm/issues/9743)

- **electron-store v10+**: ESM-only, causes `ERR_REQUIRE_ESM` errors
  - Main process uses CommonJS, can't import ESM modules
  - **Solution**: Use electron-store v8.x (CommonJS compatible)
  - Or use dynamic imports with async wrappers (complex)

### Build Issues
- **Code signing**: Requires Apple Developer certificate for macOS
  - Set `"identity": null` in electron-builder.json for development
  - Use `"target": "dir"` to skip DMG creation during dev

- **TypeScript errors**: Many generated components have type issues
  - Build script excludes `tsc` type checking
  - Run `pnpm type-check` separately to see all errors

---

## 🚀 Development Workflow

### Setup
```bash
# Install dependencies (use Node.js v24.3.0 or v22 LTS)
nvm use 24.3
pnpm install

# Approve build scripts for electron and esbuild
pnpm approve-builds
```

### Development
```bash
# Build only (dev mode has issues)
pnpm build:electron

# Run built app
open applications/Electron/release/mac/Cloudflare\ R2\ Browser.app
```

### Production Build
```bash
# Build for all platforms
pnpm build:electron

# Build for specific platform
cd applications/Electron
pnpm build:mac
pnpm build:win
pnpm build:linux
```

### Type Checking
```bash
# Check types without building
pnpm type-check
```
