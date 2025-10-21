#nullable enable

using System;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace CloudflareR2Browser.Services;

/// <summary>
/// Manages file download cache for the application.
/// Provides local storage for downloaded objects with folder hierarchy preservation.
/// </summary>
public sealed class CacheManager
{
    private readonly ILogger<CacheManager> _logger;
    private readonly string _cacheDirectory;
    private readonly SemaphoreSlim _cacheLock;

    /// <summary>
    /// Gets the cache directory path.
    /// </summary>
    public string CacheDirectory => _cacheDirectory;

    public CacheManager(ILogger<CacheManager> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _cacheLock = new SemaphoreSlim(1, 1);

        // Cache directory: %LOCALAPPDATA%\CloudflareR2Browser\cache
        var localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        _cacheDirectory = Path.Combine(localAppData, "CloudflareR2Browser", "cache");

        EnsureCacheDirectoryExists();
    }

    /// <summary>
    /// Saves data to the cache with the specified key.
    /// The key can include folder structure (e.g., "bucket/folder/file.txt").
    /// </summary>
    public async Task SaveToCacheAsync(byte[] data, string key, CancellationToken cancellationToken = default)
    {
        if (data == null)
        {
            throw new ArgumentNullException(nameof(data));
        }

        if (string.IsNullOrWhiteSpace(key))
        {
            throw new ArgumentException("Cache key cannot be empty", nameof(key));
        }

        var sanitizedKey = SanitizeKey(key);
        var filePath = GetCacheFilePath(sanitizedKey);

        await _cacheLock.WaitAsync(cancellationToken);
        try
        {
            // Ensure directory exists
            var directory = Path.GetDirectoryName(filePath);
            if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
            {
                Directory.CreateDirectory(directory);
            }

            // Write data to cache file
            await File.WriteAllBytesAsync(filePath, data, cancellationToken);

            _logger.LogDebug("Saved {Bytes} bytes to cache: {Key}", data.Length, key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save data to cache: {Key}", key);
            throw;
        }
        finally
        {
            _cacheLock.Release();
        }
    }

    /// <summary>
    /// Saves a stream to the cache with the specified key.
    /// </summary>
    public async Task SaveToCacheAsync(Stream stream, string key, CancellationToken cancellationToken = default)
    {
        if (stream == null)
        {
            throw new ArgumentNullException(nameof(stream));
        }

        if (string.IsNullOrWhiteSpace(key))
        {
            throw new ArgumentException("Cache key cannot be empty", nameof(key));
        }

        var sanitizedKey = SanitizeKey(key);
        var filePath = GetCacheFilePath(sanitizedKey);

        await _cacheLock.WaitAsync(cancellationToken);
        try
        {
            // Ensure directory exists
            var directory = Path.GetDirectoryName(filePath);
            if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
            {
                Directory.CreateDirectory(directory);
            }

            // Write stream to cache file
            using var fileStream = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None, 81920, useAsync: true);
            await stream.CopyToAsync(fileStream, cancellationToken);

            _logger.LogDebug("Saved stream to cache: {Key}", key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save stream to cache: {Key}", key);
            throw;
        }
        finally
        {
            _cacheLock.Release();
        }
    }

    /// <summary>
    /// Checks if a file with the specified key exists in the cache.
    /// </summary>
    public bool IsCached(string key)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            return false;
        }

        var sanitizedKey = SanitizeKey(key);
        var filePath = GetCacheFilePath(sanitizedKey);

        return File.Exists(filePath);
    }

    /// <summary>
    /// Gets the file URL (file:// scheme) for a cached file.
    /// Returns null if the file is not cached.
    /// </summary>
    public string? GetCachedFileUrl(string key)
    {
        if (!IsCached(key))
        {
            return null;
        }

        var sanitizedKey = SanitizeKey(key);
        var filePath = GetCacheFilePath(sanitizedKey);

        return new Uri(filePath).AbsoluteUri;
    }

    /// <summary>
    /// Gets the file path for a cached file.
    /// Returns null if the file is not cached.
    /// </summary>
    public string? GetCachedFilePath(string key)
    {
        if (!IsCached(key))
        {
            return null;
        }

        var sanitizedKey = SanitizeKey(key);
        return GetCacheFilePath(sanitizedKey);
    }

    /// <summary>
    /// Moves a cached file to a destination path.
    /// </summary>
    public async Task MoveCachedFileAsync(string key, string destinationPath, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            throw new ArgumentException("Cache key cannot be empty", nameof(key));
        }

        if (string.IsNullOrWhiteSpace(destinationPath))
        {
            throw new ArgumentException("Destination path cannot be empty", nameof(destinationPath));
        }

        var sanitizedKey = SanitizeKey(key);
        var cachedPath = GetCacheFilePath(sanitizedKey);

        if (!File.Exists(cachedPath))
        {
            throw new FileNotFoundException($"Cached file not found: {key}");
        }

        await _cacheLock.WaitAsync(cancellationToken);
        try
        {
            // Ensure destination directory exists
            var destDirectory = Path.GetDirectoryName(destinationPath);
            if (!string.IsNullOrEmpty(destDirectory) && !Directory.Exists(destDirectory))
            {
                Directory.CreateDirectory(destDirectory);
            }

            // Move file
            File.Move(cachedPath, destinationPath, overwrite: true);

            _logger.LogInformation("Moved cached file '{Key}' to '{Destination}'", key, destinationPath);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to move cached file: {Key}", key);
            throw;
        }
        finally
        {
            _cacheLock.Release();
        }
    }

    /// <summary>
    /// Copies a cached file to a destination path.
    /// </summary>
    public async Task CopyCachedFileAsync(string key, string destinationPath, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            throw new ArgumentException("Cache key cannot be empty", nameof(key));
        }

        if (string.IsNullOrWhiteSpace(destinationPath))
        {
            throw new ArgumentException("Destination path cannot be empty", nameof(destinationPath));
        }

        var sanitizedKey = SanitizeKey(key);
        var cachedPath = GetCacheFilePath(sanitizedKey);

        if (!File.Exists(cachedPath))
        {
            throw new FileNotFoundException($"Cached file not found: {key}");
        }

        await _cacheLock.WaitAsync(cancellationToken);
        try
        {
            // Ensure destination directory exists
            var destDirectory = Path.GetDirectoryName(destinationPath);
            if (!string.IsNullOrEmpty(destDirectory) && !Directory.Exists(destDirectory))
            {
                Directory.CreateDirectory(destDirectory);
            }

            // Copy file
            File.Copy(cachedPath, destinationPath, overwrite: true);

            _logger.LogInformation("Copied cached file '{Key}' to '{Destination}'", key, destinationPath);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to copy cached file: {Key}", key);
            throw;
        }
        finally
        {
            _cacheLock.Release();
        }
    }

    /// <summary>
    /// Removes a file from the cache.
    /// </summary>
    public async Task<bool> RemoveCachedFileAsync(string key, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            return false;
        }

        var sanitizedKey = SanitizeKey(key);
        var filePath = GetCacheFilePath(sanitizedKey);

        if (!File.Exists(filePath))
        {
            return false;
        }

        await _cacheLock.WaitAsync(cancellationToken);
        try
        {
            File.Delete(filePath);
            _logger.LogDebug("Removed cached file: {Key}", key);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to remove cached file: {Key}", key);
            return false;
        }
        finally
        {
            _cacheLock.Release();
        }
    }

    /// <summary>
    /// Clears the entire cache directory.
    /// </summary>
    public async Task ClearCacheAsync(CancellationToken cancellationToken = default)
    {
        await _cacheLock.WaitAsync(cancellationToken);
        try
        {
            if (Directory.Exists(_cacheDirectory))
            {
                Directory.Delete(_cacheDirectory, recursive: true);
                _logger.LogInformation("Cache cleared");
            }

            EnsureCacheDirectoryExists();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to clear cache");
            throw;
        }
        finally
        {
            _cacheLock.Release();
        }
    }

    /// <summary>
    /// Gets the total size of the cache in bytes.
    /// </summary>
    public long GetCacheSize()
    {
        try
        {
            if (!Directory.Exists(_cacheDirectory))
            {
                return 0;
            }

            var directoryInfo = new DirectoryInfo(_cacheDirectory);
            return directoryInfo.EnumerateFiles("*", SearchOption.AllDirectories)
                .Sum(file => file.Length);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to calculate cache size");
            return 0;
        }
    }

    /// <summary>
    /// Gets the total number of files in the cache.
    /// </summary>
    public int GetCacheFileCount()
    {
        try
        {
            if (!Directory.Exists(_cacheDirectory))
            {
                return 0;
            }

            var directoryInfo = new DirectoryInfo(_cacheDirectory);
            return directoryInfo.EnumerateFiles("*", SearchOption.AllDirectories).Count();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to count cache files");
            return 0;
        }
    }

    /// <summary>
    /// Removes cached files older than the specified age.
    /// </summary>
    public async Task<int> RemoveOldCachedFilesAsync(TimeSpan maxAge, CancellationToken cancellationToken = default)
    {
        var cutoffTime = DateTime.UtcNow - maxAge;
        var removedCount = 0;

        await _cacheLock.WaitAsync(cancellationToken);
        try
        {
            if (!Directory.Exists(_cacheDirectory))
            {
                return 0;
            }

            var directoryInfo = new DirectoryInfo(_cacheDirectory);
            var oldFiles = directoryInfo.EnumerateFiles("*", SearchOption.AllDirectories)
                .Where(file => file.LastWriteTimeUtc < cutoffTime)
                .ToList();

            foreach (var file in oldFiles)
            {
                try
                {
                    file.Delete();
                    removedCount++;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to delete old cache file: {Path}", file.FullName);
                }
            }

            if (removedCount > 0)
            {
                _logger.LogInformation("Removed {Count} old cache files (older than {Age})", removedCount, maxAge);
            }

            return removedCount;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to remove old cache files");
            return removedCount;
        }
        finally
        {
            _cacheLock.Release();
        }
    }

    /// <summary>
    /// Ensures the cache directory exists.
    /// </summary>
    private void EnsureCacheDirectoryExists()
    {
        if (!Directory.Exists(_cacheDirectory))
        {
            Directory.CreateDirectory(_cacheDirectory);
            _logger.LogInformation("Created cache directory: {Directory}", _cacheDirectory);
        }
    }

    /// <summary>
    /// Sanitizes a cache key to be a valid file path.
    /// Replaces invalid characters and normalizes path separators.
    /// </summary>
    private static string SanitizeKey(string key)
    {
        // Replace forward slashes with backslashes (Windows path separator)
        var sanitized = key.Replace('/', Path.DirectorySeparatorChar);

        // Remove or replace invalid filename characters
        var invalidChars = Path.GetInvalidFileNameChars();
        foreach (var c in invalidChars)
        {
            if (c != Path.DirectorySeparatorChar)
            {
                sanitized = sanitized.Replace(c, '_');
            }
        }

        return sanitized;
    }

    /// <summary>
    /// Gets the full file path for a cache key.
    /// </summary>
    private string GetCacheFilePath(string sanitizedKey)
    {
        return Path.Combine(_cacheDirectory, sanitizedKey);
    }
}
