using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Media.Imaging;
using System;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;
using Windows.Storage;
using Windows.Storage.Pickers;

namespace CloudflareR2Browser.Dialogs
{
    /// <summary>
    /// Preview dialog for displaying file contents
    /// </summary>
    public sealed partial class PreviewDialog : ContentDialog
    {
        private string _fileUrl;
        private string _fileName;
        private string _fileInfo;
        private string _unsupportedMessage;
        private string _contentType;

        public string FileName
        {
            get => _fileName;
            private set => _fileName = value;
        }

        public string FileInfo
        {
            get => _fileInfo;
            private set => _fileInfo = value;
        }

        public string UnsupportedMessage
        {
            get => _unsupportedMessage;
            private set => _unsupportedMessage = value;
        }

        public PreviewDialog(string fileUrl, string fileName, string contentType = null, long? fileSize = null)
        {
            this.InitializeComponent();

            _fileUrl = fileUrl;
            _fileName = fileName;
            _contentType = contentType ?? GetContentTypeFromFileName(fileName);
            _fileInfo = FormatFileInfo(fileSize, _contentType);
            _unsupportedMessage = $"Preview is not available for {Path.GetExtension(fileName)} files.";

            // Load the preview
            LoadPreviewAsync();
        }

        /// <summary>
        /// Load and display the file preview
        /// </summary>
        private async void LoadPreviewAsync()
        {
            try
            {
                // Show loading state
                ShowPanel(LoadingPanel);

                // Determine preview type based on content type
                var fileExtension = Path.GetExtension(_fileName).ToLowerInvariant();

                if (IsImageFile(fileExtension))
                {
                    await LoadImagePreviewAsync();
                }
                else if (IsTextFile(fileExtension))
                {
                    await LoadTextPreviewAsync();
                }
                else if (IsPdfFile(fileExtension))
                {
                    await LoadPdfPreviewAsync();
                }
                else
                {
                    ShowUnsupportedPreview();
                }
            }
            catch (Exception ex)
            {
                ShowError($"Failed to load preview: {ex.Message}");
            }
        }

        /// <summary>
        /// Load image preview
        /// </summary>
        private async Task LoadImagePreviewAsync()
        {
            try
            {
                var bitmap = new BitmapImage();
                bitmap.UriSource = new Uri(_fileUrl);
                ImagePreview.Source = bitmap;

                ShowPanel(ImageScrollViewer);
            }
            catch (Exception ex)
            {
                ShowError($"Failed to load image: {ex.Message}");
            }
        }

        /// <summary>
        /// Load text file preview
        /// </summary>
        private async Task LoadTextPreviewAsync()
        {
            try
            {
                using var httpClient = new HttpClient();
                var content = await httpClient.GetStringAsync(_fileUrl);

                // Limit preview to first 50KB to avoid performance issues
                const int maxPreviewLength = 50000;
                if (content.Length > maxPreviewLength)
                {
                    content = content.Substring(0, maxPreviewLength) +
                             "\n\n... (File truncated for preview. Download to view full content)";
                }

                TextPreview.Text = content;
                ShowPanel(TextPreviewBorder);
            }
            catch (Exception ex)
            {
                ShowError($"Failed to load text preview: {ex.Message}");
            }
        }

        /// <summary>
        /// Load PDF preview using WebView2
        /// </summary>
        private async Task LoadPdfPreviewAsync()
        {
            try
            {
                // Check if WebView2 is available
                // Note: This is a simplified implementation. In production, you would:
                // 1. Check WebView2 runtime installation
                // 2. Initialize WebView2 control programmatically
                // 3. Navigate to the PDF URL

                // For now, show the unsupported panel with a message
                _unsupportedMessage = "PDF preview requires WebView2 Runtime. Please download the file to view it.";
                ShowUnsupportedPreview();

                /* Production implementation would look like:

                var webView = new Microsoft.UI.Xaml.Controls.WebView2();
                await webView.EnsureCoreWebView2Async();
                webView.Source = new Uri(_fileUrl);
                WebViewContainer.Child = webView;
                ShowPanel(WebViewBorder);

                */
            }
            catch (Exception ex)
            {
                WebViewUnavailablePanel.Visibility = Visibility.Visible;
                ShowPanel(WebViewBorder);
            }
        }

        /// <summary>
        /// Show unsupported file type message
        /// </summary>
        private void ShowUnsupportedPreview()
        {
            ShowPanel(UnsupportedPanel);
        }

        /// <summary>
        /// Show error message
        /// </summary>
        private void ShowError(string message)
        {
            ErrorMessage.Text = message;
            ShowPanel(ErrorPanel);
        }

        /// <summary>
        /// Show specific panel and hide others
        /// </summary>
        private void ShowPanel(FrameworkElement panelToShow)
        {
            LoadingPanel.Visibility = Visibility.Collapsed;
            ImageScrollViewer.Visibility = Visibility.Collapsed;
            TextPreviewBorder.Visibility = Visibility.Collapsed;
            WebViewBorder.Visibility = Visibility.Collapsed;
            UnsupportedPanel.Visibility = Visibility.Collapsed;
            ErrorPanel.Visibility = Visibility.Collapsed;

            panelToShow.Visibility = Visibility.Visible;
        }

        /// <summary>
        /// Check if file is an image
        /// </summary>
        private bool IsImageFile(string extension)
        {
            var imageExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg", ".ico" };
            return Array.Exists(imageExtensions, ext => ext.Equals(extension, StringComparison.OrdinalIgnoreCase));
        }

        /// <summary>
        /// Check if file is a text file
        /// </summary>
        private bool IsTextFile(string extension)
        {
            var textExtensions = new[] {
                ".txt", ".log", ".md", ".json", ".xml", ".yaml", ".yml",
                ".cs", ".js", ".ts", ".html", ".css", ".scss", ".jsx", ".tsx",
                ".py", ".java", ".cpp", ".c", ".h", ".sh", ".bat", ".ps1",
                ".sql", ".ini", ".config", ".csv"
            };
            return Array.Exists(textExtensions, ext => ext.Equals(extension, StringComparison.OrdinalIgnoreCase));
        }

        /// <summary>
        /// Check if file is a PDF
        /// </summary>
        private bool IsPdfFile(string extension)
        {
            return extension.Equals(".pdf", StringComparison.OrdinalIgnoreCase);
        }

        /// <summary>
        /// Get content type from file name
        /// </summary>
        private string GetContentTypeFromFileName(string fileName)
        {
            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            return extension switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".gif" => "image/gif",
                ".pdf" => "application/pdf",
                ".txt" => "text/plain",
                ".json" => "application/json",
                ".xml" => "application/xml",
                ".html" => "text/html",
                ".css" => "text/css",
                _ => "application/octet-stream"
            };
        }

        /// <summary>
        /// Format file information string
        /// </summary>
        private string FormatFileInfo(long? fileSize, string contentType)
        {
            var parts = new System.Collections.Generic.List<string>();

            if (fileSize.HasValue)
            {
                parts.Add(FormatFileSize(fileSize.Value));
            }

            if (!string.IsNullOrEmpty(contentType))
            {
                parts.Add(contentType);
            }

            return string.Join(" • ", parts);
        }

        /// <summary>
        /// Format file size in human-readable format
        /// </summary>
        private string FormatFileSize(long bytes)
        {
            string[] sizes = { "B", "KB", "MB", "GB", "TB" };
            double len = bytes;
            int order = 0;

            while (len >= 1024 && order < sizes.Length - 1)
            {
                order++;
                len = len / 1024;
            }

            return $"{len:0.##} {sizes[order]}";
        }

        /// <summary>
        /// Handle download button click
        /// </summary>
        private async void DownloadButton_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                var savePicker = new FileSavePicker();

                // Initialize with window
                var hwnd = WinRT.Interop.WindowNative.GetWindowHandle(App.MainWindow);
                WinRT.Interop.InitializeWithWindow.Initialize(savePicker, hwnd);

                savePicker.SuggestedFileName = _fileName;
                var extension = Path.GetExtension(_fileName);
                savePicker.FileTypeChoices.Add("File", new[] { extension });

                var file = await savePicker.PickSaveFileAsync();
                if (file != null)
                {
                    // Download and save file
                    using var httpClient = new HttpClient();
                    var data = await httpClient.GetByteArrayAsync(_fileUrl);
                    await FileIO.WriteBytesAsync(file, data);

                    // Show success message
                    var dialog = new ContentDialog
                    {
                        Title = "Download Complete",
                        Content = $"File saved to: {file.Path}",
                        CloseButtonText = "OK",
                        XamlRoot = this.XamlRoot
                    };
                    await dialog.ShowAsync();
                }
            }
            catch (Exception ex)
            {
                var dialog = new ContentDialog
                {
                    Title = "Download Failed",
                    Content = $"Failed to download file: {ex.Message}",
                    CloseButtonText = "OK",
                    XamlRoot = this.XamlRoot
                };
                await dialog.ShowAsync();
            }
        }

        /// <summary>
        /// Handle retry button click
        /// </summary>
        private void RetryButton_Click(object sender, RoutedEventArgs e)
        {
            LoadPreviewAsync();
        }
    }
}
