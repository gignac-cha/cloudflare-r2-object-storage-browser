import Foundation
import Combine

/// ViewModel for managing file transfers (uploads/downloads)
@MainActor
class TransferManagerViewModel: ObservableObject {
    // MARK: - Published Properties

    @Published var activeTasks: [TransferTask] = []
    @Published var completedTasks: [TransferTask] = []
    @Published var failedTasks: [TransferTask] = []

    @Published var maxConcurrentUploads: Int = 3
    @Published var maxConcurrentDownloads: Int = 5
    @Published var autoRetryOnFailure: Bool = true
    @Published var maxRetryAttempts: Int = 1

    // MARK: - Dependencies

    private var apiClient: APIClient
    private var cancellables = Set<AnyCancellable>()
    private var activeDownloadTasks: [UUID: URLSessionDownloadTask] = [:]

    // MARK: - Computed Properties

    var allTasks: [TransferTask] {
        activeTasks + completedTasks + failedTasks
    }

    var queuedTasks: [TransferTask] {
        activeTasks.filter { $0.status == .queued }
    }

    var inProgressTasks: [TransferTask] {
        activeTasks.filter { $0.status.isActive }
    }

    var uploadingCount: Int {
        activeTasks.filter { $0.type == .upload && $0.status == .uploading }.count
    }

    var downloadingCount: Int {
        activeTasks.filter { $0.type == .download && $0.status == .downloading }.count
    }

    var totalProgress: Double {
        guard !activeTasks.isEmpty else { return 0 }
        let totalProgress = activeTasks.reduce(0.0) { $0 + $1.progress }
        return totalProgress / Double(activeTasks.count)
    }

    var totalProgressPercentage: Int {
        Int(totalProgress * 100)
    }

    // MARK: - Initialization

    init(apiClient: APIClient) {
        self.apiClient = apiClient
    }

    // Update API client (e.g., when server port changes)
    func updateAPIClient(_ newClient: APIClient) {
        self.apiClient = newClient
    }

    // MARK: - Public Methods - Upload

    /// Upload a file
    func uploadFile(
        localURL: URL,
        bucket: String,
        remotePath: String
    ) async throws {
        // Get file size
        let attributes = try FileManager.default.attributesOfItem(atPath: localURL.path)
        guard let fileSize = attributes[.size] as? Int64 else {
            throw R2Error.configurationError("Unable to determine file size")
        }

        // Read file data
        let data = try Data(contentsOf: localURL)

        // Create task
        let task = TransferTask(
            type: .upload,
            fileName: localURL.lastPathComponent,
            localPath: localURL,
            remotePath: remotePath,
            bucketName: bucket,
            totalSize: fileSize,
            status: .queued
        )

        // Add to queue
        addTask(task)

        // Start upload
        await processUploadQueue()
    }

    /// Upload multiple files
    func uploadFiles(
        localURLs: [URL],
        bucket: String,
        remotePrefix: String
    ) async {
        for url in localURLs {
            let remotePath = remotePrefix + url.lastPathComponent
            try? await uploadFile(localURL: url, bucket: bucket, remotePath: remotePath)
        }
    }

    // MARK: - Public Methods - Download

    /// Download a file
    func downloadFile(
        object: R2Object,
        bucket: String,
        destinationURL: URL
    ) async throws {
        // Create task
        let task = TransferTask(
            type: .download,
            fileName: object.name,
            localPath: destinationURL,
            remotePath: object.key,
            bucketName: bucket,
            totalSize: object.size,
            status: .queued
        )

        // Add to queue
        addTask(task)

        // Start download
        await processDownloadQueue()
    }

    /// Download multiple files
    func downloadFiles(
        objects: [R2Object],
        bucket: String,
        destinationDirectory: URL
    ) async {
        for object in objects {
            let destinationURL = destinationDirectory.appendingPathComponent(object.name)
            try? await downloadFile(object: object, bucket: bucket, destinationURL: destinationURL)
        }
    }

    // MARK: - Public Methods - Delete

    /// Delete objects
    func deleteObjects(
        objects: [R2Object],
        bucket: String,
        onProgress: ((Int, Int) -> Void)? = nil
    ) async throws {
        // Separate folders and files first
        let folders = objects.filter { $0.isFolder }
        let files = objects.filter { !$0.isFolder }

        // Calculate total items (need to count items inside folders)
        var totalItems = files.count

        // For folders, we need to list them first to get accurate count
        for folder in folders {
            do {
                let response = try await apiClient.listObjects(
                    bucket: bucket,
                    prefix: folder.key,
                    delimiter: "",
                    maxKeys: 1000
                )
                totalItems += response.data.count

                // Handle pagination
                var continuationToken = response.pagination.continuationToken
                while continuationToken != nil {
                    let nextResponse = try await apiClient.listObjects(
                        bucket: bucket,
                        prefix: folder.key,
                        delimiter: "",
                        maxKeys: 1000,
                        continuationToken: continuationToken
                    )
                    totalItems += nextResponse.data.count
                    continuationToken = nextResponse.pagination.continuationToken
                }
            } catch {
                // If we can't list, just count the folder as 1 item
                totalItems += 1
            }
        }

        // Create a single task for all deletions
        // Use actual object count as totalSize for progress tracking
        let fileName: String
        if objects.count == 1 {
            fileName = objects[0].name
        } else {
            let folderCount = folders.count
            let fileCount = files.count
            if folderCount > 0 && fileCount > 0 {
                fileName = "\(folderCount) folders, \(fileCount) files"
            } else if folderCount > 0 {
                fileName = "\(folderCount) folder\(folderCount > 1 ? "s" : "")"
            } else {
                fileName = "\(fileCount) file\(fileCount > 1 ? "s" : "")"
            }
        }

        let task = TransferTask(
            type: .delete,
            fileName: fileName,
            localPath: nil,
            remotePath: objects.count == 1 ? objects[0].key : "",
            bucketName: bucket,
            totalSize: Int64(totalItems),
            status: .queued
        )

        // Add to queue
        addTask(task)

        // Start delete immediately
        await performDelete(task, objects: objects, onProgress: onProgress)
    }

    // MARK: - Public Methods - Control

    /// Pause a transfer
    func pauseTransfer(_ taskId: UUID) {
        guard let index = activeTasks.firstIndex(where: { $0.id == taskId }) else { return }

        var task = activeTasks[index]
        guard task.canPause else { return }

        task.status = .paused
        activeTasks[index] = task

        // Cancel underlying task
        if task.type == .download, let downloadTask = activeDownloadTasks[taskId] {
            downloadTask.cancel()
            activeDownloadTasks.removeValue(forKey: taskId)
        }
    }

    /// Resume a transfer
    func resumeTransfer(_ taskId: UUID) async {
        guard let index = activeTasks.firstIndex(where: { $0.id == taskId }) else { return }

        var task = activeTasks[index]
        guard task.canResume else { return }

        task.status = .queued
        activeTasks[index] = task

        // Restart processing
        if task.type == .upload {
            await processUploadQueue()
        } else {
            await processDownloadQueue()
        }
    }

    /// Cancel a transfer
    func cancelTransfer(_ taskId: UUID) {
        guard let index = activeTasks.firstIndex(where: { $0.id == taskId }) else { return }

        var task = activeTasks[index]
        guard task.canCancel else { return }

        task.status = .cancelled
        task.completedAt = Date()

        // Move to failed list
        activeTasks.remove(at: index)
        failedTasks.insert(task, at: 0)

        // Cancel underlying task
        if task.type == .download, let downloadTask = activeDownloadTasks[taskId] {
            downloadTask.cancel()
            activeDownloadTasks.removeValue(forKey: taskId)
        }
    }

    /// Retry a failed transfer
    func retryTransfer(_ taskId: UUID) async {
        guard let index = failedTasks.firstIndex(where: { $0.id == taskId }) else { return }

        var task = failedTasks.remove(at: index)
        task.status = .queued
        task.transferredSize = 0
        task.error = nil
        task.startedAt = nil
        task.completedAt = nil

        // Add back to active
        activeTasks.append(task)

        // Restart processing
        if task.type == .upload {
            await processUploadQueue()
        } else {
            await processDownloadQueue()
        }
    }

    /// Clear completed tasks
    func clearCompletedTasks() {
        completedTasks.removeAll()
    }

    /// Clear failed tasks
    func clearFailedTasks() {
        failedTasks.removeAll()
    }

    /// Remove task from list
    func removeTask(_ taskId: UUID) {
        failedTasks.removeAll { $0.id == taskId }
        completedTasks.removeAll { $0.id == taskId }
    }

    // MARK: - Private Methods

    private func addTask(_ task: TransferTask) {
        activeTasks.append(task)
    }

    private func processUploadQueue() async {
        // Get queued uploads
        let queuedUploads = activeTasks.filter { $0.type == .upload && $0.status == .queued }

        // Check if we can start more uploads
        let availableSlots = maxConcurrentUploads - uploadingCount
        guard availableSlots > 0 else { return }

        // Start uploads
        for task in queuedUploads.prefix(availableSlots) {
            await performUpload(task)
        }
    }

    private func performUpload(_ task: TransferTask) async {
        guard let index = activeTasks.firstIndex(where: { $0.id == task.id }) else { return }

        // Update status
        var updatedTask = activeTasks[index]
        updatedTask.status = .uploading
        updatedTask.startedAt = Date()
        activeTasks[index] = updatedTask

        // Read file data
        guard let localPath = task.localPath else {
            await markTaskFailed(task.id, error: "Local file path not found")
            return
        }

        do {
            let data = try Data(contentsOf: localPath)

            // Perform upload
            let startTime = Date()
            let response = try await apiClient.uploadObject(
                bucket: task.bucketName,
                key: task.remotePath,
                data: data
            )
            let endTime = Date()

            // Calculate speed
            let duration = endTime.timeIntervalSince(startTime)
            let speed = duration > 0 ? Double(data.count) / duration : 0

            // Update task
            guard let currentIndex = activeTasks.firstIndex(where: { $0.id == task.id }) else { return }
            var completedTask = activeTasks[currentIndex]
            completedTask.status = .completed
            completedTask.transferredSize = task.totalSize
            completedTask.speed = speed
            completedTask.completedAt = Date()

            // Move to completed list
            activeTasks.remove(at: currentIndex)
            completedTasks.insert(completedTask, at: 0)

            // Limit completed list size
            if completedTasks.count > 50 {
                completedTasks.removeLast()
            }

            // Process next in queue
            await processUploadQueue()

        } catch {
            await markTaskFailed(task.id, error: error.localizedDescription)

            // Auto-retry if enabled
            if autoRetryOnFailure {
                // TODO: Implement retry logic with exponential backoff
            }
        }
    }

    private func processDownloadQueue() async {
        // Get queued downloads
        let queuedDownloads = activeTasks.filter { $0.type == .download && $0.status == .queued }

        // Check if we can start more downloads
        let availableSlots = maxConcurrentDownloads - downloadingCount
        guard availableSlots > 0 else { return }

        // Start downloads
        for task in queuedDownloads.prefix(availableSlots) {
            await performDownload(task)
        }
    }

    private func performDownload(_ task: TransferTask) async {
        guard let index = activeTasks.firstIndex(where: { $0.id == task.id }) else { return }

        // Update status
        var updatedTask = activeTasks[index]
        updatedTask.status = .downloading
        updatedTask.startedAt = Date()
        activeTasks[index] = updatedTask

        do {
            // Perform download
            let startTime = Date()
            let (data, response) = try await apiClient.downloadObject(
                bucket: task.bucketName,
                key: task.remotePath
            )
            let endTime = Date()

            // Save to disk
            guard let destinationURL = task.localPath else {
                await markTaskFailed(task.id, error: "Destination path not found")
                return
            }

            try data.write(to: destinationURL)

            // Calculate speed
            let duration = endTime.timeIntervalSince(startTime)
            let speed = duration > 0 ? Double(data.count) / duration : 0

            // Update task
            guard let currentIndex = activeTasks.firstIndex(where: { $0.id == task.id }) else { return }
            var completedTask = activeTasks[currentIndex]
            completedTask.status = .completed
            completedTask.transferredSize = Int64(data.count)
            completedTask.speed = speed
            completedTask.completedAt = Date()

            // Move to completed list
            activeTasks.remove(at: currentIndex)
            completedTasks.insert(completedTask, at: 0)

            // Limit completed list size
            if completedTasks.count > 50 {
                completedTasks.removeLast()
            }

            // Process next in queue
            await processDownloadQueue()

        } catch {
            await markTaskFailed(task.id, error: error.localizedDescription)
        }
    }

    private func performDelete(
        _ task: TransferTask,
        objects: [R2Object],
        onProgress: ((Int, Int) -> Void)? = nil
    ) async {
        guard let index = activeTasks.firstIndex(where: { $0.id == task.id }) else { return }

        // Update status
        var updatedTask = activeTasks[index]
        updatedTask.status = .deleting
        updatedTask.startedAt = Date()
        activeTasks[index] = updatedTask

        do {
            let startTime = Date()

            // Separate folders and files
            let folders = objects.filter { $0.isFolder }
            let files = objects.filter { !$0.isFolder }
            var totalDeleted = 0
            let totalCount = objects.count

            // Delete folders first (with progress tracking for each item inside)
            for folder in folders {
                let folderDeletedCount = try await apiClient.deleteFolder(
                    bucket: task.bucketName,
                    prefix: folder.key,
                    onProgress: { [weak self] current, total in
                        Task { @MainActor [weak self] in
                            guard let self = self else { return }
                            let currentTotal = totalDeleted + current
                            onProgress?(currentTotal, Int(task.totalSize))

                            // Update task progress
                            guard let currentIndex = self.activeTasks.firstIndex(where: { $0.id == task.id }) else { return }
                            var progressTask = self.activeTasks[currentIndex]
                            progressTask.transferredSize = Int64(currentTotal)
                            self.activeTasks[currentIndex] = progressTask
                        }
                    }
                )

                // After folder completes, add the count
                totalDeleted += folderDeletedCount

                // Update progress after folder deletion completes
                guard let currentIndex = self.activeTasks.firstIndex(where: { $0.id == task.id }) else { return }
                var progressTask = self.activeTasks[currentIndex]
                progressTask.transferredSize = Int64(totalDeleted)
                self.activeTasks[currentIndex] = progressTask
                onProgress?(totalDeleted, Int(task.totalSize))
            }

            // Delete files using batch
            if !files.isEmpty {
                let keys = files.map { $0.key }
                try await apiClient.deleteObjects(
                    bucket: task.bucketName,
                    keys: keys,
                    onProgress: { [weak self] current, total in
                        Task { @MainActor [weak self] in
                            guard let self = self else { return }
                            onProgress?(totalDeleted + current, totalCount)

                            // Update task progress
                            guard let currentIndex = self.activeTasks.firstIndex(where: { $0.id == task.id }) else { return }
                            var progressTask = self.activeTasks[currentIndex]
                            progressTask.transferredSize = Int64(totalDeleted + current)
                            self.activeTasks[currentIndex] = progressTask
                            self.objectWillChange.send()
                        }
                    }
                )
                totalDeleted += files.count
            }

            let endTime = Date()

            // Calculate speed (items per second)
            let duration = endTime.timeIntervalSince(startTime)
            let speed = duration > 0 ? Double(totalCount) / duration : 0

            // Update task
            guard let currentIndex = activeTasks.firstIndex(where: { $0.id == task.id }) else { return }
            var completedTask = activeTasks[currentIndex]
            completedTask.status = .completed
            completedTask.transferredSize = Int64(totalCount)
            completedTask.speed = speed
            completedTask.completedAt = Date()

            // Move to completed list
            activeTasks.remove(at: currentIndex)
            completedTasks.insert(completedTask, at: 0)

            // Limit completed list size
            if completedTasks.count > 50 {
                completedTasks.removeLast()
            }

        } catch {
            await markTaskFailed(task.id, error: error.localizedDescription)
        }
    }

    private func markTaskFailed(_ taskId: UUID, error: String) async {
        guard let index = activeTasks.firstIndex(where: { $0.id == taskId }) else { return }

        var task = activeTasks[index]
        task.status = .failed
        task.error = error
        task.completedAt = Date()

        // Move to failed list
        activeTasks.remove(at: index)
        failedTasks.insert(task, at: 0)

        // Limit failed list size
        if failedTasks.count > 50 {
            failedTasks.removeLast()
        }
    }
}
