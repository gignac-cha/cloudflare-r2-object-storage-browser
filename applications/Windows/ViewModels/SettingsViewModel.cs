#nullable enable

using System;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Windows.Input;
using CloudflareR2Browser.Helpers;
using CloudflareR2Browser.Services;
using Microsoft.Extensions.Logging;

namespace CloudflareR2Browser.ViewModels;

/// <summary>
/// ViewModel for the settings dialog.
/// Manages R2 credentials configuration.
/// </summary>
public sealed class SettingsViewModel : ObservableObject
{
    private readonly ILogger<SettingsViewModel> _logger;
    private readonly SettingsManager _settingsManager;
    private readonly NodeServerManager _serverManager;

    private string _accountId = "";
    private string _accessKeyId = "";
    private string _secretAccessKey = "";
    private string? _errorMessage;
    private bool _isSaving;
    private bool _isTesting;

    /// <summary>
    /// Event raised when credentials are saved successfully.
    /// </summary>
    public event EventHandler? CredentialsSaved;

    /// <summary>
    /// Initializes a new instance of the SettingsViewModel class.
    /// </summary>
    /// <param name="logger">Logger instance.</param>
    /// <param name="settingsManager">Settings manager.</param>
    /// <param name="serverManager">Server manager for health checks.</param>
    public SettingsViewModel(
        ILogger<SettingsViewModel> logger,
        SettingsManager settingsManager,
        NodeServerManager serverManager)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _settingsManager = settingsManager ?? throw new ArgumentNullException(nameof(settingsManager));
        _serverManager = serverManager ?? throw new ArgumentNullException(nameof(serverManager));

        // Initialize commands
        SaveCommand = new AsyncRelayCommand(SaveCredentialsAsync, CanSave);
        ClearCommand = new AsyncRelayCommand(ClearCredentialsAsync);
        TestConnectionCommand = new AsyncRelayCommand(TestConnectionAsync, CanTestConnection);

        // Load existing credentials
        LoadExistingCredentials();

        _logger.LogInformation("SettingsViewModel initialized");
    }

    // ========================================================================
    // Properties
    // ========================================================================

    /// <summary>
    /// Gets or sets the Cloudflare account ID.
    /// </summary>
    public string AccountId
    {
        get => _accountId;
        set
        {
            if (SetProperty(ref _accountId, value))
            {
                ValidateAccountId();
                (SaveCommand as AsyncRelayCommand)?.RaiseCanExecuteChanged();
                (TestConnectionCommand as AsyncRelayCommand)?.RaiseCanExecuteChanged();
            }
        }
    }

    /// <summary>
    /// Gets or sets the R2 access key ID.
    /// </summary>
    public string AccessKeyId
    {
        get => _accessKeyId;
        set
        {
            if (SetProperty(ref _accessKeyId, value))
            {
                ClearError();
                (SaveCommand as AsyncRelayCommand)?.RaiseCanExecuteChanged();
                (TestConnectionCommand as AsyncRelayCommand)?.RaiseCanExecuteChanged();
            }
        }
    }

    /// <summary>
    /// Gets or sets the R2 secret access key.
    /// </summary>
    public string SecretAccessKey
    {
        get => _secretAccessKey;
        set
        {
            if (SetProperty(ref _secretAccessKey, value))
            {
                ClearError();
                (SaveCommand as AsyncRelayCommand)?.RaiseCanExecuteChanged();
                (TestConnectionCommand as AsyncRelayCommand)?.RaiseCanExecuteChanged();
            }
        }
    }

    /// <summary>
    /// Gets whether credentials have been saved.
    /// </summary>
    public bool HasCredentials => _settingsManager.HasCredentials;

    /// <summary>
    /// Gets or sets the error message.
    /// </summary>
    public string? ErrorMessage
    {
        get => _errorMessage;
        private set => SetProperty(ref _errorMessage, value);
    }

    /// <summary>
    /// Gets whether the save operation is in progress.
    /// </summary>
    public bool IsSaving
    {
        get => _isSaving;
        private set => SetProperty(ref _isSaving, value);
    }

    /// <summary>
    /// Gets whether the connection test is in progress.
    /// </summary>
    public bool IsTesting
    {
        get => _isTesting;
        private set => SetProperty(ref _isTesting, value);
    }

    /// <summary>
    /// Gets whether any operation is in progress.
    /// </summary>
    public bool IsBusy => IsSaving || IsTesting;

    // ========================================================================
    // Commands
    // ========================================================================

    /// <summary>
    /// Command to save credentials.
    /// </summary>
    public ICommand SaveCommand { get; }

    /// <summary>
    /// Command to clear credentials.
    /// </summary>
    public ICommand ClearCommand { get; }

    /// <summary>
    /// Command to test the connection.
    /// </summary>
    public ICommand TestConnectionCommand { get; }

    // ========================================================================
    // Public Methods
    // ========================================================================

    /// <summary>
    /// Loads existing credentials from settings.
    /// </summary>
    public void LoadExistingCredentials()
    {
        if (_settingsManager.HasCredentials)
        {
            AccountId = _settingsManager.AccountId ?? "";
            AccessKeyId = _settingsManager.AccessKeyId ?? "";
            SecretAccessKey = _settingsManager.SecretAccessKey ?? "";

            _logger.LogDebug("Loaded existing credentials");
        }
    }

    // ========================================================================
    // Private Methods
    // ========================================================================

    /// <summary>
    /// Saves the credentials to secure storage.
    /// </summary>
    private async Task SaveCredentialsAsync()
    {
        _logger.LogInformation("Saving credentials...");
        IsSaving = true;
        ClearError();

        try
        {
            // Validate inputs
            if (!ValidateInputs())
            {
                return;
            }

            // Save to secure storage
            _settingsManager.SaveCredentials(
                AccountId.Trim(),
                AccessKeyId.Trim(),
                SecretAccessKey.Trim());

            _logger.LogInformation("Credentials saved successfully");

            // Raise event
            CredentialsSaved?.Invoke(this, EventArgs.Empty);

            // Update HasCredentials property
            OnPropertyChanged(nameof(HasCredentials));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save credentials");
            ErrorMessage = $"Failed to save credentials: {ex.Message}";
        }
        finally
        {
            IsSaving = false;
        }

        await Task.CompletedTask;
    }

    /// <summary>
    /// Determines whether credentials can be saved.
    /// </summary>
    private bool CanSave()
    {
        return !IsBusy &&
               !string.IsNullOrWhiteSpace(AccountId) &&
               !string.IsNullOrWhiteSpace(AccessKeyId) &&
               !string.IsNullOrWhiteSpace(SecretAccessKey) &&
               IsValidAccountId(AccountId);
    }

    /// <summary>
    /// Clears the saved credentials.
    /// </summary>
    private async Task ClearCredentialsAsync()
    {
        _logger.LogInformation("Clearing credentials...");

        try
        {
            _settingsManager.ClearCredentials();

            AccountId = "";
            AccessKeyId = "";
            SecretAccessKey = "";
            ClearError();

            OnPropertyChanged(nameof(HasCredentials));

            _logger.LogInformation("Credentials cleared successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to clear credentials");
            ErrorMessage = $"Failed to clear credentials: {ex.Message}";
        }

        await Task.CompletedTask;
    }

    /// <summary>
    /// Tests the connection to R2 with the current credentials.
    /// </summary>
    private async Task TestConnectionAsync()
    {
        _logger.LogInformation("Testing connection...");
        IsTesting = true;
        ClearError();

        try
        {
            // Validate inputs first
            if (!ValidateInputs())
            {
                return;
            }

            // Check if server is running
            if (!_serverManager.IsRunning || !_serverManager.ServerPort.HasValue)
            {
                ErrorMessage = "Server is not running. Please wait for the server to start.";
                _logger.LogWarning("Cannot test connection: server not running");
                return;
            }

            // Test by calling the /health endpoint with credentials
            using var httpClient = new HttpClient();
            var healthUrl = $"http://127.0.0.1:{_serverManager.ServerPort}/health";

            // Add credentials as headers for validation
            httpClient.DefaultRequestHeaders.Add("X-Account-Id", AccountId.Trim());
            httpClient.DefaultRequestHeaders.Add("X-Access-Key-Id", AccessKeyId.Trim());
            httpClient.DefaultRequestHeaders.Add("X-Secret-Access-Key", SecretAccessKey.Trim());

            var response = await httpClient.GetAsync(healthUrl);

            if (response.IsSuccessStatusCode)
            {
                ErrorMessage = null;
                _logger.LogInformation("Connection test successful");

                // Optionally save credentials after successful test
                // await SaveCredentialsAsync();
            }
            else
            {
                ErrorMessage = "Connection test failed. Please verify your credentials.";
                _logger.LogWarning("Connection test failed: {StatusCode}", response.StatusCode);
            }
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Connection test failed");
            ErrorMessage = $"Connection test failed: {ex.Message}";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error testing connection");
            ErrorMessage = $"Unexpected error: {ex.Message}";
        }
        finally
        {
            IsTesting = false;
        }
    }

    /// <summary>
    /// Determines whether connection can be tested.
    /// </summary>
    private bool CanTestConnection()
    {
        return !IsBusy &&
               !string.IsNullOrWhiteSpace(AccountId) &&
               !string.IsNullOrWhiteSpace(AccessKeyId) &&
               !string.IsNullOrWhiteSpace(SecretAccessKey) &&
               IsValidAccountId(AccountId) &&
               _serverManager.IsRunning;
    }

    /// <summary>
    /// Validates all input fields.
    /// </summary>
    private bool ValidateInputs()
    {
        // Validate Account ID
        if (string.IsNullOrWhiteSpace(AccountId))
        {
            ErrorMessage = "Account ID is required.";
            return false;
        }

        if (!IsValidAccountId(AccountId))
        {
            ErrorMessage = "Account ID must be a 32-character hexadecimal string.";
            return false;
        }

        // Validate Access Key ID
        if (string.IsNullOrWhiteSpace(AccessKeyId))
        {
            ErrorMessage = "Access Key ID is required.";
            return false;
        }

        if (AccessKeyId.Trim().Length < 16)
        {
            ErrorMessage = "Access Key ID appears to be invalid (too short).";
            return false;
        }

        // Validate Secret Access Key
        if (string.IsNullOrWhiteSpace(SecretAccessKey))
        {
            ErrorMessage = "Secret Access Key is required.";
            return false;
        }

        if (SecretAccessKey.Trim().Length < 32)
        {
            ErrorMessage = "Secret Access Key appears to be invalid (too short).";
            return false;
        }

        return true;
    }

    /// <summary>
    /// Validates the Account ID format.
    /// </summary>
    private void ValidateAccountId()
    {
        if (string.IsNullOrWhiteSpace(AccountId))
        {
            ClearError();
            return;
        }

        if (!IsValidAccountId(AccountId))
        {
            ErrorMessage = "Account ID must be a 32-character hexadecimal string.";
        }
        else
        {
            ClearError();
        }
    }

    /// <summary>
    /// Checks if the account ID is valid (32 hex characters).
    /// </summary>
    private static bool IsValidAccountId(string accountId)
    {
        if (string.IsNullOrWhiteSpace(accountId))
        {
            return false;
        }

        var trimmed = accountId.Trim();
        return trimmed.Length == 32 && Regex.IsMatch(trimmed, "^[0-9a-fA-F]{32}$");
    }

    /// <summary>
    /// Clears the error message.
    /// </summary>
    private void ClearError()
    {
        ErrorMessage = null;
    }
}
