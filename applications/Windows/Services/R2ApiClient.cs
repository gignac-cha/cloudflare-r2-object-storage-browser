#nullable enable

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using CloudflareR2Browser.Models;

namespace CloudflareR2Browser.Services;

/// <summary>
/// HTTP client for communicating with the local Node.js API server.
/// </summary>
public sealed class R2ApiClient : IDisposable
{
    private readonly ILogger<R2ApiClient> _logger;
    private readonly HttpClient _httpClient;
    private readonly JsonSerializerOptions _jsonOptions;

    private int? _serverPort;
    private bool _disposed;

    /// <summary>
    /// Gets or sets the server port. Must be set before making requests.
    /// </summary>
    public int? ServerPort
    {
        get => _serverPort;
        set
        {
            _serverPort = value;
            if (value.HasValue)
            {
                _httpClient.BaseAddress = new Uri($"http://127.0.0.1:{value}");
                _logger.LogInformation("API client base URL set to {BaseUrl}", _httpClient.BaseAddress);
            }
        }
    }

    public R2ApiClient(ILogger<R2ApiClient> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _httpClient = new HttpClient
        {
            Timeout = TimeSpan.FromMinutes(5) // Long timeout for large file uploads
        };

        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };
    }

    /// <summary>
    /// Lists all R2 buckets.
    /// </summary>
    public async Task<List<Bucket>> ListBucketsAsync(CancellationToken cancellationToken = default)
    {
        EnsureServerPortSet();

        try
        {
            var response = await _httpClient.GetFromJsonAsync<ApiResponse<List<Bucket>>>(
                "/buckets",
                _jsonOptions,
                cancellationToken);

            if (response?.Status == "ok" && response.Data != null)
            {
                _logger.LogInformation("Retrieved {Count} buckets", response.Data.Count);
                return response.Data;
            }

            throw new R2ApiException("Failed to list buckets", response?.Error);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error listing buckets");
            throw new R2ApiException("Network error listing buckets", ex);
        }
    }

    /// <summary>
    /// Lists objects in a bucket with optional filtering.
    /// </summary>
    public async Task<ListObjectsResult> ListObjectsAsync(
        string bucketName,
        string? prefix = null,
        string? delimiter = "/",
        int? maxKeys = null,
        string? continuationToken = null,
        CancellationToken cancellationToken = default)
    {
        EnsureServerPortSet();

        var queryParams = new Dictionary<string, string>();
        if (!string.IsNullOrEmpty(prefix)) queryParams["prefix"] = prefix;
        if (!string.IsNullOrEmpty(delimiter)) queryParams["delimiter"] = delimiter;
        if (maxKeys.HasValue) queryParams["maxKeys"] = maxKeys.Value.ToString();
        if (!string.IsNullOrEmpty(continuationToken)) queryParams["continuationToken"] = continuationToken;

        var url = BuildUrl($"/buckets/{Uri.EscapeDataString(bucketName)}/objects", queryParams);

        try
        {
            var response = await _httpClient.GetFromJsonAsync<ObjectsResponse>(
                url,
                _jsonOptions,
                cancellationToken);

            if (response?.Status == "ok" && response.Data != null)
            {
                _logger.LogInformation("Retrieved {Count} objects from bucket {Bucket}",
                    response.Pagination?.KeyCount ?? 0, bucketName);

                return new ListObjectsResult
                {
                    Objects = response.Data ?? new List<R2Object>(),
                    Pagination = response.Pagination,
                    CommonPrefixes = response.Pagination?.CommonPrefixes ?? new List<string>()
                };
            }

            throw new R2ApiException($"Failed to list objects in bucket '{bucketName}'");
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error listing objects");
            throw new R2ApiException("Network error listing objects", ex);
        }
    }

    /// <summary>
    /// Downloads an object to a file with progress reporting.
    /// </summary>
    public async Task DownloadObjectToFileAsync(
        string bucketName,
        string objectKey,
        string destinationPath,
        IProgress<long>? progress = null,
        CancellationToken cancellationToken = default)
    {
        EnsureServerPortSet();

        var encodedKey = Uri.EscapeDataString(objectKey);
        var url = $"/buckets/{Uri.EscapeDataString(bucketName)}/objects/{encodedKey}";

        try
        {
            using var response = await _httpClient.GetAsync(url, HttpCompletionOption.ResponseHeadersRead, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                throw new R2ApiException($"Failed to download object '{objectKey}': {response.StatusCode}");
            }

            var totalBytes = response.Content.Headers.ContentLength ?? -1;
            var buffer = new byte[81920]; // 80KB buffer
            long totalRead = 0;

            using var contentStream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var fileStream = new FileStream(destinationPath, FileMode.Create, FileAccess.Write, FileShare.None, buffer.Length, useAsync: true);

            int bytesRead;
            while ((bytesRead = await contentStream.ReadAsync(buffer, cancellationToken)) > 0)
            {
                await fileStream.WriteAsync(buffer.AsMemory(0, bytesRead), cancellationToken);
                totalRead += bytesRead;
                progress?.Report(totalRead);
            }

            _logger.LogInformation("Downloaded {Bytes} bytes to {Path}", totalRead, destinationPath);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error downloading object");
            throw new R2ApiException($"Network error downloading object '{objectKey}'", ex);
        }
    }

    /// <summary>
    /// Downloads an object to a stream.
    /// </summary>
    public async Task<Stream> DownloadObjectAsync(
        string bucketName,
        string objectKey,
        CancellationToken cancellationToken = default)
    {
        EnsureServerPortSet();

        var encodedKey = Uri.EscapeDataString(objectKey);
        var url = $"/buckets/{Uri.EscapeDataString(bucketName)}/objects/{encodedKey}";

        try
        {
            var response = await _httpClient.GetAsync(url, HttpCompletionOption.ResponseHeadersRead, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                throw new R2ApiException($"Failed to download object '{objectKey}': {response.StatusCode}");
            }

            return await response.Content.ReadAsStreamAsync(cancellationToken);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error downloading object");
            throw new R2ApiException($"Network error downloading object '{objectKey}'", ex);
        }
    }

    /// <summary>
    /// Uploads a file to R2 with progress reporting.
    /// </summary>
    public async Task<UploadResult> UploadFileAsync(
        string bucketName,
        string objectKey,
        string filePath,
        string? contentType = null,
        IProgress<long>? progress = null,
        CancellationToken cancellationToken = default)
    {
        EnsureServerPortSet();

        if (!File.Exists(filePath))
        {
            throw new FileNotFoundException($"File not found: {filePath}");
        }

        var encodedKey = Uri.EscapeDataString(objectKey);
        var url = $"/buckets/{Uri.EscapeDataString(bucketName)}/objects/{encodedKey}";

        try
        {
            using var fileStream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read, 81920, useAsync: true);

            var streamContent = new ProgressStreamContent(fileStream, progress);
            if (!string.IsNullOrEmpty(contentType))
            {
                streamContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(contentType);
            }

            using var response = await _httpClient.PutAsync(url, streamContent, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                throw new R2ApiException($"Failed to upload object '{objectKey}': {response.StatusCode}");
            }

            var result = await response.Content.ReadFromJsonAsync<ApiResponse<UploadResult>>(_jsonOptions, cancellationToken);

            if (result?.Status == "ok" && result.Data != null)
            {
                _logger.LogInformation("Uploaded object '{Key}' ({Size} bytes)", objectKey, result.Data.Size);
                return result.Data;
            }

            throw new R2ApiException($"Invalid response uploading object '{objectKey}'");
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error uploading object");
            throw new R2ApiException($"Network error uploading object '{objectKey}'", ex);
        }
    }

    /// <summary>
    /// Uploads data from a stream to R2.
    /// </summary>
    public async Task<UploadResult> UploadStreamAsync(
        string bucketName,
        string objectKey,
        Stream stream,
        string? contentType = null,
        IProgress<long>? progress = null,
        CancellationToken cancellationToken = default)
    {
        EnsureServerPortSet();

        var encodedKey = Uri.EscapeDataString(objectKey);
        var url = $"/buckets/{Uri.EscapeDataString(bucketName)}/objects/{encodedKey}";

        try
        {
            var streamContent = new ProgressStreamContent(stream, progress);
            if (!string.IsNullOrEmpty(contentType))
            {
                streamContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(contentType);
            }

            using var response = await _httpClient.PutAsync(url, streamContent, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                throw new R2ApiException($"Failed to upload object '{objectKey}': {response.StatusCode}");
            }

            var result = await response.Content.ReadFromJsonAsync<ApiResponse<UploadResult>>(_jsonOptions, cancellationToken);

            if (result?.Status == "ok" && result.Data != null)
            {
                _logger.LogInformation("Uploaded object '{Key}' ({Size} bytes)", objectKey, result.Data.Size);
                return result.Data;
            }

            throw new R2ApiException($"Invalid response uploading object '{objectKey}'");
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error uploading stream");
            throw new R2ApiException($"Network error uploading object '{objectKey}'", ex);
        }
    }

    /// <summary>
    /// Deletes a single object from R2.
    /// </summary>
    public async Task<bool> DeleteObjectAsync(
        string bucketName,
        string objectKey,
        CancellationToken cancellationToken = default)
    {
        EnsureServerPortSet();

        var encodedKey = Uri.EscapeDataString(objectKey);
        var url = $"/buckets/{Uri.EscapeDataString(bucketName)}/objects/{encodedKey}";

        try
        {
            using var response = await _httpClient.DeleteAsync(url, cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Deleted object '{Key}' from bucket '{Bucket}'", objectKey, bucketName);
                return true;
            }

            if (response.StatusCode == HttpStatusCode.NotFound)
            {
                _logger.LogWarning("Object '{Key}' not found (already deleted?)", objectKey);
                return true; // Idempotent
            }

            throw new R2ApiException($"Failed to delete object '{objectKey}': {response.StatusCode}");
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error deleting object");
            throw new R2ApiException($"Network error deleting object '{objectKey}'", ex);
        }
    }

    /// <summary>
    /// Deletes multiple objects in a batch (max 1000).
    /// </summary>
    public async Task<BatchDeleteResult> DeleteObjectsBatchAsync(
        string bucketName,
        List<string> objectKeys,
        CancellationToken cancellationToken = default)
    {
        EnsureServerPortSet();

        if (objectKeys.Count > 1000)
        {
            throw new ArgumentException("Maximum 1000 objects per batch delete request", nameof(objectKeys));
        }

        var url = $"/buckets/{Uri.EscapeDataString(bucketName)}/objects/batch";

        try
        {
            var request = new { keys = objectKeys };
            using var response = await _httpClient.PostAsJsonAsync(url, request, _jsonOptions, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                throw new R2ApiException($"Failed to batch delete objects: {response.StatusCode}");
            }

            var result = await response.Content.ReadFromJsonAsync<ApiResponse<BatchDeleteResult>>(_jsonOptions, cancellationToken);

            if (result?.Status == "ok" && result.Data != null)
            {
                _logger.LogInformation("Batch deleted {Count} objects from bucket '{Bucket}'",
                    result.Data.DeletedCount, bucketName);
                return result.Data;
            }

            throw new R2ApiException("Invalid response from batch delete");
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error batch deleting objects");
            throw new R2ApiException("Network error batch deleting objects", ex);
        }
    }

    /// <summary>
    /// Deletes a folder (prefix) recursively.
    /// </summary>
    public async Task<FolderDeleteResult> DeleteFolderAsync(
        string bucketName,
        string prefix,
        CancellationToken cancellationToken = default)
    {
        EnsureServerPortSet();

        var queryParams = new Dictionary<string, string> { ["prefix"] = prefix };
        var url = BuildUrl($"/buckets/{Uri.EscapeDataString(bucketName)}/folders", queryParams);

        try
        {
            using var response = await _httpClient.DeleteAsync(url, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                throw new R2ApiException($"Failed to delete folder '{prefix}': {response.StatusCode}");
            }

            var result = await response.Content.ReadFromJsonAsync<ApiResponse<FolderDeleteResult>>(_jsonOptions, cancellationToken);

            if (result?.Status == "ok" && result.Data != null)
            {
                _logger.LogInformation("Deleted folder '{Prefix}' ({Count} objects) from bucket '{Bucket}'",
                    prefix, result.Data.DeletedCount, bucketName);
                return result.Data;
            }

            throw new R2ApiException($"Invalid response deleting folder '{prefix}'");
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error deleting folder");
            throw new R2ApiException($"Network error deleting folder '{prefix}'", ex);
        }
    }

    /// <summary>
    /// Searches for objects by name within a bucket.
    /// </summary>
    public async Task<SearchResponse> SearchObjectsAsync(
        string bucketName,
        string query,
        string? prefix = null,
        int? maxKeys = null,
        CancellationToken cancellationToken = default)
    {
        EnsureServerPortSet();

        var queryParams = new Dictionary<string, string> { ["q"] = query };
        if (!string.IsNullOrEmpty(prefix)) queryParams["prefix"] = prefix;
        if (maxKeys.HasValue) queryParams["maxKeys"] = maxKeys.Value.ToString();

        var url = BuildUrl($"/buckets/{Uri.EscapeDataString(bucketName)}/search", queryParams);

        try
        {
            var response = await _httpClient.GetFromJsonAsync<ApiResponse<SearchResponseData>>(
                url,
                _jsonOptions,
                cancellationToken);

            if (response?.Status == "ok" && response.Data != null)
            {
                _logger.LogInformation("Search '{Query}' found {Count} results", query, response.Data.Data?.Count ?? 0);
                return new SearchResponse
                {
                    Results = response.Data.Data ?? new List<R2Object>(),
                    SearchMeta = response.Data.SearchMeta ?? new SearchMeta { Query = query, TotalMatches = 0, SearchTime = 0 }
                };
            }

            throw new R2ApiException($"Failed to search in bucket '{bucketName}'", response?.Error);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error searching objects");
            throw new R2ApiException("Network error searching objects", ex);
        }
    }

    /// <summary>
    /// Gets a presigned URL for an object.
    /// </summary>
    public async Task<string> GetPresignedUrlAsync(
        string bucketName,
        string objectKey,
        int expirySeconds = 3600,
        CancellationToken cancellationToken = default)
    {
        EnsureServerPortSet();

        var encodedKey = Uri.EscapeDataString(objectKey);
        var queryParams = new Dictionary<string, string>
        {
            ["presigned"] = "true",
            ["expiry"] = expirySeconds.ToString()
        };

        var url = BuildUrl($"/buckets/{Uri.EscapeDataString(bucketName)}/objects/{encodedKey}", queryParams);

        try
        {
            var response = await _httpClient.GetFromJsonAsync<PresignedUrlResponse>(
                url,
                _jsonOptions,
                cancellationToken);

            if (response?.Status == "ok" && response.Data?.Url != null)
            {
                _logger.LogInformation("Generated presigned URL for '{Key}' (expires in {Seconds}s)", objectKey, expirySeconds);
                return response.Data.Url;
            }

            throw new R2ApiException($"Failed to get presigned URL for '{objectKey}'");
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error getting presigned URL");
            throw new R2ApiException($"Network error getting presigned URL for '{objectKey}'", ex);
        }
    }

    private void EnsureServerPortSet()
    {
        if (!ServerPort.HasValue)
        {
            throw new InvalidOperationException("Server port not set. Start the server first.");
        }
    }

    private static string BuildUrl(string path, Dictionary<string, string>? queryParams = null)
    {
        if (queryParams == null || queryParams.Count == 0)
        {
            return path;
        }

        var queryString = string.Join("&",
            queryParams.Select(kvp => $"{Uri.EscapeDataString(kvp.Key)}={Uri.EscapeDataString(kvp.Value)}"));

        return $"{path}?{queryString}";
    }

    public void Dispose()
    {
        if (_disposed)
        {
            return;
        }

        _httpClient.Dispose();
        _disposed = true;
    }
}

/// <summary>
/// Custom exception for R2 API errors.
/// </summary>
public class R2ApiException : Exception
{
    public string? ErrorCode { get; }
    public Dictionary<string, object>? Details { get; }

    public R2ApiException(string message) : base(message) { }

    public R2ApiException(string message, Exception innerException) : base(message, innerException) { }

    public R2ApiException(string message, ApiError? error) : base(message)
    {
        ErrorCode = error?.Code;
        Details = error?.Details;
    }
}

/// <summary>
/// HttpContent wrapper that reports upload progress.
/// </summary>
internal class ProgressStreamContent : HttpContent
{
    private readonly Stream _stream;
    private readonly IProgress<long>? _progress;
    private readonly int _bufferSize = 81920; // 80KB

    public ProgressStreamContent(Stream stream, IProgress<long>? progress)
    {
        _stream = stream ?? throw new ArgumentNullException(nameof(stream));
        _progress = progress;
    }

    protected override async Task SerializeToStreamAsync(Stream stream, TransportContext? context)
    {
        var buffer = new byte[_bufferSize];
        long totalRead = 0;
        int bytesRead;

        while ((bytesRead = await _stream.ReadAsync(buffer)) > 0)
        {
            await stream.WriteAsync(buffer.AsMemory(0, bytesRead));
            totalRead += bytesRead;
            _progress?.Report(totalRead);
        }
    }

    protected override bool TryComputeLength(out long length)
    {
        if (_stream.CanSeek)
        {
            length = _stream.Length;
            return true;
        }

        length = 0;
        return false;
    }
}
