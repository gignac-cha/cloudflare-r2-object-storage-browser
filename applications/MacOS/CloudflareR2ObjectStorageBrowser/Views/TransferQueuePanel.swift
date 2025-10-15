import SwiftUI

struct TransferQueuePanel: View {
    @ObservedObject var transferManager: TransferManagerViewModel
    @Binding var isVisible: Bool

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Image(systemName: "arrow.up.arrow.down.circle.fill")
                    .foregroundStyle(.blue)

                Text("Transfers")
                    .font(.headline)

                Spacer()

                // Stats
                if !transferManager.activeTasks.isEmpty {
                    HStack(spacing: 12) {
                        if transferManager.uploadingCount > 0 {
                            Label("\(transferManager.uploadingCount)", systemImage: "arrow.up.circle.fill")
                                .foregroundStyle(.blue)
                                .font(.caption)
                        }

                        if transferManager.downloadingCount > 0 {
                            Label("\(transferManager.downloadingCount)", systemImage: "arrow.down.circle.fill")
                                .foregroundStyle(.green)
                                .font(.caption)
                        }

                        if transferManager.queuedTasks.count > 0 {
                            Label("\(transferManager.queuedTasks.count)", systemImage: "clock")
                                .foregroundStyle(.secondary)
                                .font(.caption)
                        }
                    }
                }

                // Clear buttons
                Menu {
                    Button("Clear Completed") {
                        transferManager.clearCompletedTasks()
                    }
                    .disabled(transferManager.completedTasks.isEmpty)

                    Button("Clear Failed") {
                        transferManager.clearFailedTasks()
                    }
                    .disabled(transferManager.failedTasks.isEmpty)
                } label: {
                    Image(systemName: "ellipsis.circle")
                        .foregroundStyle(.secondary)
                }
                .menuStyle(.borderlessButton)
                .frame(width: 20)

                Button {
                    withAnimation {
                        isVisible = false
                    }
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(.secondary)
                        .font(.title3)
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(.regularMaterial)

            Divider()

            // Transfer List
            ScrollView {
                LazyVStack(spacing: 0) {
                    // Active Tasks
                    if !transferManager.activeTasks.isEmpty {
                        Section {
                            ForEach(transferManager.activeTasks) { task in
                                TransferTaskRow(
                                    task: task,
                                    onPause: {
                                        Task {
                                            await transferManager.pauseTransfer(task.id)
                                        }
                                    },
                                    onResume: {
                                        Task {
                                            await transferManager.resumeTransfer(task.id)
                                        }
                                    },
                                    onCancel: {
                                        Task {
                                            await transferManager.cancelTransfer(task.id)
                                        }
                                    }
                                )

                                if task != transferManager.activeTasks.last {
                                    Divider()
                                        .padding(.leading, 16)
                                }
                            }
                        } header: {
                            SectionHeader(title: "Active", count: transferManager.activeTasks.count)
                        }
                    }

                    // Completed Tasks
                    if !transferManager.completedTasks.isEmpty {
                        Section {
                            ForEach(transferManager.completedTasks) { task in
                                TransferTaskRow(
                                    task: task,
                                    onPause: nil,
                                    onResume: nil,
                                    onCancel: nil
                                )

                                if task != transferManager.completedTasks.last {
                                    Divider()
                                        .padding(.leading, 16)
                                }
                            }
                        } header: {
                            SectionHeader(title: "Completed", count: transferManager.completedTasks.count)
                        }
                    }

                    // Failed Tasks
                    if !transferManager.failedTasks.isEmpty {
                        Section {
                            ForEach(transferManager.failedTasks) { task in
                                TransferTaskRow(
                                    task: task,
                                    onPause: nil,
                                    onResume: nil,
                                    onCancel: nil,
                                    onRetry: {
                                        Task {
                                            await transferManager.retryTransfer(task.id)
                                        }
                                    }
                                )

                                if task != transferManager.failedTasks.last {
                                    Divider()
                                        .padding(.leading, 16)
                                }
                            }
                        } header: {
                            SectionHeader(title: "Failed", count: transferManager.failedTasks.count)
                        }
                    }

                    // Empty state
                    if transferManager.allTasks.isEmpty {
                        VStack(spacing: 12) {
                            Image(systemName: "tray")
                                .font(.system(size: 48))
                                .foregroundStyle(.quaternary)

                            Text("No transfers")
                                .font(.headline)
                                .foregroundStyle(.secondary)

                            Text("Upload or download files to see them here")
                                .font(.caption)
                                .foregroundStyle(.tertiary)
                                .multilineTextAlignment(.center)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 60)
                    }
                }
            }
        }
        .frame(height: 300)
        .background(Color(nsColor: .controlBackgroundColor))
    }
}

// MARK: - Section Header

struct SectionHeader: View {
    let title: String
    let count: Int

    var body: some View {
        HStack {
            Text(title.uppercased())
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundStyle(.secondary)

            Text("(\(count))")
                .font(.caption)
                .foregroundStyle(.tertiary)

            Spacer()
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
        .background(Color(nsColor: .controlBackgroundColor).opacity(0.5))
    }
}

// MARK: - Transfer Task Row

struct TransferTaskRow: View {
    let task: TransferTask
    let onPause: (() -> Void)?
    let onResume: (() -> Void)?
    let onCancel: (() -> Void)?
    let onRetry: (() -> Void)?

    init(
        task: TransferTask,
        onPause: (() -> Void)?,
        onResume: (() -> Void)?,
        onCancel: (() -> Void)?,
        onRetry: (() -> Void)? = nil
    ) {
        self.task = task
        self.onPause = onPause
        self.onResume = onResume
        self.onCancel = onCancel
        self.onRetry = onRetry
    }

    var body: some View {
        HStack(spacing: 12) {
            // Icon
            Image(systemName: iconName)
                .font(.title2)
                .foregroundStyle(iconColor)

            // Info
            VStack(alignment: .leading, spacing: 4) {
                Text(task.fileName)
                    .font(.system(.body, design: .monospaced))
                    .lineLimit(1)

                HStack(spacing: 8) {
                    // Status
                    StatusBadge(status: task.status)

                    // Progress info
                    if task.status.isActive {
                        Text("\(task.progressPercentage)%")
                            .font(.caption)
                            .foregroundStyle(.secondary)

                        // For delete operations, show item count instead of size
                        if task.type == .delete {
                            Text("•")
                                .foregroundStyle(.tertiary)
                            Text("\(task.transferredSize)/\(task.totalSize) items")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        } else {
                            if let timeRemaining = task.humanReadableTimeRemaining {
                                Text("•")
                                    .foregroundStyle(.tertiary)
                                Text(timeRemaining)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }

                            Text("•")
                                .foregroundStyle(.tertiary)
                            Text(task.humanReadableSpeed)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    } else if task.status == .completed {
                        if task.type == .delete {
                            Text("\(task.totalSize) items deleted")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        } else {
                            Text(task.humanReadableTotalSize)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    } else if task.status == .failed, let error = task.error {
                        Text(error)
                            .font(.caption)
                            .foregroundStyle(.red)
                            .lineLimit(1)
                    }
                }
            }

            Spacer()

            // Actions
            HStack(spacing: 8) {
                if task.canPause, let onPause = onPause {
                    Button {
                        onPause()
                    } label: {
                        Image(systemName: "pause.circle")
                            .font(.title3)
                    }
                    .buttonStyle(.plain)
                    .help("Pause")
                }

                if task.canResume, let onResume = onResume {
                    Button {
                        onResume()
                    } label: {
                        Image(systemName: "play.circle")
                            .font(.title3)
                    }
                    .buttonStyle(.plain)
                    .help("Resume")
                }

                if task.canCancel, let onCancel = onCancel {
                    Button {
                        onCancel()
                    } label: {
                        Image(systemName: "xmark.circle")
                            .font(.title3)
                            .foregroundStyle(.red)
                    }
                    .buttonStyle(.plain)
                    .help("Cancel")
                }

                if task.canRetry, let onRetry = onRetry {
                    Button {
                        onRetry()
                    } label: {
                        Image(systemName: "arrow.clockwise.circle")
                            .font(.title3)
                            .foregroundStyle(.blue)
                    }
                    .buttonStyle(.plain)
                    .help("Retry")
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(
            task.status.isActive ? Color.accentColor.opacity(0.05) : Color.clear
        )
        .overlay(alignment: .bottom) {
            // Progress bar
            if task.status.isActive {
                GeometryReader { geometry in
                    Rectangle()
                        .fill(.blue.gradient)
                        .frame(width: geometry.size.width * task.progress, height: 2)
                }
                .frame(height: 2)
            }
        }
    }

    // Icon name based on transfer type
    private var iconName: String {
        switch task.type {
        case .upload:
            return "arrow.up.circle.fill"
        case .download:
            return "arrow.down.circle.fill"
        case .delete:
            return "trash.circle.fill"
        }
    }

    // Icon color based on transfer type
    private var iconColor: Color {
        switch task.type {
        case .upload:
            return .blue
        case .download:
            return .green
        case .delete:
            return .red
        }
    }
}

// MARK: - Status Badge

struct StatusBadge: View {
    let status: TransferStatus

    var body: some View {
        Text(status.rawValue)
            .font(.caption2)
            .fontWeight(.medium)
            .foregroundStyle(foregroundColor)
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .background(backgroundColor)
            .clipShape(Capsule())
    }

    private var foregroundColor: Color {
        switch status {
        case .queued: return .secondary
        case .uploading, .downloading, .deleting: return .blue
        case .paused: return .orange
        case .completed: return .green
        case .failed: return .red
        case .cancelled: return .secondary
        }
    }

    private var backgroundColor: Color {
        switch status {
        case .queued: return .secondary.opacity(0.15)
        case .uploading, .downloading, .deleting: return .blue.opacity(0.15)
        case .paused: return .orange.opacity(0.15)
        case .completed: return .green.opacity(0.15)
        case .failed: return .red.opacity(0.15)
        case .cancelled: return .secondary.opacity(0.15)
        }
    }
}
