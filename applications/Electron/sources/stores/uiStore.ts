import { create } from 'zustand';

interface UIState {
  isTransferQueueVisible: boolean;
  isDebugPanelVisible: boolean;
  isSettingsVisible: boolean;
  isQuickLookVisible: boolean;
  quickLookFileURL: string | null;
  quickLookFileName: string | null;
  quickLookFileType: string | null;
  showLoadingOverlay: boolean;
  loadingMessage: string;
  loadingProgress: number | null;
  loadingCancellable: boolean;
}

interface UIActions {
  toggleTransferQueue: () => void;
  toggleDebugPanel: () => void;
  showSettings: () => void;
  hideSettings: () => void;
  showQuickLook: (fileURL: string, fileName: string, fileType: string) => void;
  hideQuickLook: () => void;
  showLoading: (message: string, progress?: number, cancellable?: boolean) => void;
  hideLoading: () => void;
  updateLoadingProgress: (progress: number) => void;
}

export const useUIStore = create<UIState & UIActions>((set) => ({
  // State
  isTransferQueueVisible: false,
  isDebugPanelVisible: false,
  isSettingsVisible: false,
  isQuickLookVisible: false,
  quickLookFileURL: null,
  quickLookFileName: null,
  quickLookFileType: null,
  showLoadingOverlay: false,
  loadingMessage: '',
  loadingProgress: null,
  loadingCancellable: false,

  // Actions
  toggleTransferQueue: () => {
    set((state) => ({ isTransferQueueVisible: !state.isTransferQueueVisible }));
  },

  toggleDebugPanel: () => {
    set((state) => ({ isDebugPanelVisible: !state.isDebugPanelVisible }));
  },

  showSettings: () => {
    set({ isSettingsVisible: true });
  },

  hideSettings: () => {
    set({ isSettingsVisible: false });
  },

  showQuickLook: (fileURL, fileName, fileType) => {
    set({
      isQuickLookVisible: true,
      quickLookFileURL: fileURL,
      quickLookFileName: fileName,
      quickLookFileType: fileType,
    });
  },

  hideQuickLook: () => {
    set({
      isQuickLookVisible: false,
      quickLookFileURL: null,
      quickLookFileName: null,
      quickLookFileType: null,
    });
  },

  showLoading: (message, progress, cancellable = false) => {
    set({
      showLoadingOverlay: true,
      loadingMessage: message,
      loadingProgress: progress ?? null,
      loadingCancellable: cancellable,
    });
  },

  hideLoading: () => {
    set({
      showLoadingOverlay: false,
      loadingMessage: '',
      loadingProgress: null,
      loadingCancellable: false,
    });
  },

  updateLoadingProgress: (progress) => {
    set({ loadingProgress: progress });
  },
}));
