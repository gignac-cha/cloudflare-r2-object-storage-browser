import { create } from 'zustand';
import { Bucket, LoadingState } from '../types';

interface BucketState {
  // State
  buckets: Bucket[];
  selectedBucket: Bucket | null;
  loadingState: LoadingState;
  error: string | null;

  // Actions
  setBuckets: (buckets: Bucket[]) => void;
  selectBucket: (bucket: Bucket | null) => void;
  setLoadingState: (state: LoadingState) => void;
  setError: (error: string | null) => void;
  loadBuckets: () => Promise<void>;
  refreshBuckets: () => Promise<void>;
  reset: () => void;
}

const initialState = {
  buckets: [],
  selectedBucket: null,
  loadingState: LoadingState.Idle,
  error: null,
};

export const useBucketStore = create<BucketState>((set, get) => ({
  ...initialState,

  setBuckets: (buckets) => set({ buckets }),

  selectBucket: (bucket) => set({ selectedBucket: bucket }),

  setLoadingState: (loadingState) => set({ loadingState }),

  setError: (error) => set({ error, loadingState: LoadingState.Error }),

  loadBuckets: async () => {
    const { loadingState } = get();

    // Prevent concurrent loading
    if (loadingState === LoadingState.Loading) {
      return;
    }

    set({ loadingState: LoadingState.Loading, error: null });

    try {
      // TODO: Replace with actual API call
      const response = await fetch('http://localhost:3000/api/buckets');

      if (!response.ok) {
        throw new Error(`Failed to load buckets: ${response.statusText}`);
      }

      const data = await response.json();
      const buckets = data.data?.buckets || [];

      set({
        buckets,
        loadingState: LoadingState.Success,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load buckets';
      set({
        buckets: [],
        loadingState: LoadingState.Error,
        error: errorMessage,
      });
    }
  },

  refreshBuckets: async () => {
    await get().loadBuckets();
  },

  reset: () => set(initialState),
}));
