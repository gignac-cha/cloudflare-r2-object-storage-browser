import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useUIStore } from '../../stores/uiStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { X, Save, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import clsx from 'clsx';

/**
 * Form Field Component
 *
 * Reusable form field with label and help text
 */
const FormField: React.FC<{
  label: string;
  helpText: string;
  children: React.ReactNode;
}> = ({ label, helpText, children }) => {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
        {label}
      </label>
      {children}
      <p className="text-xs text-gray-500 dark:text-gray-400">{helpText}</p>
    </div>
  );
};

/**
 * SettingsModal Component
 *
 * Modal dialog for configuring R2 credentials with:
 * - Account ID input field
 * - Access Key ID input field
 * - Secret Access Key secure input field
 * - Save button with validation
 * - Clear button to reset credentials
 * - Success/error feedback
 * - Help text for each field
 *
 * @example
 * ```tsx
 * <SettingsModal />
 * ```
 */
export const SettingsModal: React.FC = () => {
  const { isSettingsVisible, hideSettings } = useUIStore();
  const { credentials, saveCredentials, clearCredentials } = useSettingsStore();

  // Form state
  const [formData, setFormData] = useState({
    accountId: '',
    accessKeyId: '',
    secretAccessKey: '',
  });

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Load existing credentials when modal opens
  useEffect(() => {
    if (isSettingsVisible) {
      setFormData({
        accountId: credentials?.accountId ?? '',
        accessKeyId: credentials?.accessKeyId ?? '',
        secretAccessKey: credentials?.secretAccessKey ?? '',
      });
      setSaveStatus(null);
      setErrorMessage('');
    }
  }, [isSettingsVisible, credentials]);

  /**
   * Handle form input changes
   */
  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
    setSaveStatus(null);
    setErrorMessage('');
  };

  /**
   * Validate form data
   */
  const validateForm = (): string | null => {
    if (!formData.accountId.trim()) {
      return 'Account ID is required';
    }
    if (!formData.accessKeyId.trim()) {
      return 'Access Key ID is required';
    }
    if (!formData.secretAccessKey.trim()) {
      return 'Secret Access Key is required';
    }
    return null;
  };

  /**
   * Handle save credentials
   */
  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      setSaveStatus('error');
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);
    setErrorMessage('');

    try {
      await saveCredentials({
        accountId: formData.accountId.trim(),
        accessKeyId: formData.accessKeyId.trim(),
        secretAccessKey: formData.secretAccessKey.trim(),
      });

      setSaveStatus('success');

      // Close modal after 1 second
      setTimeout(() => {
        hideSettings();
      }, 1000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to save credentials'
      );
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle clear credentials
   */
  const handleClear = async () => {
    if (!confirm('Are you sure you want to clear all credentials?')) {
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);
    setErrorMessage('');

    try {
      await clearCredentials();
      setFormData({
        accountId: '',
        accessKeyId: '',
        secretAccessKey: '',
      });
      setSaveStatus('success');
    } catch (error) {
      console.error('Failed to clear settings:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to clear credentials'
      );
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle close modal
   */
  const handleClose = () => {
    if (!isSaving) {
      hideSettings();
    }
  };

  return (
    <Transition show={isSettingsVisible} as={React.Fragment}>
      <Dialog onClose={handleClose} className="relative z-50">
        {/* Backdrop */}
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 dark:bg-black/60" aria-hidden="true" />
        </Transition.Child>

        {/* Modal */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  R2 Settings
                </Dialog.Title>
                <button
                  onClick={handleClose}
                  disabled={isSaving}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  aria-label="Close settings"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-4 space-y-4">
                {/* Status message */}
                {saveStatus && (
                  <div
                    className={clsx(
                      'flex items-center gap-2 p-3 rounded text-sm',
                      saveStatus === 'success'
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                    )}
                  >
                    {saveStatus === 'success' ? (
                      <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    )}
                    <span>
                      {saveStatus === 'success'
                        ? 'Credentials saved successfully!'
                        : errorMessage || 'An error occurred'}
                    </span>
                  </div>
                )}

                {/* Account ID */}
                <FormField
                  label="Account ID"
                  helpText="Found in Cloudflare dashboard → R2"
                >
                  <input
                    type="text"
                    value={formData.accountId}
                    onChange={handleInputChange('accountId')}
                    disabled={isSaving}
                    placeholder="Enter your Cloudflare account ID"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50"
                  />
                </FormField>

                {/* Access Key ID */}
                <FormField
                  label="Access Key ID"
                  helpText="Create API token in R2 settings"
                >
                  <input
                    type="text"
                    value={formData.accessKeyId}
                    onChange={handleInputChange('accessKeyId')}
                    disabled={isSaving}
                    placeholder="Enter your access key ID"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50"
                  />
                </FormField>

                {/* Secret Access Key */}
                <FormField
                  label="Secret Access Key"
                  helpText="Shown only once when creating the API token"
                >
                  <input
                    type="password"
                    value={formData.secretAccessKey}
                    onChange={handleInputChange('secretAccessKey')}
                    disabled={isSaving}
                    placeholder="Enter your secret access key"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50"
                  />
                </FormField>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleClear}
                  disabled={isSaving || !credentials}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear
                </button>

                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};
