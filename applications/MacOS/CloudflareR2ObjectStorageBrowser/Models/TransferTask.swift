import Foundation

/// Represents a file transfer task (upload or download)
struct TransferTask: Identifiable, Equatable {
    let id: UUID
    let type: TransferType
    let fileName: String
    let localPath: URL?
    let remotePath: String
    let bucketName: String
    let totalSize: Int64
    var transferredSize: Int64
    var status: TransferStatus
    var speed: Double // bytes per second
    var error: String?
    let createdAt: Date
    var startedAt: Date?
    var completedAt: Date?

    init(
        id: UUID = UUID(),
        type: TransferType,
        fileName: String,
        localPath: URL? = nil,
        remotePath: String,
        bucketName: String,
        totalSize: Int64,
        transferredSize: Int64 = 0,
        status: TransferStatus = .queued,
        speed: Double = 0,
        error: String? = nil,
        createdAt: Date = Date(),
        startedAt: Date? = nil,
        completedAt: Date? = nil
    ) {
        self.id = id
        self.type = type
        self.fileName = fileName
        self.localPath = localPath
        self.remotePath = remotePath
        self.bucketName = bucketName
        self.totalSize = totalSize
        self.transferredSize = transferredSize
        self.status = status
        self.speed = speed
        self.error = error
        self.createdAt = createdAt
        self.startedAt = startedAt
        self.completedAt = completedAt
    }

    // Progress (0.0 to 1.0)
    var progress: Double {
        guard totalSize > 0 else { return 0 }
        return Double(transferredSize) / Double(totalSize)
    }

    // Progress percentage (0 to 100)
    var progressPercentage: Int {
        Int(progress * 100)
    }

    // Human-readable speed
    var humanReadableSpeed: String {
        ByteCountFormatter.string(fromByteCount: Int64(speed), countStyle: .file) + "/s"
    }

    // Estimated time remaining
    var estimatedTimeRemaining: TimeInterval? {
        guard status == .uploading || status == .downloading,
              speed > 0,
              totalSize > transferredSize else {
            return nil
        }

        let remainingBytes = totalSize - transferredSize
        return Double(remainingBytes) / speed
    }

    // Human-readable time remaining
    var humanReadableTimeRemaining: String? {
        guard let timeRemaining = estimatedTimeRemaining else {
            return nil
        }

        let formatter = DateComponentsFormatter()
        formatter.unitsStyle = .abbreviated
        formatter.allowedUnits = [.hour, .minute, .second]
        formatter.maximumUnitCount = 2
        return formatter.string(from: timeRemaining)
    }

    // Human-readable total size
    var humanReadableTotalSize: String {
        ByteCountFormatter.string(fromByteCount: totalSize, countStyle: .file)
    }

    // Human-readable transferred size
    var humanReadableTransferredSize: String {
        ByteCountFormatter.string(fromByteCount: transferredSize, countStyle: .file)
    }

    // Duration
    var duration: TimeInterval? {
        guard let completedAt = completedAt,
              let startedAt = startedAt else {
            return nil
        }
        return completedAt.timeIntervalSince(startedAt)
    }

    // Can be paused
    var canPause: Bool {
        status == .uploading || status == .downloading
    }

    // Can be resumed
    var canResume: Bool {
        status == .paused
    }

    // Can be cancelled
    var canCancel: Bool {
        status == .queued || status == .uploading || status == .downloading || status == .paused
    }

    // Can be retried
    var canRetry: Bool {
        status == .failed || status == .cancelled
    }

    static func == (lhs: TransferTask, rhs: TransferTask) -> Bool {
        lhs.id == rhs.id
    }
}

// MARK: - Transfer Type

enum TransferType: String, Codable {
    case upload = "Upload"
    case download = "Download"
    case delete = "Delete"
}

// MARK: - Transfer Status

enum TransferStatus: String, Codable {
    case queued = "Queued"
    case uploading = "Uploading"
    case downloading = "Downloading"
    case deleting = "Deleting"
    case paused = "Paused"
    case completed = "Completed"
    case failed = "Failed"
    case cancelled = "Cancelled"

    var isActive: Bool {
        self == .uploading || self == .downloading || self == .deleting
    }

    var isInProgress: Bool {
        self == .queued || self == .uploading || self == .downloading || self == .deleting || self == .paused
    }

    var isFinished: Bool {
        self == .completed || self == .failed || self == .cancelled
    }
}
