#nullable enable

using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Input;
using CloudflareR2Browser.Helpers;
using CloudflareR2Browser.Models;
using CloudflareR2Browser.Services;
using Microsoft.Extensions.Logging;

namespace CloudflareR2Browser.ViewModels;

/// <summary>
/// ViewModel for the transfer manager.
/// Manages upload and download queues with concurrency control.
/// </summary>
public sealed class TransferManagerViewModel : ObservableObject, IDisposable
{
    private readonly ILogger<TransferManagerViewModel> _logger;
    private readonly R2ApiClient _apiClient;

    private int _maxConcurrentUploads = 3;
    private int _maxConcurrentDownloads = 5;
    // private bool _isProcessing; // Reserved for future use
    private bool _disposed;

    private readonly SemaphoreSlim _uploadSemaphore;
    private readonly SemaphoreSlim _downloadSemaphore;
    private readonly Dictionary<Guid, CancellationTokenSource> _taskCancellations = new();

    /// <summary>
    /// Initializes a new instance of the TransferManagerViewModel class.
    /// </summary>
    /// <param name="logger">Logger instance.</param>
    /// <param name="apiClient">R2 API client.</param>
    public TransferManagerViewModel(
        ILogger<TransferManagerViewModel> logger,
        R2ApiClient apiClient)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _apiClient = apiClient ?? throw new ArgumentNullException(nameof(apiClient));

        _uploadSemaphore = new SemaphoreSlim(_maxConcurrentUploads, _maxConcurrentUploads);
        _downloadSemaphore = new SemaphoreSlim(_maxConcurrentDownloads, _maxConcurrentDownloads);

        // Initialize commands
        PauseTransferCommand = new RelayCommand<Guid>(PauseTransfer, CanPauseTransfer);
        ResumeTransferCommand = new RelayCommand<Guid>(ResumeTransfer, CanResumeTransfer);
        CancelTransferCommand = new RelayCommand<Guid>(CancelTransfer, CanCancelTransfer);
        RetryTransferCommand = new AsyncRelayCommand<Guid>(RetryTransferAsync, CanRetryTransfer);
        ClearCompletedCommand = new RelayCommand(ClearCompleted);
        ClearFailedCommand = new RelayCommand(ClearFailed);

        _logger.LogInformation("TransferManagerViewModel initialized");

        // Start background processing
        _ = ProcessQueueAsync();
    }

    // ========================================================================
    // Properties
    // ========================================================================

    /// <summary>
    /// Gets the collection of active transfer tasks.
    /// </summary>
    public ObservableCollection<TransferTask> ActiveTasks { get; } = new();

    /// <summary>
    /// Gets the collection of completed transfer tasks.
    /// </summary>
    public ObservableCollection<TransferTask> CompletedTasks { get; } = new();

    /// <summary>
    /// Gets the collection of failed transfer tasks.
    /// </summary>
    public ObservableCollection<TransferTask> FailedTasks { get; } = new();

    /// <summary>
    /// Gets or sets the maximum number of concurrent uploads.
    /// </summary>
    public int MaxConcurrentUploads
    {
        get => _maxConcurrentUploads;
        set
        {
            if (SetProperty(ref _maxConcurrentUploads, value))
            {
                UpdateSemaphore(_uploadSemaphore, value);
                _logger.LogInformation("Max concurrent uploads set to {Max}", value);
            }
        }
    }

    /// <summary>
    /// Gets or sets the maximum number of concurrent downloads.
    /// </summary>
    public int MaxConcurrentDownloads
    {
        get => _maxConcurrentDownloads;
        set
        {
            if (SetProperty(ref _maxConcurrentDownloads, value))
            {
                UpdateSemaphore(_downloadSemaphore, value);
                _logger.LogInformation("Max concurrent downloads set to {Max}", value);
            }
        }
    }

    /// <summary>
    /// Gets whether any transfers are in progress.
    /// </summary>
    public bool IsTransferring => ActiveTasks.Any(t => t.IsActive);

    /// <summary>
    /// Gets the number of active uploads.
    /// </summary>
    public int ActiveUploadCount => ActiveTasks.Count(t => t.Type == TransferType.Upload && t.IsActive);

    /// <summary>
    /// Gets the number of active downloads.
    /// </summary>
    public int ActiveDownloadCount => ActiveTasks.Count(t => t.Type == TransferType.Download && t.IsActive);

    // ========================================================================
    // Commands
    // ========================================================================

    /// <summary>
    /// Command to pause a transfer.
    /// </summary>
    public ICommand PauseTransferCommand { get; }

    /// <summary>
    /// Command to resume a transfer.
    /// </summary>
    public ICommand ResumeTransferCommand { get; }

    /// <summary>
    /// Command to cancel a transfer.
    /// </summary>
    public ICommand CancelTransferCommand { get; }

    /// <summary>
    /// Command to retry a failed transfer.
    /// </summary>
    public ICommand RetryTransferCommand { get; }

    /// <summary>
    /// Command to clear completed transfers.
    /// </summary>
    public ICommand ClearCompletedCommand { get; }

    /// <summary>
    /// Command to clear failed transfers.
    /// </summary>
    public ICommand ClearFailedCommand { get; }

    // ========================================================================
    // Public Methods
    // ========================================================================

    /// <summary>
    /// Adds a file upload task to the queue.
    /// </summary>
    /// <param name="localPath">Local file path.</param>
    /// <param name="bucketName">Target bucket name.</param>
    /// <param name="remotePath">Remote object key.</param>
    public void QueueUpload(string localPath, string bucketName, string remotePath)
    {
        if (!File.Exists(localPath))
        {
            _logger.LogError("Upload file not found: {Path}", localPath);
            return;
        }

        var fileInfo = new FileInfo(localPath);
        var task = new TransferTask
        {
            Type = TransferType.Upload,
            FileName = Path.GetFileName(localPath),
            LocalPath = localPath,
            RemotePath = remotePath,
            BucketName = bucketName,
            TotalSize = fileInfo.Length,
            Status = TransferStatus.Queued
        };

        ActiveTasks.Add(task);
        _logger.LogInformation("Upload queued: {File} -> {Bucket}/{Key}", localPath, bucketName, remotePath);

        OnPropertyChanged(nameof(IsTransferring));
    }

    /// <summary>
    /// Adds a file download task to the queue.
    /// </summary>
    /// <param name="obj">R2 object to download.</param>
    /// <param name="bucketName">Source bucket name.</param>
    /// <param name="destinationPath">Local destination path.</param>
    public void QueueDownload(R2Object obj, string bucketName, string destinationPath)
    {
        var task = new TransferTask
        {
            Type = TransferType.Download,
            FileName = obj.Name,
            LocalPath = destinationPath,
            RemotePath = obj.Key,
            BucketName = bucketName,
            TotalSize = obj.Size,
            Status = TransferStatus.Queued
        };

        ActiveTasks.Add(task);
        _logger.LogInformation("Download queued: {Bucket}/{Key} -> {Path}", bucketName, obj.Key, destinationPath);

        OnPropertyChanged(nameof(IsTransferring));
    }

    /// <summary>
    /// Adds a batch delete task to the queue.
    /// </summary>
    /// <param name="objects">Objects to delete.</param>
    /// <param name="bucketName">Bucket name.</param>
    public void QueueDelete(List<R2Object> objects, string bucketName)
    {
        var task = new TransferTask
        {
            Type = TransferType.Delete,
            FileName = $"{objects.Count} objects",
            RemotePath = string.Join(", ", objects.Take(3).Select(o => o.Name)),
            BucketName = bucketName,
            TotalCount = objects.Count,
            Status = TransferStatus.Queued
        };

        ActiveTasks.Add(task);
        _logger.LogInformation("Delete queued: {Count} objects from {Bucket}", objects.Count, bucketName);

        OnPropertyChanged(nameof(IsTransferring));
    }

    // ========================================================================
    // Private Methods
    // ========================================================================

    /// <summary>
    /// Background task processor that handles queued transfers.
    /// </summary>
    private async Task ProcessQueueAsync()
    {
        _logger.LogInformation("Transfer queue processor started");

        while (!_disposed)
        {
            try
            {
                // Process uploads
                var queuedUploads = ActiveTasks
                    .Where(t => t.Type == TransferType.Upload && t.Status == TransferStatus.Queued)
                    .ToList();

                foreach (var task in queuedUploads)
                {
                    _ = ProcessUploadAsync(task);
                }

                // Process downloads
                var queuedDownloads = ActiveTasks
                    .Where(t => t.Type == TransferType.Download && t.Status == TransferStatus.Queued)
                    .ToList();

                foreach (var task in queuedDownloads)
                {
                    _ = ProcessDownloadAsync(task);
                }

                // Process deletes
                var queuedDeletes = ActiveTasks
                    .Where(t => t.Type == TransferType.Delete && t.Status == TransferStatus.Queued)
                    .ToList();

                foreach (var task in queuedDeletes)
                {
                    _ = ProcessDeleteAsync(task);
                }

                await Task.Delay(500); // Check queue every 500ms
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in queue processor");
            }
        }

        _logger.LogInformation("Transfer queue processor stopped");
    }

    /// <summary>
    /// Processes an upload task.
    /// </summary>
    private async Task ProcessUploadAsync(TransferTask task)
    {
        if (task.LocalPath == null || !File.Exists(task.LocalPath))
        {
            MoveToFailed(task, "File not found");
            return;
        }

        await _uploadSemaphore.WaitAsync();

        try
        {
            var cts = new CancellationTokenSource();
            _taskCancellations[task.Id] = cts;

            task.Status = TransferStatus.Uploading;
            task.StartedAt = DateTime.UtcNow;
            OnPropertyChanged(nameof(IsTransferring));
            OnPropertyChanged(nameof(ActiveUploadCount));

            var progress = new Progress<long>(bytesTransferred =>
            {
                task.TransferredSize = bytesTransferred;
                task.Speed = CalculateSpeed(task);
            });

            await _apiClient.UploadFileAsync(
                task.BucketName,
                task.RemotePath,
                task.LocalPath,
                progress: progress,
                cancellationToken: cts.Token);

            MoveToCompleted(task);
            _logger.LogInformation("Upload completed: {File}", task.FileName);
        }
        catch (OperationCanceledException)
        {
            task.Status = TransferStatus.Cancelled;
            task.CompletedAt = DateTime.UtcNow;
            MoveToFailed(task, "Cancelled by user");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Upload failed: {File}", task.FileName);
            MoveToFailed(task, ex.Message);
        }
        finally
        {
            _uploadSemaphore.Release();
            _taskCancellations.Remove(task.Id);
            OnPropertyChanged(nameof(ActiveUploadCount));
        }
    }

    /// <summary>
    /// Processes a download task.
    /// </summary>
    private async Task ProcessDownloadAsync(TransferTask task)
    {
        if (task.LocalPath == null)
        {
            MoveToFailed(task, "Invalid destination path");
            return;
        }

        await _downloadSemaphore.WaitAsync();

        try
        {
            var cts = new CancellationTokenSource();
            _taskCancellations[task.Id] = cts;

            task.Status = TransferStatus.Downloading;
            task.StartedAt = DateTime.UtcNow;
            OnPropertyChanged(nameof(IsTransferring));
            OnPropertyChanged(nameof(ActiveDownloadCount));

            var progress = new Progress<long>(bytesTransferred =>
            {
                task.TransferredSize = bytesTransferred;
                task.Speed = CalculateSpeed(task);
            });

            await _apiClient.DownloadObjectToFileAsync(
                task.BucketName,
                task.RemotePath,
                task.LocalPath,
                progress: progress,
                cancellationToken: cts.Token);

            MoveToCompleted(task);
            _logger.LogInformation("Download completed: {File}", task.FileName);
        }
        catch (OperationCanceledException)
        {
            task.Status = TransferStatus.Cancelled;
            task.CompletedAt = DateTime.UtcNow;
            MoveToFailed(task, "Cancelled by user");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Download failed: {File}", task.FileName);
            MoveToFailed(task, ex.Message);
        }
        finally
        {
            _downloadSemaphore.Release();
            _taskCancellations.Remove(task.Id);
            OnPropertyChanged(nameof(ActiveDownloadCount));
        }
    }

    /// <summary>
    /// Processes a delete task.
    /// </summary>
    private async Task ProcessDeleteAsync(TransferTask task)
    {
        try
        {
            var cts = new CancellationTokenSource();
            _taskCancellations[task.Id] = cts;

            task.Status = TransferStatus.Deleting;
            task.StartedAt = DateTime.UtcNow;
            OnPropertyChanged(nameof(IsTransferring));

            await _apiClient.DeleteObjectAsync(task.BucketName, task.RemotePath, cts.Token);

            MoveToCompleted(task);
            _logger.LogInformation("Delete completed: {Key}", task.RemotePath);
        }
        catch (OperationCanceledException)
        {
            task.Status = TransferStatus.Cancelled;
            task.CompletedAt = DateTime.UtcNow;
            MoveToFailed(task, "Cancelled by user");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Delete failed: {Key}", task.RemotePath);
            MoveToFailed(task, ex.Message);
        }
        finally
        {
            _taskCancellations.Remove(task.Id);
        }
    }

    /// <summary>
    /// Moves a task to the completed collection.
    /// </summary>
    private void MoveToCompleted(TransferTask task)
    {
        task.Status = TransferStatus.Completed;
        task.CompletedAt = DateTime.UtcNow;
        task.TransferredSize = task.TotalSize;

        ActiveTasks.Remove(task);
        CompletedTasks.Insert(0, task);

        OnPropertyChanged(nameof(IsTransferring));
    }

    /// <summary>
    /// Moves a task to the failed collection.
    /// </summary>
    private void MoveToFailed(TransferTask task, string error)
    {
        task.Status = TransferStatus.Failed;
        task.CompletedAt = DateTime.UtcNow;
        task.Error = error;

        ActiveTasks.Remove(task);
        FailedTasks.Insert(0, task);

        OnPropertyChanged(nameof(IsTransferring));
    }

    /// <summary>
    /// Calculates transfer speed in bytes per second.
    /// </summary>
    private static double CalculateSpeed(TransferTask task)
    {
        if (task.StartedAt == null)
        {
            return 0;
        }

        var elapsed = (DateTime.UtcNow - task.StartedAt.Value).TotalSeconds;
        if (elapsed <= 0)
        {
            return 0;
        }

        return task.TransferredSize / elapsed;
    }

    /// <summary>
    /// Updates a semaphore's capacity.
    /// </summary>
    private static void UpdateSemaphore(SemaphoreSlim semaphore, int newCapacity)
    {
        // Note: SemaphoreSlim doesn't support changing capacity at runtime
        // This is a limitation - would need to recreate the semaphore
        // For now, this just logs the change
    }

    // ========================================================================
    // Command Implementations
    // ========================================================================

    private void PauseTransfer(Guid taskId)
    {
        var task = ActiveTasks.FirstOrDefault(t => t.Id == taskId);
        if (task == null || !task.CanPause)
        {
            return;
        }

        // Pause is not fully supported in this implementation
        // Would require pausable HttpClient requests
        _logger.LogInformation("Pause requested for task {TaskId}", taskId);
    }

    private bool CanPauseTransfer(Guid taskId)
    {
        var task = ActiveTasks.FirstOrDefault(t => t.Id == taskId);
        return task?.CanPause ?? false;
    }

    private void ResumeTransfer(Guid taskId)
    {
        var task = ActiveTasks.FirstOrDefault(t => t.Id == taskId);
        if (task == null || !task.CanResume)
        {
            return;
        }

        task.Status = TransferStatus.Queued;
        _logger.LogInformation("Resume requested for task {TaskId}", taskId);
    }

    private bool CanResumeTransfer(Guid taskId)
    {
        var task = ActiveTasks.FirstOrDefault(t => t.Id == taskId);
        return task?.CanResume ?? false;
    }

    private void CancelTransfer(Guid taskId)
    {
        if (_taskCancellations.TryGetValue(taskId, out var cts))
        {
            cts.Cancel();
            _logger.LogInformation("Cancel requested for task {TaskId}", taskId);
        }
    }

    private bool CanCancelTransfer(Guid taskId)
    {
        var task = ActiveTasks.FirstOrDefault(t => t.Id == taskId);
        return task?.CanCancel ?? false;
    }

    private Task RetryTransferAsync(Guid taskId)
    {
        var task = FailedTasks.FirstOrDefault(t => t.Id == taskId);
        if (task == null)
        {
            return Task.CompletedTask;
        }

        _logger.LogInformation("Retrying task {TaskId}", taskId);

        FailedTasks.Remove(task);
        task.Status = TransferStatus.Queued;
        task.Error = null;
        task.TransferredSize = 0;
        task.StartedAt = null;
        task.CompletedAt = null;

        ActiveTasks.Add(task);

        return Task.CompletedTask;
    }

    private bool CanRetryTransfer(Guid taskId)
    {
        var task = FailedTasks.FirstOrDefault(t => t.Id == taskId);
        return task?.CanRetry ?? false;
    }

    private void ClearCompleted()
    {
        var count = CompletedTasks.Count;
        CompletedTasks.Clear();
        _logger.LogInformation("Cleared {Count} completed tasks", count);
    }

    private void ClearFailed()
    {
        var count = FailedTasks.Count;
        FailedTasks.Clear();
        _logger.LogInformation("Cleared {Count} failed tasks", count);
    }

    // ========================================================================
    // IDisposable
    // ========================================================================

    public void Dispose()
    {
        if (_disposed)
        {
            return;
        }

        _disposed = true;

        // Cancel all active transfers
        foreach (var cts in _taskCancellations.Values)
        {
            cts.Cancel();
            cts.Dispose();
        }

        _taskCancellations.Clear();

        _uploadSemaphore.Dispose();
        _downloadSemaphore.Dispose();

        _logger.LogInformation("TransferManagerViewModel disposed");
    }
}
