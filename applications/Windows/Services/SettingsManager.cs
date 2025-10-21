#nullable enable

using System;
using Microsoft.Extensions.Logging;
using Windows.Security.Credentials;

namespace CloudflareR2Browser.Services;

/// <summary>
/// Manages R2 credentials using Windows Credential Vault.
/// Provides secure storage and retrieval of sensitive credentials.
/// </summary>
public sealed class SettingsManager
{
    private const string ResourceName = "CloudflareR2Browser";
    private const string AccountIdKey = "AccountId";
    private const string AccessKeyIdKey = "AccessKeyId";
    private const string SecretAccessKeyKey = "SecretAccessKey";

    private readonly ILogger<SettingsManager> _logger;
    private readonly PasswordVault _vault;

    private string? _accountId;
    private string? _accessKeyId;
    private string? _secretAccessKey;

    /// <summary>
    /// Gets whether credentials have been saved.
    /// </summary>
    public bool HasCredentials => !string.IsNullOrEmpty(_accountId) &&
                                   !string.IsNullOrEmpty(_accessKeyId) &&
                                   !string.IsNullOrEmpty(_secretAccessKey);

    /// <summary>
    /// Gets the Cloudflare account ID.
    /// </summary>
    public string? AccountId => _accountId;

    /// <summary>
    /// Gets the R2 access key ID.
    /// </summary>
    public string? AccessKeyId => _accessKeyId;

    /// <summary>
    /// Gets the R2 secret access key.
    /// </summary>
    public string? SecretAccessKey => _secretAccessKey;

    /// <summary>
    /// Gets the R2 endpoint URL computed from the account ID.
    /// </summary>
    public string? R2EndpointUrl
    {
        get
        {
            if (string.IsNullOrEmpty(_accountId))
            {
                return null;
            }

            return $"https://{_accountId}.r2.cloudflarestorage.com";
        }
    }

    public SettingsManager(ILogger<SettingsManager> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _vault = new PasswordVault();
    }

    /// <summary>
    /// Saves R2 credentials to the Windows Credential Vault.
    /// </summary>
    /// <param name="accountId">Cloudflare account ID.</param>
    /// <param name="accessKeyId">R2 access key ID.</param>
    /// <param name="secretAccessKey">R2 secret access key.</param>
    public void SaveCredentials(string accountId, string accessKeyId, string secretAccessKey)
    {
        if (string.IsNullOrWhiteSpace(accountId))
        {
            throw new ArgumentException("Account ID cannot be empty", nameof(accountId));
        }

        if (string.IsNullOrWhiteSpace(accessKeyId))
        {
            throw new ArgumentException("Access Key ID cannot be empty", nameof(accessKeyId));
        }

        if (string.IsNullOrWhiteSpace(secretAccessKey))
        {
            throw new ArgumentException("Secret Access Key cannot be empty", nameof(secretAccessKey));
        }

        try
        {
            // Clear existing credentials first
            ClearCredentials();

            // Save account ID
            var accountIdCredential = new PasswordCredential(ResourceName, AccountIdKey, accountId);
            _vault.Add(accountIdCredential);

            // Save access key ID
            var accessKeyCredential = new PasswordCredential(ResourceName, AccessKeyIdKey, accessKeyId);
            _vault.Add(accessKeyCredential);

            // Save secret access key
            var secretKeyCredential = new PasswordCredential(ResourceName, SecretAccessKeyKey, secretAccessKey);
            _vault.Add(secretKeyCredential);

            // Update in-memory cache
            _accountId = accountId;
            _accessKeyId = accessKeyId;
            _secretAccessKey = secretAccessKey;

            _logger.LogInformation("Credentials saved successfully for account {AccountId}", accountId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save credentials to Credential Vault");
            throw new InvalidOperationException("Failed to save credentials. Ensure Windows Credential Vault is accessible.", ex);
        }
    }

    /// <summary>
    /// Loads R2 credentials from the Windows Credential Vault.
    /// </summary>
    /// <returns>True if credentials were loaded successfully, false otherwise.</returns>
    public bool LoadCredentials()
    {
        try
        {
            // Try to retrieve all credentials
            var credentials = _vault.FindAllByResource(ResourceName);

            if (credentials.Count == 0)
            {
                _logger.LogInformation("No saved credentials found");
                return false;
            }

            // Extract credentials
            foreach (var credential in credentials)
            {
                // Retrieve the actual password (Windows requires this call to decrypt)
                credential.RetrievePassword();

                switch (credential.UserName)
                {
                    case AccountIdKey:
                        _accountId = credential.Password;
                        break;
                    case AccessKeyIdKey:
                        _accessKeyId = credential.Password;
                        break;
                    case SecretAccessKeyKey:
                        _secretAccessKey = credential.Password;
                        break;
                }
            }

            // Validate we have all required credentials
            if (HasCredentials)
            {
                _logger.LogInformation("Credentials loaded successfully for account {AccountId}", _accountId);
                return true;
            }

            _logger.LogWarning("Incomplete credentials found in vault");
            return false;
        }
        catch (Exception ex) when (ex.HResult == unchecked((int)0x80070490)) // Element not found
        {
            _logger.LogInformation("No saved credentials found");
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to load credentials from Credential Vault");
            return false;
        }
    }

    /// <summary>
    /// Clears all saved credentials from the Windows Credential Vault.
    /// </summary>
    public void ClearCredentials()
    {
        try
        {
            var credentials = _vault.FindAllByResource(ResourceName);

            foreach (var credential in credentials)
            {
                _vault.Remove(credential);
            }

            // Clear in-memory cache
            _accountId = null;
            _accessKeyId = null;
            _secretAccessKey = null;

            _logger.LogInformation("Credentials cleared successfully");
        }
        catch (Exception ex) when (ex.HResult == unchecked((int)0x80070490)) // Element not found
        {
            // No credentials to clear, that's fine
            _logger.LogDebug("No credentials to clear");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to clear credentials from Credential Vault");
            throw new InvalidOperationException("Failed to clear credentials", ex);
        }
    }

    /// <summary>
    /// Validates that the current credentials are set.
    /// </summary>
    /// <returns>True if credentials are valid, false otherwise.</returns>
    public bool ValidateCredentials()
    {
        if (!HasCredentials)
        {
            _logger.LogWarning("Credentials validation failed: missing credentials");
            return false;
        }

        // Basic format validation
        if (_accountId!.Length != 32 || !IsHexString(_accountId))
        {
            _logger.LogWarning("Credentials validation failed: invalid account ID format");
            return false;
        }

        if (_accessKeyId!.Length < 16)
        {
            _logger.LogWarning("Credentials validation failed: access key ID too short");
            return false;
        }

        if (_secretAccessKey!.Length < 32)
        {
            _logger.LogWarning("Credentials validation failed: secret access key too short");
            return false;
        }

        _logger.LogDebug("Credentials validation passed");
        return true;
    }

    /// <summary>
    /// Checks if a string is a valid hexadecimal string.
    /// </summary>
    private static bool IsHexString(string value)
    {
        foreach (var c in value)
        {
            if (!((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')))
            {
                return false;
            }
        }

        return true;
    }

    /// <summary>
    /// Updates only the account ID (useful for switching accounts).
    /// </summary>
    public void UpdateAccountId(string accountId)
    {
        if (string.IsNullOrWhiteSpace(accountId))
        {
            throw new ArgumentException("Account ID cannot be empty", nameof(accountId));
        }

        if (string.IsNullOrEmpty(_accessKeyId) || string.IsNullOrEmpty(_secretAccessKey))
        {
            throw new InvalidOperationException("Cannot update account ID without access keys");
        }

        SaveCredentials(accountId, _accessKeyId, _secretAccessKey);
    }

    /// <summary>
    /// Gets a summary of the current credentials (for display purposes).
    /// Does not expose sensitive information.
    /// </summary>
    public string GetCredentialsSummary()
    {
        if (!HasCredentials)
        {
            return "No credentials saved";
        }

        var maskedAccessKey = _accessKeyId!.Length > 8
            ? $"{_accessKeyId[..4]}...{_accessKeyId[^4..]}"
            : "****";

        return $"Account: {_accountId}\nAccess Key: {maskedAccessKey}";
    }
}
