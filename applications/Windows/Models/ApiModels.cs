using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;

namespace CloudflareR2Browser.Models;

// ============================================================================
// Common Types
// ============================================================================

/// <summary>
/// Standard API response envelope for all API responses.
/// </summary>
/// <typeparam name="T">The type of data contained in the response</typeparam>
public sealed record ApiResponse<T>
{
    /// <summary>
    /// Response status indicating success or error.
    /// </summary>
    [JsonPropertyName("status")]
    public required string Status { get; init; }

    /// <summary>
    /// Response data payload (present on success).
    /// </summary>
    [JsonPropertyName("data")]
    public T? Data { get; init; }

    /// <summary>
    /// Error details (present on error).
    /// </summary>
    [JsonPropertyName("error")]
    public ApiError? Error { get; init; }

    /// <summary>
    /// Response metadata included in every response.
    /// </summary>
    [JsonPropertyName("meta")]
    public required ResponseMeta Meta { get; init; }

    /// <summary>
    /// Indicates if the response is successful.
    /// </summary>
    [JsonIgnore]
    public bool IsSuccess => Status == "ok";

    /// <summary>
    /// Indicates if the response is an error.
    /// </summary>
    [JsonIgnore]
    public bool IsError => Status == "error";
}

/// <summary>
/// Response metadata included in every API response.
/// </summary>
public sealed record ResponseMeta
{
    /// <summary>
    /// ISO 8601 UTC timestamp when response was generated.
    /// </summary>
    [JsonPropertyName("timestamp")]
    public required string Timestamp { get; init; }

    /// <summary>
    /// UUID v4 for request tracking and debugging.
    /// </summary>
    [JsonPropertyName("requestId")]
    public required string RequestId { get; init; }
}

/// <summary>
/// Standard error response envelope.
/// </summary>
public sealed record ErrorResponse
{
    /// <summary>
    /// Always "error" for error responses.
    /// </summary>
    [JsonPropertyName("status")]
    public required string Status { get; init; }

    /// <summary>
    /// Error details.
    /// </summary>
    [JsonPropertyName("error")]
    public required ApiError Error { get; init; }

    /// <summary>
    /// Response metadata.
    /// </summary>
    [JsonPropertyName("meta")]
    public required ResponseMeta Meta { get; init; }
}

/// <summary>
/// Error details structure for error responses.
/// </summary>
public sealed record ApiError
{
    /// <summary>
    /// Machine-readable error code.
    /// </summary>
    [JsonPropertyName("code")]
    public required string Code { get; init; }

    /// <summary>
    /// Human-readable error message.
    /// </summary>
    [JsonPropertyName("message")]
    public required string Message { get; init; }

    /// <summary>
    /// Optional additional context about the error.
    /// </summary>
    [JsonPropertyName("details")]
    public Dictionary<string, object>? Details { get; init; }
}

// ============================================================================
// Bucket Types
// ============================================================================

/// <summary>
/// List buckets response.
/// </summary>
public sealed record BucketsResponse
{
    /// <summary>
    /// Response status.
    /// </summary>
    [JsonPropertyName("status")]
    public required string Status { get; init; }

    /// <summary>
    /// Array of buckets.
    /// </summary>
    [JsonPropertyName("data")]
    public required List<Bucket> Data { get; init; }

    /// <summary>
    /// Total number of buckets returned.
    /// </summary>
    [JsonPropertyName("count")]
    public int Count { get; init; }

    /// <summary>
    /// Response metadata.
    /// </summary>
    [JsonPropertyName("meta")]
    public required ResponseMeta Meta { get; init; }
}

/// <summary>
/// Bucket information from R2.
/// </summary>
public sealed record Bucket
{
    /// <summary>
    /// Bucket name (unique identifier).
    /// </summary>
    [JsonPropertyName("name")]
    public required string Name { get; init; }

    /// <summary>
    /// ISO 8601 UTC timestamp of bucket creation.
    /// </summary>
    [JsonPropertyName("creationDate")]
    public required string CreationDate { get; init; }

    /// <summary>
    /// Parsed creation date.
    /// </summary>
    [JsonIgnore]
    public DateTime CreationDateTime => DateTime.Parse(CreationDate);
}

// ============================================================================
// Object Types
// ============================================================================

/// <summary>
/// List objects response.
/// </summary>
public sealed record ObjectsResponse
{
    /// <summary>
    /// Response status.
    /// </summary>
    [JsonPropertyName("status")]
    public required string Status { get; init; }

    /// <summary>
    /// Array of objects.
    /// </summary>
    [JsonPropertyName("data")]
    public required List<R2Object> Data { get; init; }

    /// <summary>
    /// Pagination information.
    /// </summary>
    [JsonPropertyName("pagination")]
    public required PaginationInfo Pagination { get; init; }

    /// <summary>
    /// Response metadata.
    /// </summary>
    [JsonPropertyName("meta")]
    public required ResponseMeta Meta { get; init; }
}

/// <summary>
/// Pagination information for object listing.
/// </summary>
public sealed record PaginationInfo
{
    /// <summary>
    /// Whether more results are available.
    /// </summary>
    [JsonPropertyName("isTruncated")]
    public bool IsTruncated { get; init; }

    /// <summary>
    /// Maximum keys requested per page.
    /// </summary>
    [JsonPropertyName("maxKeys")]
    public int MaxKeys { get; init; }

    /// <summary>
    /// Actual number of keys returned in this response.
    /// </summary>
    [JsonPropertyName("keyCount")]
    public int KeyCount { get; init; }

    /// <summary>
    /// Prefix filter applied to listing.
    /// </summary>
    [JsonPropertyName("prefix")]
    public string? Prefix { get; init; }

    /// <summary>
    /// Delimiter used for hierarchical listing.
    /// </summary>
    [JsonPropertyName("delimiter")]
    public string? Delimiter { get; init; }

    /// <summary>
    /// Current continuation token (if paginating).
    /// </summary>
    [JsonPropertyName("continuationToken")]
    public string? ContinuationToken { get; init; }

    /// <summary>
    /// Token to use for fetching next page.
    /// </summary>
    [JsonPropertyName("nextContinuationToken")]
    public string? NextContinuationToken { get; init; }

    /// <summary>
    /// Common prefixes (folder-like groupings).
    /// </summary>
    [JsonPropertyName("commonPrefixes")]
    public List<string>? CommonPrefixes { get; init; }
}

/// <summary>
/// Simplified result for listing objects (used internally by R2ApiClient).
/// </summary>
public sealed record ListObjectsResult
{
    /// <summary>
    /// List of objects in the response.
    /// </summary>
    public required List<R2Object> Objects { get; init; }

    /// <summary>
    /// List of common prefixes (folders).
    /// </summary>
    public required List<string> CommonPrefixes { get; init; }

    /// <summary>
    /// Pagination information.
    /// </summary>
    public required PaginationInfo Pagination { get; init; }
}

/// <summary>
/// Object metadata from R2.
/// </summary>
public sealed record R2Object
{
    /// <summary>
    /// Object key (full path in bucket).
    /// </summary>
    [JsonPropertyName("key")]
    public required string Key { get; init; }

    /// <summary>
    /// File size in bytes.
    /// </summary>
    [JsonPropertyName("size")]
    public long Size { get; init; }

    /// <summary>
    /// ISO 8601 UTC timestamp of last modification.
    /// </summary>
    [JsonPropertyName("lastModified")]
    public required string LastModified { get; init; }

    /// <summary>
    /// ETag (MD5 hash in quotes) for integrity verification.
    /// </summary>
    [JsonPropertyName("etag")]
    public required string ETag { get; init; }

    /// <summary>
    /// R2 storage class.
    /// </summary>
    [JsonPropertyName("storageClass")]
    public required string StorageClass { get; init; }

    // Computed Properties

    /// <summary>
    /// Gets the object name (last component of the path).
    /// </summary>
    [JsonIgnore]
    public string Name => Key.Split('/').Last();

    /// <summary>
    /// Indicates if this object represents a folder (ends with /).
    /// </summary>
    [JsonIgnore]
    public bool IsFolder => Key.EndsWith('/');

    /// <summary>
    /// Gets the file extension (empty for folders or files without extensions).
    /// </summary>
    [JsonIgnore]
    public string Extension
    {
        get
        {
            if (IsFolder) return string.Empty;
            var name = Name;
            var lastDot = name.LastIndexOf('.');
            return lastDot >= 0 ? name[lastDot..] : string.Empty;
        }
    }

    /// <summary>
    /// Gets human-readable file size (e.g., "1.5 MB").
    /// </summary>
    [JsonIgnore]
    public string HumanReadableSize
    {
        get
        {
            string[] sizes = ["B", "KB", "MB", "GB", "TB"];
            double len = Size;
            int order = 0;
            while (len >= 1024 && order < sizes.Length - 1)
            {
                order++;
                len /= 1024;
            }
            return $"{len:0.##} {sizes[order]}";
        }
    }

    /// <summary>
    /// Parses the ISO8601 LastModified string into a DateTime.
    /// </summary>
    [JsonIgnore]
    public DateTime LastModifiedDateTime => DateTime.Parse(LastModified);
}

// ============================================================================
// Upload Types
// ============================================================================

/// <summary>
/// Object upload response.
/// </summary>
public sealed record UploadObjectResponse
{
    /// <summary>
    /// Response status.
    /// </summary>
    [JsonPropertyName("status")]
    public required string Status { get; init; }

    /// <summary>
    /// Upload data.
    /// </summary>
    [JsonPropertyName("data")]
    public required UploadData Data { get; init; }

    /// <summary>
    /// Response metadata.
    /// </summary>
    [JsonPropertyName("meta")]
    public required ResponseMeta Meta { get; init; }
}

/// <summary>
/// Upload data details.
/// </summary>
public sealed record UploadData
{
    /// <summary>
    /// Object key (full path).
    /// </summary>
    [JsonPropertyName("key")]
    public required string Key { get; init; }

    /// <summary>
    /// ETag for uploaded object.
    /// </summary>
    [JsonPropertyName("etag")]
    public required string ETag { get; init; }

    /// <summary>
    /// File size in bytes.
    /// </summary>
    [JsonPropertyName("size")]
    public long Size { get; init; }

    /// <summary>
    /// Content-Type of uploaded object.
    /// </summary>
    [JsonPropertyName("contentType")]
    public required string ContentType { get; init; }

    /// <summary>
    /// ISO 8601 UTC timestamp of upload.
    /// </summary>
    [JsonPropertyName("lastModified")]
    public required string LastModified { get; init; }
}

// ============================================================================
// Delete Types
// ============================================================================

/// <summary>
/// Object deletion response.
/// </summary>
public sealed record DeleteObjectResponse
{
    /// <summary>
    /// Response status.
    /// </summary>
    [JsonPropertyName("status")]
    public required string Status { get; init; }

    /// <summary>
    /// Deletion data.
    /// </summary>
    [JsonPropertyName("data")]
    public required DeleteData Data { get; init; }

    /// <summary>
    /// Response metadata.
    /// </summary>
    [JsonPropertyName("meta")]
    public required ResponseMeta Meta { get; init; }
}

/// <summary>
/// Deletion data details.
/// </summary>
public sealed record DeleteData
{
    /// <summary>
    /// Object key that was deleted.
    /// </summary>
    [JsonPropertyName("key")]
    public required string Key { get; init; }

    /// <summary>
    /// Deletion status (always true).
    /// </summary>
    [JsonPropertyName("deleted")]
    public bool Deleted { get; init; }
}

/// <summary>
/// Batch delete response.
/// </summary>
public sealed record BatchDeleteResponse
{
    /// <summary>
    /// Response status.
    /// </summary>
    [JsonPropertyName("status")]
    public required string Status { get; init; }

    /// <summary>
    /// Batch deletion data.
    /// </summary>
    [JsonPropertyName("data")]
    public required BatchDeleteData Data { get; init; }

    /// <summary>
    /// Response metadata.
    /// </summary>
    [JsonPropertyName("meta")]
    public required ResponseMeta Meta { get; init; }
}

/// <summary>
/// Batch deletion data details.
/// </summary>
public sealed record BatchDeleteData
{
    /// <summary>
    /// Number of objects successfully deleted.
    /// </summary>
    [JsonPropertyName("deletedCount")]
    public int DeletedCount { get; init; }

    /// <summary>
    /// Array of successfully deleted object keys.
    /// </summary>
    [JsonPropertyName("deleted")]
    public required List<string> Deleted { get; init; }

    /// <summary>
    /// Array of objects that failed to delete.
    /// </summary>
    [JsonPropertyName("errors")]
    public List<BatchDeleteError>? Errors { get; init; }
}

/// <summary>
/// Error details for batch delete failures.
/// </summary>
public sealed record BatchDeleteError
{
    /// <summary>
    /// Object key that failed to delete.
    /// </summary>
    [JsonPropertyName("key")]
    public required string Key { get; init; }

    /// <summary>
    /// Error code.
    /// </summary>
    [JsonPropertyName("code")]
    public required string Code { get; init; }

    /// <summary>
    /// Error message.
    /// </summary>
    [JsonPropertyName("message")]
    public required string Message { get; init; }
}

/// <summary>
/// Folder delete response.
/// </summary>
public sealed record FolderDeleteResponse
{
    /// <summary>
    /// Response status.
    /// </summary>
    [JsonPropertyName("status")]
    public required string Status { get; init; }

    /// <summary>
    /// Folder deletion data.
    /// </summary>
    [JsonPropertyName("data")]
    public required FolderDeleteData Data { get; init; }

    /// <summary>
    /// Response metadata.
    /// </summary>
    [JsonPropertyName("meta")]
    public required ResponseMeta Meta { get; init; }
}

/// <summary>
/// Folder deletion data details.
/// </summary>
public sealed record FolderDeleteData
{
    /// <summary>
    /// Prefix/folder that was deleted.
    /// </summary>
    [JsonPropertyName("prefix")]
    public required string Prefix { get; init; }

    /// <summary>
    /// Total number of objects deleted.
    /// </summary>
    [JsonPropertyName("totalDeleted")]
    public int TotalDeleted { get; init; }

    /// <summary>
    /// Number of batches processed.
    /// </summary>
    [JsonPropertyName("batchCount")]
    public int BatchCount { get; init; }
}

// ============================================================================
// Presigned URL Types
// ============================================================================

/// <summary>
/// Presigned URL response.
/// </summary>
public sealed record PresignedUrlResponse
{
    /// <summary>
    /// Response status.
    /// </summary>
    [JsonPropertyName("status")]
    public required string Status { get; init; }

    /// <summary>
    /// Presigned URL data.
    /// </summary>
    [JsonPropertyName("data")]
    public required PresignedUrlData Data { get; init; }

    /// <summary>
    /// Response metadata.
    /// </summary>
    [JsonPropertyName("meta")]
    public required ResponseMeta Meta { get; init; }
}

/// <summary>
/// Presigned URL data details.
/// </summary>
public sealed record PresignedUrlData
{
    /// <summary>
    /// Object key.
    /// </summary>
    [JsonPropertyName("key")]
    public required string Key { get; init; }

    /// <summary>
    /// Presigned URL for object access.
    /// </summary>
    [JsonPropertyName("url")]
    public required string Url { get; init; }

    /// <summary>
    /// URL expiration time in seconds.
    /// </summary>
    [JsonPropertyName("expiresIn")]
    public int ExpiresIn { get; init; }

    /// <summary>
    /// ISO 8601 UTC timestamp when URL expires.
    /// </summary>
    [JsonPropertyName("expiresAt")]
    public required string ExpiresAt { get; init; }

    /// <summary>
    /// Parsed expiration date time.
    /// </summary>
    [JsonIgnore]
    public DateTime ExpiresAtDateTime => DateTime.Parse(ExpiresAt);
}
