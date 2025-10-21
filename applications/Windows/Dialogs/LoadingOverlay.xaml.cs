using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace CloudflareR2Browser.Dialogs
{
    /// <summary>
    /// Loading overlay control for displaying full-screen loading states
    /// </summary>
    public sealed partial class LoadingOverlay : UserControl, INotifyPropertyChanged
    {
        private bool _isVisible;
        private string _message = string.Empty;
        private string _subMessage = string.Empty;
        private double? _progress;
        private bool _isCancellable;
        private ObservableCollection<string> _details = new();

        public event PropertyChangedEventHandler? PropertyChanged;
        public event EventHandler? CancelRequested;

        /// <summary>
        /// Gets or sets whether the overlay is visible
        /// </summary>
        public bool IsVisible
        {
            get => _isVisible;
            set
            {
                if (_isVisible != value)
                {
                    _isVisible = value;
                    OnPropertyChanged();
                }
            }
        }

        /// <summary>
        /// Gets or sets the main loading message
        /// </summary>
        public string Message
        {
            get => _message;
            set
            {
                if (_message != value)
                {
                    _message = value;
                    OnPropertyChanged();
                }
            }
        }

        /// <summary>
        /// Gets or sets the sub-message (additional details)
        /// </summary>
        public string SubMessage
        {
            get => _subMessage;
            set
            {
                if (_subMessage != value)
                {
                    _subMessage = value;
                    OnPropertyChanged();
                    OnPropertyChanged(nameof(HasSubMessage));
                }
            }
        }

        /// <summary>
        /// Gets whether there is a sub-message
        /// </summary>
        public bool HasSubMessage => !string.IsNullOrWhiteSpace(SubMessage);

        /// <summary>
        /// Gets or sets the progress value (0-100). Null for indeterminate progress.
        /// </summary>
        public double? Progress
        {
            get => _progress;
            set
            {
                if (_progress != value)
                {
                    _progress = value;
                    OnPropertyChanged();
                    OnPropertyChanged(nameof(ProgressValue));
                    OnPropertyChanged(nameof(ProgressText));
                    OnPropertyChanged(nameof(ShowIndeterminate));
                    OnPropertyChanged(nameof(ShowDeterminate));
                }
            }
        }

        /// <summary>
        /// Gets the progress value for binding (never null).
        /// </summary>
        public double ProgressValue => Progress ?? 0.0;

        /// <summary>
        /// Gets the formatted progress text
        /// </summary>
        public string ProgressText
        {
            get
            {
                if (_progress.HasValue)
                {
                    return $"{_progress.Value:F0}%";
                }
                return string.Empty;
            }
        }

        /// <summary>
        /// Gets whether to show indeterminate progress
        /// </summary>
        public bool ShowIndeterminate => !_progress.HasValue;

        /// <summary>
        /// Gets whether to show determinate progress
        /// </summary>
        public bool ShowDeterminate => _progress.HasValue;

        /// <summary>
        /// Gets or sets whether the operation can be cancelled
        /// </summary>
        public bool IsCancellable
        {
            get => _isCancellable;
            set
            {
                if (_isCancellable != value)
                {
                    _isCancellable = value;
                    OnPropertyChanged();
                }
            }
        }

        /// <summary>
        /// Gets or sets additional details to display
        /// </summary>
        public ObservableCollection<string> Details
        {
            get => _details;
            set
            {
                if (_details != value)
                {
                    _details = value;
                    OnPropertyChanged();
                    OnPropertyChanged(nameof(HasDetails));
                }
            }
        }

        /// <summary>
        /// Gets whether there are details to display
        /// </summary>
        public bool HasDetails => Details != null && Details.Count > 0;

        public LoadingOverlay()
        {
            this.InitializeComponent();
            _message = "Loading...";
            _subMessage = string.Empty;
            _progress = null;
            _isCancellable = false;
            _isVisible = false;
            _details = new ObservableCollection<string>();
        }

        /// <summary>
        /// Show the loading overlay with a message
        /// </summary>
        public void Show(string message, bool isCancellable = false)
        {
            Message = message;
            SubMessage = string.Empty;
            Progress = null;
            IsCancellable = isCancellable;
            Details.Clear();
            IsVisible = true;
        }

        /// <summary>
        /// Show the loading overlay with message and sub-message
        /// </summary>
        public void Show(string message, string subMessage, bool isCancellable = false)
        {
            Message = message;
            SubMessage = subMessage;
            Progress = null;
            IsCancellable = isCancellable;
            Details.Clear();
            IsVisible = true;
        }

        /// <summary>
        /// Show the loading overlay with progress
        /// </summary>
        public void ShowWithProgress(string message, double progress, bool isCancellable = false)
        {
            Message = message;
            SubMessage = string.Empty;
            Progress = progress;
            IsCancellable = isCancellable;
            Details.Clear();
            IsVisible = true;
        }

        /// <summary>
        /// Update the progress value
        /// </summary>
        public void UpdateProgress(double progress)
        {
            Progress = Math.Clamp(progress, 0, 100);
        }

        /// <summary>
        /// Update the message
        /// </summary>
        public void UpdateMessage(string message)
        {
            Message = message;
        }

        /// <summary>
        /// Update the sub-message
        /// </summary>
        public void UpdateSubMessage(string subMessage)
        {
            SubMessage = subMessage;
        }

        /// <summary>
        /// Add a detail line
        /// </summary>
        public void AddDetail(string detail)
        {
            Details.Add(detail);
            OnPropertyChanged(nameof(HasDetails));
        }

        /// <summary>
        /// Clear all details
        /// </summary>
        public void ClearDetails()
        {
            Details.Clear();
            OnPropertyChanged(nameof(HasDetails));
        }

        /// <summary>
        /// Hide the loading overlay
        /// </summary>
        public void Hide()
        {
            IsVisible = false;
        }

        /// <summary>
        /// Handle cancel button click
        /// </summary>
        private void CancelButton_Click(object sender, RoutedEventArgs e)
        {
            CancelRequested?.Invoke(this, EventArgs.Empty);
        }

        private void OnPropertyChanged([CallerMemberName] string? propertyName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }
    }

    /// <summary>
    /// Extension methods for LoadingOverlay
    /// </summary>
    public static class LoadingOverlayExtensions
    {
        /// <summary>
        /// Show loading overlay on a grid or panel
        /// </summary>
        public static LoadingOverlay ShowLoading(this Panel parent, string message, bool isCancellable = false)
        {
            var overlay = new LoadingOverlay();
            parent.Children.Add(overlay);
            overlay.Show(message, isCancellable);
            return overlay;
        }

        /// <summary>
        /// Show loading overlay with progress on a grid or panel
        /// </summary>
        public static LoadingOverlay ShowLoadingWithProgress(this Panel parent, string message, double progress, bool isCancellable = false)
        {
            var overlay = new LoadingOverlay();
            parent.Children.Add(overlay);
            overlay.ShowWithProgress(message, progress, isCancellable);
            return overlay;
        }

        /// <summary>
        /// Hide and remove loading overlay from parent
        /// </summary>
        public static void HideLoading(this LoadingOverlay overlay, Panel parent)
        {
            if (overlay != null && parent.Children.Contains(overlay))
            {
                overlay.Hide();
                parent.Children.Remove(overlay);
            }
        }
    }
}
