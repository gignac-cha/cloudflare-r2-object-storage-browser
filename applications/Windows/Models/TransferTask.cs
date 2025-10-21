namespace CloudflareR2Browser.Models;

/// <summary>
/// Transfer type enumeration.
/// </summary>
public enum TransferType
{
    /// <summary>
    /// Upload operation.
    /// </summary>
    Upload,

    /// <summary>
    /// Download operation.
    /// </summary>
    Download,

    /// <summary>
    /// Delete operation.
    /// </summary>
    Delete
}

/// <summary>
/// Transfer status enumeration.
/// </summary>
public enum TransferStatus
{
    /// <summary>
    /// Task is queued and waiting to start.
    /// </summary>
    Queued,

    /// <summary>
    /// Upload in progress.
    /// </summary>
    Uploading,

    /// <summary>
    /// Download in progress.
    /// </summary>
    Downloading,

    /// <summary>
    /// Delete in progress.
    /// </summary>
    Deleting,

    /// <summary>
    /// Task is paused.
    /// </summary>
    Paused,

    /// <summary>
    /// Task completed successfully.
    /// </summary>
    Completed,

    /// <summary>
    /// Task failed with error.
    /// </summary>
    Failed,

    /// <summary>
    /// Task was cancelled by user.
    /// </summary>
    Cancelled
}

/// <summary>
/// Represents a transfer task (upload, download, or delete) in the transfer queue.
/// </summary>
public sealed class TransferTask
{
    /// <summary>
    /// Unique identifier for the transfer task.
    /// </summary>
    public Guid Id { get; init; } = Guid.NewGuid();

    /// <summary>
    /// Type of transfer operation.
    /// </summary>
    public required TransferType Type { get; init; }

    /// <summary>
    /// Name of the file being transferred.
    /// </summary>
    public required string FileName { get; init; }

    /// <summary>
    /// Local file system path (for uploads and downloads).
    /// </summary>
    public string? LocalPath { get; init; }

    /// <summary>
    /// Remote path/key in the R2 bucket.
    /// </summary>
    public required string RemotePath { get; init; }

    /// <summary>
    /// Name of the R2 bucket.
    /// </summary>
    public required string BucketName { get; init; }

    /// <summary>
    /// Total size in bytes (for file transfers).
    /// </summary>
    public long TotalSize { get; set; }

    /// <summary>
    /// Total count of items (for batch operations).
    /// </summary>
    public int TotalCount { get; set; } = 1;

    /// <summary>
    /// Number of bytes transferred so far.
    /// </summary>
    public long TransferredSize { get; set; }

    /// <summary>
    /// Number of items transferred so far.
    /// </summary>
    public int TransferredCount { get; set; }

    /// <summary>
    /// Current status of the transfer.
    /// </summary>
    public TransferStatus Status { get; set; } = TransferStatus.Queued;

    /// <summary>
    /// Current transfer speed in bytes per second.
    /// </summary>
    public double Speed { get; set; }

    /// <summary>
    /// Error message if the transfer failed.
    /// </summary>
    public string? Error { get; set; }

    /// <summary>
    /// Timestamp when the task was created.
    /// </summary>
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;

    /// <summary>
    /// Timestamp when the task started (null if not started).
    /// </summary>
    public DateTime? StartedAt { get; set; }

    /// <summary>
    /// Timestamp when the task completed (null if not completed).
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    // ========================================================================
    // Computed Properties
    // ========================================================================

    /// <summary>
    /// Gets the transfer progress as a value between 0 and 1.
    /// </summary>
    public double Progress
    {
        get
        {
            if (TotalSize == 0 && TotalCount == 0) return 0;

            // For file transfers, use size-based progress
            if (TotalSize > 0)
                return TotalSize > 0 ? (double)TransferredSize / TotalSize : 0;

            // For batch operations, use count-based progress
            return TotalCount > 0 ? (double)TransferredCount / TotalCount : 0;
        }
    }

    /// <summary>
    /// Gets the transfer progress as a percentage (0-100).
    /// </summary>
    public double ProgressPercentage => Progress * 100;

    /// <summary>
    /// Gets a human-readable representation of the transfer speed.
    /// </summary>
    public string HumanReadableSpeed
    {
        get
        {
            if (Speed <= 0) return "0 B/s";

            string[] units = ["B/s", "KB/s", "MB/s", "GB/s"];
            double speed = Speed;
            int unitIndex = 0;

            while (speed >= 1024 && unitIndex < units.Length - 1)
            {
                speed /= 1024;
                unitIndex++;
            }

            return $"{speed:0.##} {units[unitIndex]}";
        }
    }

    /// <summary>
    /// Gets the estimated time remaining in seconds (null if cannot be estimated).
    /// </summary>
    public double? EstimatedTimeRemaining
    {
        get
        {
            if (Speed <= 0 || TotalSize <= 0) return null;

            var remainingBytes = TotalSize - TransferredSize;
            return remainingBytes > 0 ? remainingBytes / Speed : 0;
        }
    }

    /// <summary>
    /// Gets a human-readable representation of the estimated time remaining.
    /// </summary>
    public string HumanReadableTimeRemaining
    {
        get
        {
            var secondsRemaining = EstimatedTimeRemaining;
            if (secondsRemaining is null or <= 0)
                return "Calculating...";

            var timeSpan = TimeSpan.FromSeconds(secondsRemaining.Value);

            if (timeSpan.TotalHours >= 1)
                return $"{timeSpan.Hours}h {timeSpan.Minutes}m";
            if (timeSpan.TotalMinutes >= 1)
                return $"{timeSpan.Minutes}m {timeSpan.Seconds}s";

            return $"{timeSpan.Seconds}s";
        }
    }

    /// <summary>
    /// Gets the duration of the transfer (null if not started or still in progress).
    /// </summary>
    public TimeSpan? Duration
    {
        get
        {
            if (StartedAt is null) return null;

            var endTime = CompletedAt ?? DateTime.UtcNow;
            return endTime - StartedAt.Value;
        }
    }

    /// <summary>
    /// Gets a human-readable representation of the duration.
    /// </summary>
    public string HumanReadableDuration
    {
        get
        {
            var duration = Duration;
            if (duration is null) return "Not started";

            if (duration.Value.TotalHours >= 1)
                return $"{duration.Value.Hours}h {duration.Value.Minutes}m {duration.Value.Seconds}s";
            if (duration.Value.TotalMinutes >= 1)
                return $"{duration.Value.Minutes}m {duration.Value.Seconds}s";

            return $"{duration.Value.Seconds}s";
        }
    }

    /// <summary>
    /// Indicates if the task is currently active (in progress).
    /// </summary>
    public bool IsActive => Status is TransferStatus.Uploading or TransferStatus.Downloading or TransferStatus.Deleting;

    /// <summary>
    /// Indicates if the task is in a terminal state (completed, failed, or cancelled).
    /// </summary>
    public bool IsTerminal => Status is TransferStatus.Completed or TransferStatus.Failed or TransferStatus.Cancelled;

    /// <summary>
    /// Indicates if the task can be retried.
    /// </summary>
    public bool CanRetry => Status is TransferStatus.Failed or TransferStatus.Cancelled;

    /// <summary>
    /// Indicates if the task can be cancelled.
    /// </summary>
    public bool CanCancel => Status is TransferStatus.Queued or TransferStatus.Uploading or TransferStatus.Downloading or TransferStatus.Deleting or TransferStatus.Paused;

    /// <summary>
    /// Indicates if the task can be paused.
    /// </summary>
    public bool CanPause => Status is TransferStatus.Uploading or TransferStatus.Downloading;

    /// <summary>
    /// Indicates if the task can be resumed.
    /// </summary>
    public bool CanResume => Status is TransferStatus.Paused;
}
