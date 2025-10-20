import { create } from 'zustand';
import { Credentials } from '../types';

interface SettingsState {
  credentials: Credentials | null;
  hasCredentials: boolean;
}

interface SettingsActions {
  loadCredentials: () => Promise<void>;
  saveCredentials: (credentials: Credentials) => Promise<void>;
  clearCredentials: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState & SettingsActions>((set) => ({
  // State
  credentials: null,
  hasCredentials: false,

  // Actions
  loadCredentials: async () => {
    try {
      // Try to get credentials object first (new format)
      let credentials = await window.electronAPI.settings.get('credentials');

      // If not found, try loading from root level (MacOS format)
      if (!credentials) {
        const accountId = await window.electronAPI.settings.get('accountId');
        const accessKeyId = await window.electronAPI.settings.get('accessKeyId');
        const secretAccessKey = await window.electronAPI.settings.get('secretAccessKey');
        const endpoint = await window.electronAPI.settings.get('endpoint');

        if (accountId && accessKeyId && secretAccessKey) {
          credentials = { accountId, accessKeyId, secretAccessKey, endpoint };
        }
      }

      set({
        credentials,
        hasCredentials: !!(credentials?.accountId && credentials?.accessKeyId && credentials?.secretAccessKey),
      });
    } catch (error) {
      console.error('Failed to load credentials:', error);
      set({ credentials: null, hasCredentials: false });
    }
  },

  saveCredentials: async (credentials) => {
    try {
      const credentialsWithTimestamp = {
        ...credentials,
        endpoint: `https://${credentials.accountId}.r2.cloudflarestorage.com`,
        lastUpdated: new Date().toISOString(),
      };

      // Save to root level (MacOS compatible format)
      await window.electronAPI.settings.set('accountId', credentialsWithTimestamp.accountId);
      await window.electronAPI.settings.set('accessKeyId', credentialsWithTimestamp.accessKeyId);
      await window.electronAPI.settings.set('secretAccessKey', credentialsWithTimestamp.secretAccessKey);
      await window.electronAPI.settings.set('endpoint', credentialsWithTimestamp.endpoint);
      await window.electronAPI.settings.set('lastUpdated', credentialsWithTimestamp.lastUpdated);

      set({ credentials: credentialsWithTimestamp, hasCredentials: true });
    } catch (error) {
      console.error('Failed to save credentials:', error);
      throw error;
    }
  },

  clearCredentials: async () => {
    try {
      // Clear all credential fields (MacOS compatible format)
      await window.electronAPI.settings.delete('accountId');
      await window.electronAPI.settings.delete('accessKeyId');
      await window.electronAPI.settings.delete('secretAccessKey');
      await window.electronAPI.settings.delete('endpoint');
      await window.electronAPI.settings.delete('lastUpdated');

      // Also try to clear the old format just in case
      await window.electronAPI.settings.delete('credentials');

      set({ credentials: null, hasCredentials: false });
    } catch (error) {
      console.error('Failed to clear credentials:', error);
      throw error;
    }
  },
}));
