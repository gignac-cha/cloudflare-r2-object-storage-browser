#nullable enable

using System;
using System.Collections.Generic;
using System.Linq;
using CloudflareR2Browser.Models;
using Microsoft.Extensions.Logging;

namespace CloudflareR2Browser.Services;

/// <summary>
/// LRU (Least Recently Used) cache for folder listing results.
/// Provides fast access to recently accessed folder contents with automatic eviction.
/// </summary>
public sealed class FolderCache
{
    private readonly ILogger<FolderCache> _logger;
    private readonly int _maxEntries;
    private readonly TimeSpan _freshTtl;
    private readonly TimeSpan _staleTtl;
    private readonly Dictionary<CacheKey, CacheEntry> _cache;
    private readonly LinkedList<CacheKey> _lruList;
    private readonly object _lock = new();

    /// <summary>
    /// Initializes a new instance of the FolderCache.
    /// </summary>
    /// <param name="logger">Logger instance.</param>
    /// <param name="maxEntries">Maximum number of entries (default: 100).</param>
    /// <param name="freshTtl">Time before entry becomes stale (default: 2 minutes).</param>
    /// <param name="staleTtl">Time before entry expires (default: 5 minutes).</param>
    public FolderCache(
        ILogger<FolderCache> logger,
        int maxEntries = 100,
        TimeSpan? freshTtl = null,
        TimeSpan? staleTtl = null)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _maxEntries = maxEntries > 0 ? maxEntries : throw new ArgumentException("Max entries must be positive", nameof(maxEntries));
        _freshTtl = freshTtl ?? TimeSpan.FromMinutes(2);
        _staleTtl = staleTtl ?? TimeSpan.FromMinutes(5);

        _cache = new Dictionary<CacheKey, CacheEntry>();
        _lruList = new LinkedList<CacheKey>();

        _logger.LogInformation("FolderCache initialized (max: {MaxEntries}, fresh: {Fresh}s, stale: {Stale}s)",
            _maxEntries, _freshTtl.TotalSeconds, _staleTtl.TotalSeconds);
    }

    /// <summary>
    /// Gets a cached folder listing if it exists and is not expired.
    /// </summary>
    /// <param name="bucketName">Bucket name.</param>
    /// <param name="prefix">Folder prefix.</param>
    /// <returns>Cached result or null if not found/expired.</returns>
    public CachedFolderResult? Get(string bucketName, string prefix = "")
    {
        if (string.IsNullOrEmpty(bucketName))
        {
            throw new ArgumentException("Bucket name cannot be empty", nameof(bucketName));
        }

        prefix ??= string.Empty;
        var key = new CacheKey(bucketName, prefix);

        lock (_lock)
        {
            if (!_cache.TryGetValue(key, out var entry))
            {
                _logger.LogDebug("Cache miss: {Bucket}/{Prefix}", bucketName, prefix);
                return null;
            }

            var age = DateTime.UtcNow - entry.Timestamp;

            // Check if expired
            if (age > _staleTtl)
            {
                _logger.LogDebug("Cache expired: {Bucket}/{Prefix} (age: {Age}s)", bucketName, prefix, age.TotalSeconds);
                Remove(bucketName, prefix);
                return null;
            }

            // Update LRU order
            _lruList.Remove(entry.LruNode);
            _lruList.AddFirst(entry.LruNode);

            var isFresh = age <= _freshTtl;
            var isStale = age > _freshTtl && age <= _staleTtl;

            _logger.LogDebug("Cache hit: {Bucket}/{Prefix} (fresh: {Fresh}, stale: {Stale}, age: {Age}s)",
                bucketName, prefix, isFresh, isStale, age.TotalSeconds);

            return new CachedFolderResult
            {
                Objects = entry.Objects,
                Folders = entry.Folders,
                ContinuationToken = entry.ContinuationToken,
                IsFresh = isFresh,
                IsStale = isStale,
                Age = age
            };
        }
    }

    /// <summary>
    /// Stores a folder listing in the cache.
    /// </summary>
    /// <param name="bucketName">Bucket name.</param>
    /// <param name="prefix">Folder prefix.</param>
    /// <param name="objects">List of objects.</param>
    /// <param name="folders">List of folder prefixes.</param>
    /// <param name="continuationToken">Pagination token.</param>
    public void Set(
        string bucketName,
        string prefix,
        List<R2Object> objects,
        List<string> folders,
        string? continuationToken = null)
    {
        if (string.IsNullOrEmpty(bucketName))
        {
            throw new ArgumentException("Bucket name cannot be empty", nameof(bucketName));
        }

        prefix ??= string.Empty;
        objects ??= new List<R2Object>();
        folders ??= new List<string>();

        var key = new CacheKey(bucketName, prefix);

        lock (_lock)
        {
            // Remove existing entry if present
            if (_cache.ContainsKey(key))
            {
                var existingEntry = _cache[key];
                _lruList.Remove(existingEntry.LruNode);
                _cache.Remove(key);
            }

            // Evict oldest entry if at capacity
            if (_cache.Count >= _maxEntries)
            {
                EvictOldest();
            }

            // Create new entry
            var lruNode = new LinkedListNode<CacheKey>(key);
            var entry = new CacheEntry
            {
                Objects = new List<R2Object>(objects),
                Folders = new List<string>(folders),
                ContinuationToken = continuationToken,
                Timestamp = DateTime.UtcNow,
                LruNode = lruNode
            };

            _cache[key] = entry;
            _lruList.AddFirst(lruNode);

            _logger.LogDebug("Cache set: {Bucket}/{Prefix} ({ObjectCount} objects, {FolderCount} folders)",
                bucketName, prefix, objects.Count, folders.Count);
        }
    }

    /// <summary>
    /// Removes a specific cache entry.
    /// </summary>
    /// <param name="bucketName">Bucket name.</param>
    /// <param name="prefix">Folder prefix.</param>
    /// <returns>True if entry was removed, false if not found.</returns>
    public bool Remove(string bucketName, string prefix = "")
    {
        if (string.IsNullOrEmpty(bucketName))
        {
            return false;
        }

        prefix ??= string.Empty;
        var key = new CacheKey(bucketName, prefix);

        lock (_lock)
        {
            if (_cache.TryGetValue(key, out var entry))
            {
                _lruList.Remove(entry.LruNode);
                _cache.Remove(key);
                _logger.LogDebug("Cache removed: {Bucket}/{Prefix}", bucketName, prefix);
                return true;
            }

            return false;
        }
    }

    /// <summary>
    /// Invalidates all cache entries for a specific bucket.
    /// </summary>
    /// <param name="bucketName">Bucket name.</param>
    /// <returns>Number of entries removed.</returns>
    public int InvalidateBucket(string bucketName)
    {
        if (string.IsNullOrEmpty(bucketName))
        {
            return 0;
        }

        lock (_lock)
        {
            var keysToRemove = _cache.Keys
                .Where(k => k.BucketName.Equals(bucketName, StringComparison.OrdinalIgnoreCase))
                .ToList();

            foreach (var key in keysToRemove)
            {
                var entry = _cache[key];
                _lruList.Remove(entry.LruNode);
                _cache.Remove(key);
            }

            if (keysToRemove.Count > 0)
            {
                _logger.LogInformation("Invalidated {Count} cache entries for bucket '{Bucket}'",
                    keysToRemove.Count, bucketName);
            }

            return keysToRemove.Count;
        }
    }

    /// <summary>
    /// Invalidates cache entries matching a specific prefix within a bucket.
    /// </summary>
    /// <param name="bucketName">Bucket name.</param>
    /// <param name="prefix">Folder prefix to invalidate.</param>
    /// <returns>Number of entries removed.</returns>
    public int InvalidatePrefix(string bucketName, string prefix)
    {
        if (string.IsNullOrEmpty(bucketName))
        {
            return 0;
        }

        prefix ??= string.Empty;

        lock (_lock)
        {
            var keysToRemove = _cache.Keys
                .Where(k => k.BucketName.Equals(bucketName, StringComparison.OrdinalIgnoreCase) &&
                           k.Prefix.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                .ToList();

            foreach (var key in keysToRemove)
            {
                var entry = _cache[key];
                _lruList.Remove(entry.LruNode);
                _cache.Remove(key);
            }

            if (keysToRemove.Count > 0)
            {
                _logger.LogInformation("Invalidated {Count} cache entries for prefix '{Bucket}/{Prefix}'",
                    keysToRemove.Count, bucketName, prefix);
            }

            return keysToRemove.Count;
        }
    }

    /// <summary>
    /// Clears the entire cache.
    /// </summary>
    public void Clear()
    {
        lock (_lock)
        {
            var count = _cache.Count;
            _cache.Clear();
            _lruList.Clear();
            _logger.LogInformation("Cache cleared ({Count} entries removed)", count);
        }
    }

    /// <summary>
    /// Gets cache statistics.
    /// </summary>
    public CacheStatistics GetStatistics()
    {
        lock (_lock)
        {
            var now = DateTime.UtcNow;
            var freshCount = 0;
            var staleCount = 0;
            var expiredCount = 0;

            foreach (var entry in _cache.Values)
            {
                var age = now - entry.Timestamp;
                if (age <= _freshTtl)
                {
                    freshCount++;
                }
                else if (age <= _staleTtl)
                {
                    staleCount++;
                }
                else
                {
                    expiredCount++;
                }
            }

            return new CacheStatistics
            {
                TotalEntries = _cache.Count,
                MaxEntries = _maxEntries,
                FreshEntries = freshCount,
                StaleEntries = staleCount,
                ExpiredEntries = expiredCount,
                FreshTtl = _freshTtl,
                StaleTtl = _staleTtl
            };
        }
    }

    /// <summary>
    /// Removes expired entries from the cache.
    /// </summary>
    /// <returns>Number of entries removed.</returns>
    public int RemoveExpiredEntries()
    {
        lock (_lock)
        {
            var now = DateTime.UtcNow;
            var keysToRemove = _cache
                .Where(kvp => (now - kvp.Value.Timestamp) > _staleTtl)
                .Select(kvp => kvp.Key)
                .ToList();

            foreach (var key in keysToRemove)
            {
                var entry = _cache[key];
                _lruList.Remove(entry.LruNode);
                _cache.Remove(key);
            }

            if (keysToRemove.Count > 0)
            {
                _logger.LogDebug("Removed {Count} expired cache entries", keysToRemove.Count);
            }

            return keysToRemove.Count;
        }
    }

    /// <summary>
    /// Evicts the oldest (least recently used) entry from the cache.
    /// </summary>
    private void EvictOldest()
    {
        if (_lruList.Last == null)
        {
            return;
        }

        var oldestKey = _lruList.Last.Value;
        _cache.Remove(oldestKey);
        _lruList.RemoveLast();

        _logger.LogDebug("Evicted oldest cache entry: {Bucket}/{Prefix}",
            oldestKey.BucketName, oldestKey.Prefix);
    }

    /// <summary>
    /// Cache key combining bucket name and prefix.
    /// </summary>
    private readonly struct CacheKey : IEquatable<CacheKey>
    {
        public string BucketName { get; }
        public string Prefix { get; }

        public CacheKey(string bucketName, string prefix)
        {
            BucketName = bucketName;
            Prefix = prefix;
        }

        public bool Equals(CacheKey other)
        {
            return BucketName.Equals(other.BucketName, StringComparison.OrdinalIgnoreCase) &&
                   Prefix.Equals(other.Prefix, StringComparison.OrdinalIgnoreCase);
        }

        public override bool Equals(object? obj)
        {
            return obj is CacheKey other && Equals(other);
        }

        public override int GetHashCode()
        {
            return HashCode.Combine(
                BucketName.ToLowerInvariant(),
                Prefix.ToLowerInvariant());
        }

        public static bool operator ==(CacheKey left, CacheKey right) => left.Equals(right);
        public static bool operator !=(CacheKey left, CacheKey right) => !left.Equals(right);
    }

    /// <summary>
    /// Cache entry containing cached data and metadata.
    /// </summary>
    private class CacheEntry
    {
        public List<R2Object> Objects { get; init; } = new();
        public List<string> Folders { get; init; } = new();
        public string? ContinuationToken { get; init; }
        public DateTime Timestamp { get; init; }
        public LinkedListNode<CacheKey> LruNode { get; init; } = null!;
    }
}

/// <summary>
/// Result of a cache lookup.
/// </summary>
public class CachedFolderResult
{
    /// <summary>List of objects in the folder.</summary>
    public List<R2Object> Objects { get; init; } = new();

    /// <summary>List of folder prefixes.</summary>
    public List<string> Folders { get; init; } = new();

    /// <summary>Pagination continuation token.</summary>
    public string? ContinuationToken { get; init; }

    /// <summary>Whether the cached data is fresh (within fresh TTL).</summary>
    public bool IsFresh { get; init; }

    /// <summary>Whether the cached data is stale (between fresh and stale TTL).</summary>
    public bool IsStale { get; init; }

    /// <summary>Age of the cached data.</summary>
    public TimeSpan Age { get; init; }
}

/// <summary>
/// Cache statistics.
/// </summary>
public class CacheStatistics
{
    /// <summary>Total number of entries in cache.</summary>
    public int TotalEntries { get; init; }

    /// <summary>Maximum number of entries allowed.</summary>
    public int MaxEntries { get; init; }

    /// <summary>Number of fresh entries (within fresh TTL).</summary>
    public int FreshEntries { get; init; }

    /// <summary>Number of stale entries (between fresh and stale TTL).</summary>
    public int StaleEntries { get; init; }

    /// <summary>Number of expired entries (beyond stale TTL).</summary>
    public int ExpiredEntries { get; init; }

    /// <summary>Fresh TTL duration.</summary>
    public TimeSpan FreshTtl { get; init; }

    /// <summary>Stale TTL duration.</summary>
    public TimeSpan StaleTtl { get; init; }

    /// <summary>Cache utilization percentage.</summary>
    public double UtilizationPercent => MaxEntries > 0 ? (TotalEntries / (double)MaxEntries) * 100.0 : 0.0;
}
