#nullable enable

using System;
using System.Collections.Generic;

namespace CloudflareR2Browser.Models;

/// <summary>
/// Internal response data for object listing.
/// </summary>
public sealed class ObjectsResponseData
{
    /// <summary>
    /// List of objects.
    /// </summary>
    public List<R2Object>? Data { get; init; }

    /// <summary>
    /// Pagination information.
    /// </summary>
    public Pagination? Pagination { get; init; }
}

/// <summary>
/// Pagination information.
/// </summary>
public sealed class Pagination
{
    /// <summary>
    /// Whether more results are available.
    /// </summary>
    public bool IsTruncated { get; init; }

    /// <summary>
    /// Maximum keys per page.
    /// </summary>
    public int MaxKeys { get; init; }

    /// <summary>
    /// Number of keys returned.
    /// </summary>
    public int KeyCount { get; init; }

    /// <summary>
    /// Prefix filter.
    /// </summary>
    public string? Prefix { get; init; }

    /// <summary>
    /// Delimiter used.
    /// </summary>
    public string? Delimiter { get; init; }

    /// <summary>
    /// Continuation token for next page.
    /// </summary>
    public string? ContinuationToken { get; init; }

    /// <summary>
    /// Token for next page.
    /// </summary>
    public string? NextContinuationToken { get; init; }

    /// <summary>
    /// Common prefixes (folders).
    /// </summary>
    public List<string>? CommonPrefixes { get; init; }
}

/// <summary>
/// Upload result.
/// </summary>
public sealed class UploadResult
{
    /// <summary>
    /// Object key.
    /// </summary>
    public required string Key { get; init; }

    /// <summary>
    /// ETag.
    /// </summary>
    public required string ETag { get; init; }

    /// <summary>
    /// File size.
    /// </summary>
    public long Size { get; init; }

    /// <summary>
    /// Content type.
    /// </summary>
    public string? ContentType { get; init; }
}

/// <summary>
/// Batch delete result.
/// </summary>
public sealed class BatchDeleteResult
{
    /// <summary>
    /// Number of successfully deleted objects.
    /// </summary>
    public int DeletedCount { get; init; }

    /// <summary>
    /// List of deleted object keys.
    /// </summary>
    public required List<string> Deleted { get; init; }

    /// <summary>
    /// List of errors.
    /// </summary>
    public List<BatchDeleteError>? Errors { get; init; }
}

/// <summary>
/// Folder delete result.
/// </summary>
public sealed class FolderDeleteResult
{
    /// <summary>
    /// Prefix that was deleted.
    /// </summary>
    public required string Prefix { get; init; }

    /// <summary>
    /// Total number of objects deleted.
    /// </summary>
    public int DeletedCount { get; init; }

    /// <summary>
    /// Number of batches processed.
    /// </summary>
    public int BatchCount { get; init; }
}

/// <summary>
/// Search response.
/// </summary>
public sealed class SearchResponse
{
    /// <summary>
    /// Search results.
    /// </summary>
    public required List<R2Object> Results { get; init; }

    /// <summary>
    /// Search metadata.
    /// </summary>
    public required SearchMeta SearchMeta { get; init; }
}

/// <summary>
/// Internal search response data.
/// </summary>
public sealed class SearchResponseData
{
    /// <summary>
    /// Search results.
    /// </summary>
    public List<R2Object>? Data { get; init; }

    /// <summary>
    /// Search metadata.
    /// </summary>
    public SearchMeta? SearchMeta { get; init; }
}

/// <summary>
/// Search metadata.
/// </summary>
public sealed class SearchMeta
{
    /// <summary>
    /// Search query.
    /// </summary>
    public required string Query { get; init; }

    /// <summary>
    /// Total matches found.
    /// </summary>
    public int TotalMatches { get; init; }

    /// <summary>
    /// Search time in milliseconds.
    /// </summary>
    public double SearchTime { get; init; }
}

/// <summary>
/// API debug response for debug panel.
/// </summary>
public sealed class ApiDebugResponse
{
    /// <summary>
    /// HTTP method (GET, POST, PUT, DELETE).
    /// </summary>
    public required string Method { get; init; }

    /// <summary>
    /// API endpoint.
    /// </summary>
    public required string Endpoint { get; init; }

    /// <summary>
    /// Response status code.
    /// </summary>
    public int StatusCode { get; init; }

    /// <summary>
    /// Response body (JSON string).
    /// </summary>
    public string? ResponseBody { get; init; }

    /// <summary>
    /// Timestamp of the request.
    /// </summary>
    public DateTime Timestamp { get; init; } = DateTime.UtcNow;

    /// <summary>
    /// Request duration in milliseconds.
    /// </summary>
    public double DurationMs { get; init; }
}
