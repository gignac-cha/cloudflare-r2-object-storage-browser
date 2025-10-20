import React from 'react';
import { Transition } from '@headlessui/react';
import { useUIStore } from '../../../../../src/stores/useUIStore';
import { Loader2, X } from 'lucide-react';
import clsx from 'clsx';

/**
 * LoadingOverlay Component
 *
 * Full-screen modal overlay with loading indicator:
 * - Determinate progress (with progress bar)
 * - Indeterminate progress (spinner)
 * - Loading message (up to 5 lines)
 * - Optional cancel button
 * - Blocks user interaction
 * - Blur background effect
 *
 * Controlled via UIStore:
 * - showLoadingOverlay() to display
 * - updateLoadingOverlay() to update progress/message
 * - hideLoadingOverlay() to hide
 *
 * @example
 * ```tsx
 * // Show with indeterminate progress
 * showLoadingOverlay('Loading buckets...');
 *
 * // Show with determinate progress
 * showLoadingOverlay('Downloading files...', { progress: 50 });
 *
 * // Show with cancel button
 * showLoadingOverlay('Processing...', {
 *   isCancellable: true,
 *   onCancel: () => { /* cancel logic *\/ }
 * });
 * ```
 */
export const LoadingOverlay: React.FC = () => {
  const { loadingOverlay, hideLoadingOverlay } = useUIStore();
  const { isVisible, message, progress, isCancellable, onCancel } = loadingOverlay;

  // Determine if progress is determinate (has a number) or indeterminate (undefined)
  const isDeterminate = progress !== undefined;
  const progressPercentage = isDeterminate ? Math.min(Math.max(progress, 0), 100) : 0;

  /**
   * Handle cancel action
   */
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    hideLoadingOverlay();
  };

  return (
    <Transition
      show={isVisible}
      as={React.Fragment}
      enter="ease-out duration-200"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="ease-in duration-150"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        aria-live="polite"
        aria-busy={isVisible}
      >
        {/* Backdrop with blur */}
        <div
          className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
          aria-hidden="true"
        />

        {/* Loading card */}
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 max-w-md w-full mx-4">
            {/* Progress indicator */}
            <div className="flex flex-col items-center">
              {isDeterminate ? (
                /* Determinate progress bar */
                <div className="w-full">
                  <div className="mb-2 flex items-center justify-center">
                    <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                      {progressPercentage}%
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 transition-all duration-300 ease-out"
                      style={{ width: `${progressPercentage}%` }}
                      role="progressbar"
                      aria-valuenow={progressPercentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                </div>
              ) : (
                /* Indeterminate spinner */
                <div className="mb-4">
                  <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin" />
                </div>
              )}

              {/* Loading message */}
              {message && (
                <div
                  className={clsx(
                    'text-center text-gray-900 dark:text-gray-100',
                    isDeterminate ? 'mt-4' : 'mt-0'
                  )}
                >
                  <p className="text-sm leading-relaxed line-clamp-5">{message}</p>
                </div>
              )}

              {/* Cancel button */}
              {isCancellable && onCancel && (
                <button
                  onClick={handleCancel}
                  className="mt-6 flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              )}
            </div>
          </div>
        </Transition.Child>
      </div>
    </Transition>
  );
};
