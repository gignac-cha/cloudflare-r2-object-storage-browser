# ViewModels Integration Guide

This guide shows how to integrate the ViewModels into your SwiftUI views.

## Table of Contents

1. [App Setup](#app-setup)
2. [BucketListViewModel Integration](#bucketlistviewmodel-integration)
3. [FileListViewModel Integration](#filelistviewmodel-integration)
4. [TransferManagerViewModel Integration](#transfermanagerviewmodel-integration)
5. [SearchViewModel Integration](#searchviewmodel-integration)
6. [Complete Example](#complete-example)

---

## App Setup

### Step 1: Update CloudflareR2ObjectStorageBrowserApp.swift

```swift
import SwiftUI

@main
struct CloudflareR2ObjectStorageBrowserApp: App {
    @StateObject private var serverManager = ServerManager()
    @StateObject private var apiClient: APIClient
    @StateObject private var bucketViewModel: BucketListViewModel
    @StateObject private var fileViewModel: FileListViewModel
    @StateObject private var transferViewModel: TransferManagerViewModel
    @StateObject private var searchViewModel: SearchViewModel

    init() {
        // Initialize ServerManager
        let manager = ServerManager()
        _serverManager = StateObject(wrappedValue: manager)

        // Initialize APIClient
        let client = APIClient()
        _apiClient = StateObject(wrappedValue: client)

        // Initialize ViewModels with dependencies
        _bucketViewModel = StateObject(wrappedValue: BucketListViewModel(apiClient: client))
        _fileViewModel = StateObject(wrappedValue: FileListViewModel(apiClient: client))
        _transferViewModel = StateObject(wrappedValue: TransferManagerViewModel(apiClient: client))
        _searchViewModel = StateObject(wrappedValue: SearchViewModel(apiClient: client))

        // Start server
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            manager.startServer()
        }
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(serverManager)
                .environmentObject(apiClient)
                .environmentObject(bucketViewModel)
                .environmentObject(fileViewModel)
                .environmentObject(transferViewModel)
                .environmentObject(searchViewModel)
                .onReceive(serverManager.$serverPort) { port in
                    // Update APIClient when server port changes
                    if let port = port {
                        apiClient.serverPort = port
                    }
                }
        }
        .commands {
            CommandGroup(replacing: .appTermination) {
                Button("Quit") {
                    serverManager.stopServer()
                    NSApplication.shared.terminate(nil)
                }
                .keyboardShortcut("q")
            }
        }
    }
}
```

---

## BucketListViewModel Integration

### Simple Bucket List View

```swift
import SwiftUI

struct BucketListView: View {
    @EnvironmentObject var viewModel: BucketListViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            HStack {
                Text("Buckets")
                    .font(.headline)
                Spacer()
                Button(action: { Task { await viewModel.refresh() } }) {
                    if viewModel.isLoading {
                        ProgressView()
                            .controlSize(.small)
                    } else {
                        Image(systemName: "arrow.clockwise")
                    }
                }
                .buttonStyle(.borderless)
                .disabled(viewModel.isLoading)
            }
            .padding()

            Divider()

            // Content based on state
            Group {
                switch viewModel.state {
                case .idle:
                    emptyStateView
                case .loading:
                    loadingView
                case .loaded:
                    bucketListView
                case .failed:
                    errorView
                }
            }
        }
        .frame(minWidth: 200, idealWidth: 250, maxWidth: 400)
        .task {
            // Load buckets when view appears
            await viewModel.loadBuckets()
        }
    }

    // MARK: - State Views

    private var emptyStateView: some View {
        VStack {
            Image(systemName: "tray.fill")
                .font(.system(size: 48))
                .foregroundColor(.secondary)
            Text("No buckets")
                .font(.headline)
                .foregroundColor(.secondary)
            Button("Load Buckets") {
                Task { await viewModel.loadBuckets() }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var loadingView: some View {
        VStack {
            ProgressView()
            Text("Loading buckets...")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var bucketListView: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 0) {
                ForEach(viewModel.filteredBuckets) { bucket in
                    BucketRow(
                        bucket: bucket,
                        isSelected: viewModel.selectedBucket?.id == bucket.id
                    )
                    .onTapGesture {
                        viewModel.selectBucket(bucket)
                    }
                    Divider()
                        .padding(.leading)
                }
            }
        }
    }

    private var errorView: some View {
        VStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 48))
                .foregroundColor(.red)
            Text(viewModel.errorMessage ?? "An error occurred")
                .font(.caption)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            Button("Retry") {
                viewModel.clearError()
                Task { await viewModel.loadBuckets(forceRefresh: true) }
            }
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Bucket Row

struct BucketRow: View {
    let bucket: Bucket
    let isSelected: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Image(systemName: "tray.fill")
                    .foregroundColor(.blue)
                Text(bucket.name)
                    .font(.body)
                    .fontWeight(.medium)
            }
            if let date = bucket.relativeCreationDate {
                Text(date)
                    .font(.caption2)
                    .foregroundColor(.secondary)
                    .padding(.leading, 22)
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(isSelected ? Color.accentColor.opacity(0.2) : Color.clear)
        .cornerRadius(4)
    }
}
```

---

## FileListViewModel Integration

### File List View with Navigation

```swift
import SwiftUI

struct FileListView: View {
    @EnvironmentObject var viewModel: FileListViewModel
    @EnvironmentObject var bucketViewModel: BucketListViewModel

    var body: some View {
        VStack(spacing: 0) {
            // Toolbar
            toolbarView

            Divider()

            // Breadcrumb
            breadcrumbView

            Divider()

            // Content
            Group {
                switch viewModel.state {
                case .idle:
                    emptyStateView
                case .loading:
                    loadingView
                case .loaded:
                    fileListContentView
                case .failed:
                    errorView
                }
            }

            // Status bar
            statusBarView
        }
        .onChange(of: bucketViewModel.selectedBucket) { bucket in
            if let bucket = bucket {
                Task {
                    await viewModel.loadObjects(bucket: bucket.name, prefix: "")
                }
            }
        }
    }

    // MARK: - Toolbar

    private var toolbarView: some View {
        HStack {
            // Navigation buttons
            HStack(spacing: 4) {
                Button(action: { Task { await viewModel.navigateBack() } }) {
                    Image(systemName: "chevron.left")
                }
                .disabled(!viewModel.canGoBack)

                Button(action: { Task { await viewModel.navigateForward() } }) {
                    Image(systemName: "chevron.right")
                }
                .disabled(!viewModel.canGoForward)

                Button(action: { Task { await viewModel.navigateUp() } }) {
                    Image(systemName: "chevron.up")
                }
                .disabled(!viewModel.canGoUp)
            }
            .buttonStyle(.borderless)

            Divider()
                .frame(height: 20)

            // Refresh button
            Button(action: { Task { await viewModel.refresh() } }) {
                Image(systemName: "arrow.clockwise")
            }
            .buttonStyle(.borderless)
            .disabled(viewModel.isLoading)

            // Background refresh indicator
            if viewModel.isBackgroundRefreshing {
                ProgressView()
                    .controlSize(.small)
                    .scaleEffect(0.7)
            }

            Spacer()

            // Sort menu
            Menu {
                ForEach(SortOrder.allCases, id: \.self) { order in
                    Button(order.rawValue) {
                        viewModel.setSortOrder(order)
                    }
                }
            } label: {
                Label("Sort", systemImage: "arrow.up.arrow.down")
            }
            .buttonStyle(.borderless)
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
    }

    // MARK: - Breadcrumb

    private var breadcrumbView: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 4) {
                // Bucket name
                if let bucket = viewModel.currentBucket {
                    Button(bucket) {
                        Task { await viewModel.loadObjects(bucket: bucket, prefix: "") }
                    }
                    .buttonStyle(.borderless)
                }

                // Path segments
                ForEach(Array(viewModel.breadcrumbs.enumerated()), id: \.offset) { index, segment in
                    Image(systemName: "chevron.right")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Button(segment) {
                        Task { await viewModel.navigateToBreadcrumb(index: index) }
                    }
                    .buttonStyle(.borderless)
                }

                Spacer()
            }
            .padding(.horizontal)
            .padding(.vertical, 8)
        }
    }

    // MARK: - File List Content

    private var fileListContentView: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 0) {
                ForEach(viewModel.filteredAndSortedItems) { item in
                    FileRow(item: item)
                        .onTapGesture(count: 2) {
                            if case .folder(let prefix) = item {
                                Task {
                                    await viewModel.navigateToFolder(prefix.prefix)
                                }
                            }
                        }
                        .contextMenu {
                            fileContextMenu(for: item)
                        }
                    Divider()
                }
            }
        }
    }

    // MARK: - Context Menu

    @ViewBuilder
    private func fileContextMenu(for item: FileItem) -> some View {
        if case .file(let object) = item {
            Button("Download") {
                // TODO: Trigger download
            }

            Button("Delete") {
                Task {
                    try? await viewModel.deleteObject(object)
                }
            }

            Divider()

            Button("Copy Path") {
                NSPasteboard.general.clearContents()
                NSPasteboard.general.setString(object.key, forType: .string)
            }
        }
    }

    // MARK: - Status Bar

    private var statusBarView: some View {
        HStack {
            Text("\(viewModel.filteredAndSortedItems.count) items")
                .font(.caption)
                .foregroundColor(.secondary)

            Spacer()

            // Cache indicator
            Button(action: {}) {
                let stats = viewModel.getCacheStatistics()
                Text("Cache: \(stats.totalEntries)/\(stats.maxEntries)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .buttonStyle(.borderless)
            .help("Cache utilization: \(String(format: "%.0f%%", viewModel.getCacheStatistics().utilizationPercentage))")
        }
        .padding(.horizontal)
        .padding(.vertical, 4)
        .background(Color(NSColor.controlBackgroundColor))
    }

    // MARK: - State Views

    private var emptyStateView: some View {
        VStack {
            Image(systemName: "doc.text")
                .font(.system(size: 48))
                .foregroundColor(.secondary)
            Text("No objects")
                .font(.headline)
                .foregroundColor(.secondary)
            Text("Select a bucket to view objects")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var loadingView: some View {
        VStack {
            ProgressView()
            Text("Loading objects...")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var errorView: some View {
        VStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 48))
                .foregroundColor(.red)
            Text(viewModel.errorMessage ?? "An error occurred")
                .font(.caption)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            Button("Retry") {
                viewModel.clearError()
                if let bucket = viewModel.currentBucket {
                    Task {
                        await viewModel.loadObjects(bucket: bucket, prefix: viewModel.currentPrefix, forceRefresh: true)
                    }
                }
            }
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - File Row

struct FileRow: View {
    let item: FileItem

    var body: some View {
        HStack {
            Image(systemName: item.fileType.icon)
                .foregroundColor(item.isFolder ? .blue : .secondary)
                .frame(width: 20)

            Text(item.displayName)
                .font(.body)

            Spacer()

            if !item.isFolder, let date = item.lastModified {
                Text(RelativeDateTimeFormatter().localizedString(for: date, relativeTo: Date()))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Text(ByteCountFormatter.string(fromByteCount: item.size, countStyle: .file))
                .font(.caption)
                .foregroundColor(.secondary)
                .frame(width: 80, alignment: .trailing)
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
    }
}
```

---

## TransferManagerViewModel Integration

### Transfer Manager Window

```swift
import SwiftUI

struct TransferManagerWindow: View {
    @EnvironmentObject var viewModel: TransferManagerViewModel
    @State private var selectedTab: TransferTab = .active

    enum TransferTab: String, CaseIterable {
        case active = "Active"
        case completed = "Completed"
        case failed = "Failed"
    }

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text("Transfers")
                    .font(.headline)

                Spacer()

                // Active transfers count
                if !viewModel.inProgressTasks.isEmpty {
                    HStack(spacing: 4) {
                        ProgressView()
                            .controlSize(.small)
                            .scaleEffect(0.7)
                        Text("\(viewModel.inProgressTasks.count) active")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding()

            Divider()

            // Tabs
            Picker("Tab", selection: $selectedTab) {
                ForEach(TransferTab.allCases, id: \.self) { tab in
                    Text(tab.rawValue).tag(tab)
                }
            }
            .pickerStyle(.segmented)
            .padding(.horizontal)
            .padding(.vertical, 8)

            Divider()

            // Content
            Group {
                switch selectedTab {
                case .active:
                    activeTransfersView
                case .completed:
                    completedTransfersView
                case .failed:
                    failedTransfersView
                }
            }

            Divider()

            // Overall progress
            if !viewModel.activeTasks.isEmpty {
                VStack(spacing: 4) {
                    HStack {
                        Text("Overall Progress")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Spacer()
                        Text("\(viewModel.totalProgressPercentage)%")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    ProgressView(value: viewModel.totalProgress)
                }
                .padding()
            }
        }
        .frame(width: 600, height: 400)
    }

    // MARK: - Active Transfers

    private var activeTransfersView: some View {
        ScrollView {
            LazyVStack(spacing: 8) {
                ForEach(viewModel.activeTasks) { task in
                    TransferRow(task: task, viewModel: viewModel)
                }

                if viewModel.activeTasks.isEmpty {
                    emptyStateView(message: "No active transfers")
                }
            }
            .padding()
        }
    }

    // MARK: - Completed Transfers

    private var completedTransfersView: some View {
        VStack {
            ScrollView {
                LazyVStack(spacing: 8) {
                    ForEach(viewModel.completedTasks) { task in
                        CompletedTransferRow(task: task)
                    }

                    if viewModel.completedTasks.isEmpty {
                        emptyStateView(message: "No completed transfers")
                    }
                }
                .padding()
            }

            if !viewModel.completedTasks.isEmpty {
                Divider()
                HStack {
                    Spacer()
                    Button("Clear All") {
                        viewModel.clearCompletedTasks()
                    }
                }
                .padding()
            }
        }
    }

    // MARK: - Failed Transfers

    private var failedTransfersView: some View {
        VStack {
            ScrollView {
                LazyVStack(spacing: 8) {
                    ForEach(viewModel.failedTasks) { task in
                        FailedTransferRow(task: task, viewModel: viewModel)
                    }

                    if viewModel.failedTasks.isEmpty {
                        emptyStateView(message: "No failed transfers")
                    }
                }
                .padding()
            }

            if !viewModel.failedTasks.isEmpty {
                Divider()
                HStack {
                    Spacer()
                    Button("Clear All") {
                        viewModel.clearFailedTasks()
                    }
                }
                .padding()
            }
        }
    }

    // MARK: - Empty State

    private func emptyStateView(message: String) -> some View {
        VStack {
            Image(systemName: "tray")
                .font(.system(size: 48))
                .foregroundColor(.secondary)
            Text(message)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Transfer Row

struct TransferRow: View {
    let task: TransferTask
    @ObservedObject var viewModel: TransferManagerViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: task.type == .upload ? "arrow.up.circle" : "arrow.down.circle")
                    .foregroundColor(task.status == .uploading || task.status == .downloading ? .blue : .secondary)

                VStack(alignment: .leading, spacing: 2) {
                    Text(task.fileName)
                        .font(.body)
                    Text(task.remotePath)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                // Controls
                HStack(spacing: 8) {
                    if task.canPause {
                        Button(action: { viewModel.pauseTransfer(task.id) }) {
                            Image(systemName: "pause.circle")
                        }
                        .buttonStyle(.borderless)
                    }

                    if task.canResume {
                        Button(action: { Task { await viewModel.resumeTransfer(task.id) } }) {
                            Image(systemName: "play.circle")
                        }
                        .buttonStyle(.borderless)
                    }

                    if task.canCancel {
                        Button(action: { viewModel.cancelTransfer(task.id) }) {
                            Image(systemName: "xmark.circle")
                        }
                        .buttonStyle(.borderless)
                    }
                }
            }

            // Progress bar
            ProgressView(value: task.progress) {
                HStack {
                    Text(task.status.rawValue)
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Spacer()

                    if task.status.isActive {
                        Text("\(task.humanReadableSpeed)")
                            .font(.caption)
                            .foregroundColor(.secondary)

                        if let timeRemaining = task.humanReadableTimeRemaining {
                            Text("• \(timeRemaining) remaining")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }

                    Text("\(task.progressPercentage)%")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding()
        .background(Color(NSColor.controlBackgroundColor))
        .cornerRadius(8)
    }
}

// MARK: - Completed Transfer Row

struct CompletedTransferRow: View {
    let task: TransferTask

    var body: some View {
        HStack {
            Image(systemName: "checkmark.circle.fill")
                .foregroundColor(.green)

            VStack(alignment: .leading, spacing: 2) {
                Text(task.fileName)
                    .font(.body)
                if let duration = task.duration {
                    Text("Completed in \(String(format: "%.1f", duration))s")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            Spacer()

            Text(task.humanReadableTotalSize)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(NSColor.controlBackgroundColor))
        .cornerRadius(8)
    }
}

// MARK: - Failed Transfer Row

struct FailedTransferRow: View {
    let task: TransferTask
    @ObservedObject var viewModel: TransferManagerViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "exclamationmark.circle.fill")
                    .foregroundColor(.red)

                VStack(alignment: .leading, spacing: 2) {
                    Text(task.fileName)
                        .font(.body)
                    if let error = task.error {
                        Text(error)
                            .font(.caption)
                            .foregroundColor(.red)
                    }
                }

                Spacer()

                HStack(spacing: 8) {
                    Button("Retry") {
                        Task { await viewModel.retryTransfer(task.id) }
                    }
                    .buttonStyle(.borderless)

                    Button("Remove") {
                        viewModel.removeTask(task.id)
                    }
                    .buttonStyle(.borderless)
                }
            }
        }
        .padding()
        .background(Color(NSColor.controlBackgroundColor))
        .cornerRadius(8)
    }
}
```

---

## Complete Example

### Updated ContentView.swift

```swift
import SwiftUI

struct ContentView: View {
    @EnvironmentObject var serverManager: ServerManager
    @EnvironmentObject var bucketViewModel: BucketListViewModel
    @EnvironmentObject var fileViewModel: FileListViewModel
    @EnvironmentObject var transferViewModel: TransferManagerViewModel

    @State private var showTransferManager = false

    var body: some View {
        VStack(spacing: 0) {
            // Header
            headerView

            Divider()

            // Main content
            HSplitView {
                // Bucket list sidebar
                BucketListView()
                    .frame(minWidth: 200, idealWidth: 250, maxWidth: 400)

                // File list
                FileListView()
            }
        }
        .frame(minWidth: 900, minHeight: 600)
        .sheet(isPresented: $showTransferManager) {
            TransferManagerWindow()
        }
        .toolbar {
            ToolbarItem {
                Button(action: { showTransferManager.toggle() }) {
                    Label("Transfers", systemImage: "arrow.up.arrow.down.circle")
                }
                .help("Show transfer manager")
                .keyboardShortcut("t", modifiers: [.command, .shift])
            }
        }
    }

    private var headerView: some View {
        VStack(spacing: 8) {
            Text("Cloudflare R2 Object Storage Browser")
                .font(.title2)
                .fontWeight(.semibold)

            HStack(spacing: 8) {
                Circle()
                    .fill(serverManager.isRunning ? Color.green : Color.red)
                    .frame(width: 8, height: 8)

                if let port = serverManager.serverPort {
                    Text("Connected on port \(port)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                } else {
                    Text(serverManager.isRunning ? "Starting..." : "Disconnected")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(Color(NSColor.windowBackgroundColor))
    }
}
```

---

## Key Takeaways

1. **Dependency Injection**: Pass APIClient to ViewModels during initialization
2. **Environment Objects**: Share ViewModels across views using `@EnvironmentObject`
3. **State Management**: Use `LoadingState<T>` enum for clean async operation handling
4. **Task Integration**: Use `.task { }` modifier to trigger async operations
5. **Reactive Updates**: ViewModels automatically notify views via `@Published` properties
6. **Cache Invalidation**: Call `invalidateCache()` after mutations
7. **Error Handling**: Display user-friendly error messages from `viewModel.errorMessage`

---

## Next Steps

1. Implement drag-and-drop upload/download
2. Add file preview functionality
3. Implement search with SearchViewModel
4. Add preferences window for cache configuration
5. Implement multi-account support with Account model
