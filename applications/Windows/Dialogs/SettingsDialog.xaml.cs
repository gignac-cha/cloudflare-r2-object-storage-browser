using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using CloudflareR2Browser.Helpers;
using CloudflareR2Browser.ViewModels;
using System;
using System.Threading.Tasks;

namespace CloudflareR2Browser.Dialogs
{
    /// <summary>
    /// Settings dialog for configuring Cloudflare R2 credentials
    /// </summary>
    public sealed partial class SettingsDialog : ContentDialog
    {
        public SettingsViewModel ViewModel { get; }

        public SettingsDialog(SettingsViewModel viewModel)
        {
            this.InitializeComponent();
            ViewModel = viewModel ?? throw new ArgumentNullException(nameof(viewModel));

            // Load existing credentials
            LoadCredentials();
        }

        /// <summary>
        /// Load existing credentials from settings
        /// </summary>
        private void LoadCredentials()
        {
            try
            {
                ViewModel.LoadExistingCredentials();
            }
            catch (Exception ex)
            {
                ShowError($"Failed to load credentials: {ex.Message}");
            }
        }

        /// <summary>
        /// Handle primary button (Save) click
        /// </summary>
        private async void ContentDialog_PrimaryButtonClick(ContentDialog sender, ContentDialogButtonClickEventArgs args)
        {
            // Get deferral to perform async operations
            var deferral = args.GetDeferral();

            try
            {
                // Hide any previous errors
                ErrorInfoBar.IsOpen = false;

                // Validate input
                if (!ValidateInput())
                {
                    args.Cancel = true;
                    deferral.Complete();
                    return;
                }

                // Save credentials using the SaveCommand
                if (ViewModel.SaveCommand is AsyncRelayCommand saveCommand)
                {
                    await saveCommand.ExecuteAsync();

                    // Check if there's an error message
                    if (!string.IsNullOrEmpty(ViewModel.ErrorMessage))
                    {
                        ShowError(ViewModel.ErrorMessage);
                        args.Cancel = true;
                    }
                }
                else
                {
                    ShowError("Failed to save credentials. Please check your input and try again.");
                    args.Cancel = true;
                }
            }
            catch (Exception ex)
            {
                ShowError($"Error saving credentials: {ex.Message}");
                args.Cancel = true;
            }
            finally
            {
                deferral.Complete();
            }
        }

        /// <summary>
        /// Handle secondary button (Cancel) click
        /// </summary>
        private void ContentDialog_SecondaryButtonClick(ContentDialog sender, ContentDialogButtonClickEventArgs args)
        {
            // No action needed - dialog will close
        }

        /// <summary>
        /// Handle Clear All button click
        /// </summary>
        private async void ClearAllButton_Click(object sender, RoutedEventArgs e)
        {
            var confirmDialog = new ContentDialog
            {
                Title = "Clear All Credentials?",
                Content = "This will remove all stored R2 credentials from your system. This action cannot be undone.",
                PrimaryButtonText = "Clear",
                SecondaryButtonText = "Cancel",
                DefaultButton = ContentDialogButton.Secondary,
                XamlRoot = this.XamlRoot
            };

            var result = await confirmDialog.ShowAsync();

            if (result == ContentDialogResult.Primary)
            {
                try
                {
                    // Clear credentials using the ClearCommand
                    if (ViewModel.ClearCommand is AsyncRelayCommand clearCommand)
                    {
                        await clearCommand.ExecuteAsync();
                    }

                    // Clear the form fields
                    AccountIdTextBox.Text = string.Empty;
                    AccessKeyIdTextBox.Text = string.Empty;
                    SecretAccessKeyPasswordBox.Password = string.Empty;

                    var successDialog = new ContentDialog
                    {
                        Title = "Credentials Cleared",
                        Content = "All credentials have been successfully removed.",
                        CloseButtonText = "OK",
                        XamlRoot = this.XamlRoot
                    };
                    await successDialog.ShowAsync();
                }
                catch (Exception ex)
                {
                    ShowError($"Failed to clear credentials: {ex.Message}");
                }
            }
        }

        /// <summary>
        /// Validate user input
        /// </summary>
        private bool ValidateInput()
        {
            // Check if Account ID is provided
            if (string.IsNullOrWhiteSpace(ViewModel.AccountId))
            {
                ShowError("Account ID is required.");
                AccountIdTextBox.Focus(FocusState.Programmatic);
                return false;
            }

            // Check if Access Key ID is provided
            if (string.IsNullOrWhiteSpace(ViewModel.AccessKeyId))
            {
                ShowError("Access Key ID is required.");
                AccessKeyIdTextBox.Focus(FocusState.Programmatic);
                return false;
            }

            // Check if Secret Access Key is provided
            if (string.IsNullOrWhiteSpace(ViewModel.SecretAccessKey))
            {
                ShowError("Secret Access Key is required.");
                SecretAccessKeyPasswordBox.Focus(FocusState.Programmatic);
                return false;
            }

            // Validate Account ID format (basic validation)
            if (ViewModel.AccountId.Length < 16 || ViewModel.AccountId.Length > 64)
            {
                ShowError("Account ID appears to be invalid. Please check and try again.");
                AccountIdTextBox.Focus(FocusState.Programmatic);
                return false;
            }

            // Validate Access Key ID format (basic validation)
            if (ViewModel.AccessKeyId.Length < 16)
            {
                ShowError("Access Key ID appears to be invalid. Please check and try again.");
                AccessKeyIdTextBox.Focus(FocusState.Programmatic);
                return false;
            }

            // Validate Secret Access Key format (basic validation)
            if (ViewModel.SecretAccessKey.Length < 32)
            {
                ShowError("Secret Access Key appears to be invalid. Please check and try again.");
                SecretAccessKeyPasswordBox.Focus(FocusState.Programmatic);
                return false;
            }

            return true;
        }

        /// <summary>
        /// Show error message in InfoBar
        /// </summary>
        private void ShowError(string message)
        {
            ErrorInfoBar.Message = message;
            ErrorInfoBar.IsOpen = true;
        }
    }
}
