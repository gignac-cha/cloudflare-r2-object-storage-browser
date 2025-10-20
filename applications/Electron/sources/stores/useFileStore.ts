import { create } from 'zustand';
import { R2Object, LoadingState } from '../types';

interface FileState {
  // State
  objects: R2Object[];
  folders: string[];
  selectedObjects: Set<string>;
  currentPath: string;
  navigationHistory: string[];
  historyIndex: number;
  sortColumn: 'name' | 'size' | 'lastModified' | 'type';
  sortOrder: 'asc' | 'desc';
  loadingState: LoadingState;
  error: string | null;

  // Computed
  canGoBack: () => boolean;
  canGoForward: () => boolean;
  canGoUp: () => boolean;

  // Actions
  setObjects: (objects: R2Object[]) => void;
  setFolders: (folders: string[]) => void;
  toggleSelection: (key: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setCurrentPath: (path: string) => void;
  navigateToPath: (path: string, addToHistory?: boolean) => void;
  goBack: () => void;
  goForward: () => void;
  goUp: () => void;
  setSortColumn: (column: FileState['sortColumn']) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  toggleSortOrder: () => void;
  setLoadingState: (state: LoadingState) => void;
  setError: (error: string | null) => void;
  loadObjects: (bucketName: string, prefix?: string) => Promise<void>;
  reset: () => void;
}

const initialState = {
  objects: [],
  folders: [],
  selectedObjects: new Set<string>(),
  currentPath: '',
  navigationHistory: [''],
  historyIndex: 0,
  sortColumn: 'name' as const,
  sortOrder: 'asc' as const,
  loadingState: LoadingState.Idle,
  error: null,
};

export const useFileStore = create<FileState>((set, get) => ({
  ...initialState,

  // Computed
  canGoBack: () => {
    const { historyIndex } = get();
    return historyIndex > 0;
  },

  canGoForward: () => {
    const { historyIndex, navigationHistory } = get();
    return historyIndex < navigationHistory.length - 1;
  },

  canGoUp: () => {
    const { currentPath } = get();
    return currentPath.length > 0;
  },

  // Actions
  setObjects: (objects) => set({ objects }),

  setFolders: (folders) => set({ folders }),

  toggleSelection: (key) =>
    set((state) => {
      const newSelection = new Set(state.selectedObjects);
      if (newSelection.has(key)) {
        newSelection.delete(key);
      } else {
        newSelection.add(key);
      }
      return { selectedObjects: newSelection };
    }),

  selectAll: () =>
    set((state) => {
      const allKeys = [...state.objects.map((obj) => obj.key), ...state.folders];
      return { selectedObjects: new Set(allKeys) };
    }),

  clearSelection: () => set({ selectedObjects: new Set() }),

  setCurrentPath: (path) => set({ currentPath: path }),

  navigateToPath: (path, addToHistory = true) => {
    const { historyIndex, navigationHistory } = get();

    if (addToHistory) {
      // Remove forward history when navigating to a new path
      const newHistory = navigationHistory.slice(0, historyIndex + 1);
      newHistory.push(path);

      set({
        currentPath: path,
        navigationHistory: newHistory,
        historyIndex: newHistory.length - 1,
        selectedObjects: new Set(),
      });
    } else {
      set({
        currentPath: path,
        selectedObjects: new Set(),
      });
    }
  },

  goBack: () => {
    const { historyIndex, navigationHistory, canGoBack } = get();

    if (canGoBack()) {
      const newIndex = historyIndex - 1;
      set({
        currentPath: navigationHistory[newIndex],
        historyIndex: newIndex,
        selectedObjects: new Set(),
      });
    }
  },

  goForward: () => {
    const { historyIndex, navigationHistory, canGoForward } = get();

    if (canGoForward()) {
      const newIndex = historyIndex + 1;
      set({
        currentPath: navigationHistory[newIndex],
        historyIndex: newIndex,
        selectedObjects: new Set(),
      });
    }
  },

  goUp: () => {
    const { currentPath, canGoUp } = get();

    if (canGoUp()) {
      const parts = currentPath.split('/').filter(Boolean);
      parts.pop();
      const parentPath = parts.join('/');

      get().navigateToPath(parentPath);
    }
  },

  setSortColumn: (column) => set({ sortColumn: column }),

  setSortOrder: (order) => set({ sortOrder: order }),

  toggleSortOrder: () =>
    set((state) => ({
      sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc',
    })),

  setLoadingState: (loadingState) => set({ loadingState }),

  setError: (error) => set({ error, loadingState: LoadingState.Error }),

  loadObjects: async (bucketName: string, prefix?: string) => {
    const { loadingState } = get();

    // Prevent concurrent loading
    if (loadingState === LoadingState.Loading) {
      return;
    }

    set({ loadingState: LoadingState.Loading, error: null });

    try {
      const url = new URL(`http://localhost:3000/api/buckets/${bucketName}/objects`);
      if (prefix) {
        url.searchParams.set('prefix', prefix);
      }
      url.searchParams.set('delimiter', '/');

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Failed to load objects: ${response.statusText}`);
      }

      const data = await response.json();
      const objects = data.data?.objects || [];
      const folders = data.data?.pagination?.commonPrefixes || [];

      set({
        objects,
        folders,
        loadingState: LoadingState.Success,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load objects';
      set({
        objects: [],
        folders: [],
        loadingState: LoadingState.Error,
        error: errorMessage,
      });
    }
  },

  reset: () => set({ ...initialState, selectedObjects: new Set() }),
}));
