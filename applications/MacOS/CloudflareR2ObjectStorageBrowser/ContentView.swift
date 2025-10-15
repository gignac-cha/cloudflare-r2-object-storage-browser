import SwiftUI
import AppKit

// MARK: - API Response Models

struct APIResponse: Codable {
    let status: String
    let message: String
    let version: String
    let timestamp: String
}

// MARK: - View-Specific Types

enum SortColumn: String {
    case name
    case size
    case modified
    case type
}

enum SortOrder {
    case ascending
    case descending
}

// MARK: - Content View

struct ContentView: View {
    @EnvironmentObject var serverManager: ServerManager
    @EnvironmentObject var settingsManager: SettingsManager

    // Settings sheet
    @State private var isShowingSettings = false

    // Bucket state
    @State private var buckets: [Bucket] = []
    @State private var selectedBucket: Bucket?
    @State private var isLoadingBuckets = false
    @State private var bucketsError: String?

    // File list state
    @State private var objects: [R2Object] = []
    @State private var folders: [String] = []
    @State private var selectedObjects: Set<String> = []
    @State private var currentPath = ""
    @State private var isLoadingObjects = false

    // Sort state
    @State private var sortColumn: SortColumn = .name
    @State private var sortOrder: SortOrder = .ascending

    // Navigation history
    @State private var navigationHistory: [String] = []
    @State private var historyIndex = -1

    // Debug panel state
    @State private var isDebugPanelVisible = false
    @State private var debugTab: DebugTab = .apiResponse
    @State private var apiResponses: [APIDebugResponse] = []
    @State private var serverLogs: [String] = []

    // Transfer queue panel state
    @State private var isTransferQueueVisible = false

    // Quick Look state
    @State private var isQuickLookVisible = false
    @State private var quickLookFileURL: URL? = nil
    @State private var quickLookFileName = ""

    // Loading overlay state
    @State private var showLoadingOverlay = false
    @State private var loadingMessage = ""
    @State private var loadingProgress: Double? = nil
    @State private var currentTask: Task<Void, Never>? = nil

    // Transfer manager - will be initialized in onAppear
    @StateObject private var transferManager = TransferManagerViewModel(apiClient: APIClient())

    var body: some View {
        VStack(spacing: 0) {
            // Header with server status
            headerView

            Divider()

            // Main content area (can be split vertically with debug panel)
            VSplitView {
                // Top section: horizontal split with sidebar and content
                HSplitView {
                    // Left Sidebar - Buckets
                    BucketSidebarView(
                        buckets: $buckets,
                        selectedBucket: $selectedBucket,
                        isLoading: $isLoadingBuckets,
                        error: $bucketsError,
                        onRefresh: listBuckets,
                        onBucketSelect: selectBucket
                    )

                    // Right Content Area
                    VStack(spacing: 0) {
                        // Toolbar
                        ToolbarView(
                            canGoBack: historyIndex > 0,
                            canGoForward: historyIndex < navigationHistory.count - 1,
                            canGoUp: !currentPath.isEmpty,
                            hasSelection: !selectedObjects.isEmpty,
                            selectionCount: selectedObjects.count,
                            onBack: goBack,
                            onForward: goForward,
                            onUp: goUp,
                            onUpload: upload,
                            onDownload: download,
                            onDelete: delete,
                            onRefresh: refreshObjects
                        )

                        Divider()

                        // Breadcrumb
                        BreadcrumbView(
                            bucketName: selectedBucket?.name,
                            currentPath: currentPath,
                            onNavigate: navigateToPath
                        )

                        Divider()

                        // File List
                        FileListView(
                            objects: $objects,
                            folders: $folders,
                            selectedObjects: $selectedObjects,
                            sortColumn: $sortColumn,
                            sortOrder: $sortOrder,
                            isLoading: $isLoadingObjects,
                            onFolderOpen: openFolder,
                            onObjectDownload: downloadObject,
                            onObjectDelete: deleteObjects,
                            onFilePreview: previewFile,
                            onSaveAs: saveFileAs
                        )
                    }
                }
                .frame(minHeight: 400)

                // Bottom section: Transfer Queue Panel (collapsible)
                if isTransferQueueVisible {
                    TransferQueuePanel(
                        transferManager: transferManager,
                        isVisible: $isTransferQueueVisible
                    )
                }

                // Bottom section: Debug Panel (collapsible)
                if isDebugPanelVisible {
                    DebugPanelView(
                        isVisible: $isDebugPanelVisible,
                        selectedTab: $debugTab,
                        apiResponses: $apiResponses,
                        serverLogs: $serverLogs
                    )
                }
            }
        }
        .frame(minWidth: 900, minHeight: 600)
        .onAppear {
            // Sync server logs
            serverLogs = serverManager.logs

            // Update TransferManager's APIClient with server port
            if let port = serverManager.serverPort {
                transferManager.updateAPIClient(APIClient(serverPort: port))
            }

            // Auto-load buckets if server is ready and credentials are configured
            tryAutoLoadBuckets()
        }
        .onChange(of: serverManager.logs) { newLogs in
            serverLogs = newLogs
        }
        .onChange(of: serverManager.serverPort) { newPort in
            // Update APIClient when server port changes
            if let port = newPort {
                transferManager.updateAPIClient(APIClient(serverPort: port))
            }
            // When server port becomes available, try to auto-load buckets
            if newPort != nil {
                tryAutoLoadBuckets()
            }
        }
        .toolbar {
            ToolbarItemGroup {
                // Transfer Queue toggle
                Button {
                    withAnimation {
                        isTransferQueueVisible.toggle()
                        if isTransferQueueVisible && isDebugPanelVisible {
                            isDebugPanelVisible = false
                        }
                    }
                } label: {
                    HStack(spacing: 4) {
                        Label("Transfer Queue", systemImage: "arrow.up.arrow.down.circle")
                        if !transferManager.activeTasks.isEmpty {
                            Text("\(transferManager.activeTasks.count)")
                                .font(.caption2)
                                .fontWeight(.semibold)
                                .padding(.horizontal, 5)
                                .padding(.vertical, 1)
                                .background(.blue)
                                .foregroundColor(.white)
                                .clipShape(Capsule())
                        }
                    }
                }
                .help("Transfer Queue")

                // Debug Panel toggle
                Button {
                    withAnimation {
                        isDebugPanelVisible.toggle()
                        if isDebugPanelVisible && isTransferQueueVisible {
                            isTransferQueueVisible = false
                        }
                    }
                } label: {
                    Label("Debug Panel", systemImage: isDebugPanelVisible ? "ant.circle.fill" : "ant.circle")
                }
                .help("Debug Panel (Cmd+Shift+D)")

                // Settings button
                Button {
                    isShowingSettings.toggle()
                } label: {
                    Label("Settings", systemImage: "gear")
                }
                .help("Settings")
            }
        }
        .sheet(isPresented: $isShowingSettings) {
            SettingsView()
                .environmentObject(settingsManager)
                .environmentObject(serverManager)
        }
        .sheet(isPresented: $isQuickLookVisible) {
            QuickLookPanel(
                isVisible: $isQuickLookVisible,
                fileURL: quickLookFileURL,
                fileName: quickLookFileName
            )
        }
        .overlay {
            if showLoadingOverlay {
                LoadingOverlayView(
                    message: loadingMessage,
                    progress: loadingProgress,
                    onCancel: {
                        currentTask?.cancel()
                        showLoadingOverlay = false
                        loadingMessage = ""
                        loadingProgress = nil
                        currentTask = nil
                    }
                )
            }
        }
    }

    // MARK: - Header View

    private var headerView: some View {
        HStack {
            VStack(spacing: 8) {
                Text("Cloudflare R2 Object Storage Browser")
                    .font(.title2)
                    .fontWeight(.semibold)

                // Server status indicator
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
                .accessibilityElement(children: .combine)
                .accessibilityLabel("Server status: \(serverManager.isRunning ? "Connected" : "Disconnected")")
            }
            .frame(maxWidth: .infinity)
        }
        .padding()
        .background(.background)
    }

    // MARK: - Bucket Operations

    /// Tries to auto-load buckets if conditions are met:
    /// - Server is running and port is available
    /// - Credentials are configured
    /// - Buckets haven't been loaded yet
    private func tryAutoLoadBuckets() {
        // Check if server is ready
        guard serverManager.isRunning,
              serverManager.serverPort != nil else {
            return
        }

        // Check if credentials are configured
        guard settingsManager.accountId != nil,
              settingsManager.accessKeyId != nil,
              settingsManager.secretAccessKey != nil else {
            return
        }

        // Only auto-load if buckets list is empty and not currently loading
        guard buckets.isEmpty && !isLoadingBuckets else {
            return
        }

        // Delay slightly to ensure server is fully ready
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            self.listBuckets()
        }
    }

    private func listBuckets() {
        isLoadingBuckets = true
        bucketsError = nil

        // Show loading overlay
        showLoadingOverlay = true
        loadingMessage = "Loading buckets..."
        loadingProgress = nil

        guard let port = serverManager.serverPort else {
            bucketsError = "Server port not available"
            isLoadingBuckets = false
            showLoadingOverlay = false
            return
        }

        guard let url = URL(string: "http://127.0.0.1:\(port)/buckets") else {
            bucketsError = "Invalid URL"
            isLoadingBuckets = false
            showLoadingOverlay = false
            return
        }

        let task = URLSession.shared.dataTask(with: url) { data, response, error in
            DispatchQueue.main.async {
                isLoadingBuckets = false
                showLoadingOverlay = false

                if let error = error {
                    bucketsError = "Error: \(error.localizedDescription)"
                    return
                }

                guard let data = data else {
                    bucketsError = "No data received"
                    return
                }

                // Log API response to debug panel
                if let jsonString = String(data: data, encoding: .utf8) {
                    apiResponses.append(APIDebugResponse(
                        method: "GET",
                        endpoint: "/buckets",
                        response: jsonString,
                        timestamp: Date()
                    ))
                }

                do {
                    let decoder = JSONDecoder()
                    let result = try decoder.decode(BucketsResponse.self, from: data)
                    buckets = result.data.buckets
                } catch {
                    bucketsError = "Decode error: \(error.localizedDescription)"
                }
            }
        }

        task.resume()
    }

    private func selectBucket(_ bucket: Bucket) {
        selectedBucket = bucket
        currentPath = ""
        navigationHistory = [""]
        historyIndex = 0
        selectedObjects.removeAll()
        loadObjects()
    }

    // MARK: - Object Operations

    private func loadObjects() {
        guard let bucket = selectedBucket else { return }
        guard let port = serverManager.serverPort else { return }

        isLoadingObjects = true

        // Show loading overlay
        let pathDisplay = currentPath.isEmpty ? "root" : currentPath
        showLoadingOverlay = true
        loadingMessage = "Loading \(pathDisplay)..."
        loadingProgress = nil

        // Build URL with optional prefix (current path)
        var urlComponents = URLComponents(string: "http://127.0.0.1:\(port)/buckets/\(bucket.name)/objects")
        if !currentPath.isEmpty {
            urlComponents?.queryItems = [URLQueryItem(name: "prefix", value: currentPath)]
        }

        guard let url = urlComponents?.url else {
            isLoadingObjects = false
            showLoadingOverlay = false
            return
        }

        let task = URLSession.shared.dataTask(with: url) { data, response, error in
            DispatchQueue.main.async {
                isLoadingObjects = false
                showLoadingOverlay = false

                if let error = error {
                    print("Error loading objects: \(error.localizedDescription)")
                    return
                }

                guard let data = data else {
                    print("No data received")
                    return
                }

                // Log API response to debug panel
                if let jsonString = String(data: data, encoding: .utf8) {
                    apiResponses.append(APIDebugResponse(
                        method: "GET",
                        endpoint: "/buckets/\(bucket.name)/objects",
                        response: jsonString,
                        timestamp: Date()
                    ))
                }

                do {
                    let decoder = JSONDecoder()
                    let result = try decoder.decode(ObjectsResponse.self, from: data)

                    // Debug: Print first object's lastModified
                    if let firstObject = result.data.first {
                        print("📅 First object lastModified from API: \(firstObject.lastModified)")
                        print("📅 Parsed date: \(String(describing: firstObject.lastModifiedDate))")
                        print("📅 Relative: \(String(describing: firstObject.relativeLastModified))")
                    }

                    // Set objects from data
                    objects = result.data

                    // Set folders from commonPrefixes
                    folders = result.pagination.commonPrefixes

                } catch {
                    print("Decode error: \(error.localizedDescription)")
                    if let jsonString = String(data: data, encoding: .utf8) {
                        print("Response JSON: \(jsonString)")
                    }
                }
            }
        }

        task.resume()
    }

    private func refreshObjects() {
        loadObjects()
    }

    private func openFolder(_ folder: String) {
        currentPath = folder
        addToNavigationHistory(folder)
        selectedObjects.removeAll()
        loadObjects()
    }

    private func downloadObject(_ object: R2Object) {
        guard let bucket = selectedBucket else { return }
        guard let port = serverManager.serverPort else { return }

        Task {
            do {
                let cacheManager = CacheManager.shared
                let fileURL: URL

                // Check if file is already cached
                if let cachedURL = cacheManager.getCachedFileURL(forKey: object.key) {
                    fileURL = cachedURL
                } else {
                    // Download file and save to cache
                    let apiClient = APIClient(serverPort: port)
                    let (data, _) = try await apiClient.downloadObject(
                        bucket: bucket.name,
                        key: object.key
                    )

                    // Save to cache
                    fileURL = try cacheManager.saveToCache(data: data, forKey: object.key)
                }

                // Show success message
                await MainActor.run {
                    let alert = NSAlert()
                    alert.messageText = "Download Complete"
                    alert.informativeText = "File has been cached locally. Use 'Save As...' to save it to a custom location."
                    alert.alertStyle = .informational
                    alert.addButton(withTitle: "OK")
                    alert.runModal()

                    // Refresh the view to show cache indicator
                    objects = objects
                }
            } catch {
                await MainActor.run {
                    let alert = NSAlert()
                    alert.messageText = "Download Failed"
                    alert.informativeText = "Failed to download file: \(error.localizedDescription)"
                    alert.alertStyle = .warning
                    alert.addButton(withTitle: "OK")
                    alert.runModal()
                }
            }
        }
    }

    private func saveFileAs(_ object: R2Object) {
        let cacheManager = CacheManager.shared

        // Check if file is cached
        guard cacheManager.isCached(key: object.key) else {
            let alert = NSAlert()
            alert.messageText = "File Not Cached"
            alert.informativeText = "This file needs to be downloaded first. Please use the Download option."
            alert.alertStyle = .informational
            alert.addButton(withTitle: "OK")
            alert.runModal()
            return
        }

        // Show save panel
        let savePanel = NSSavePanel()
        savePanel.nameFieldStringValue = (object.key as NSString).lastPathComponent
        savePanel.canCreateDirectories = true
        savePanel.title = "Save File"

        savePanel.begin { response in
            guard response == .OK, let destinationURL = savePanel.url else { return }

            Task {
                do {
                    // Move cached file to destination
                    try cacheManager.moveCachedFile(forKey: object.key, to: destinationURL)

                    await MainActor.run {
                        let alert = NSAlert()
                        alert.messageText = "File Saved"
                        alert.informativeText = "File has been saved to \(destinationURL.path)"
                        alert.alertStyle = .informational
                        alert.addButton(withTitle: "OK")
                        alert.runModal()

                        // Refresh the view to update cache indicator
                        self.objects = self.objects
                    }
                } catch {
                    await MainActor.run {
                        let alert = NSAlert()
                        alert.messageText = "Save Failed"
                        alert.informativeText = "Failed to save file: \(error.localizedDescription)"
                        alert.alertStyle = .warning
                        alert.addButton(withTitle: "OK")
                        alert.runModal()
                    }
                }
            }
        }
    }

    private func previewFile(_ object: R2Object) {
        guard let bucket = selectedBucket else { return }
        guard let port = serverManager.serverPort else { return }

        Task {
            do {
                let cacheManager = CacheManager.shared
                let fileURL: URL

                // Check if file is already cached
                if let cachedURL = cacheManager.getCachedFileURL(forKey: object.key) {
                    fileURL = cachedURL
                } else {
                    // Download file and save to cache
                    let apiClient = APIClient(serverPort: port)
                    let (data, _) = try await apiClient.downloadObject(
                        bucket: bucket.name,
                        key: object.key
                    )

                    // Save to cache
                    fileURL = try cacheManager.saveToCache(data: data, forKey: object.key)
                }

                // Update UI on main thread
                await MainActor.run {
                    quickLookFileURL = fileURL
                    quickLookFileName = object.name
                    isQuickLookVisible = true
                }
            } catch {
                await MainActor.run {
                    let alert = NSAlert()
                    alert.messageText = "Preview Failed"
                    alert.informativeText = "Failed to load file preview: \(error.localizedDescription)"
                    alert.alertStyle = .warning
                    alert.addButton(withTitle: "OK")
                    alert.runModal()
                }
            }
        }
    }

    private func deleteObjects(_ objects: [R2Object]) {
        guard !objects.isEmpty else { return }
        guard let bucket = selectedBucket else { return }

        // Build confirmation message
        let message: String
        if objects.count == 1 {
            message = "Are you sure you want to delete \"\(objects[0].name)\"?\n\nThis action cannot be undone."
        } else {
            message = "Are you sure you want to delete \(objects.count) items?\n\nThis action cannot be undone."
        }

        // Show confirmation alert
        let alert = NSAlert()
        alert.messageText = "Delete Items"
        alert.informativeText = message
        alert.alertStyle = .critical
        alert.addButton(withTitle: "Delete")
        alert.addButton(withTitle: "Cancel")

        // Get the main window
        guard let window = NSApp.keyWindow else { return }

        alert.beginSheetModal(for: window) { response in
            if response == .alertFirstButtonReturn {
                // Show transfer queue panel
                withAnimation {
                    isTransferQueueVisible = true
                }

                // Add deletion to queue
                Task {
                    do {
                        try await transferManager.deleteObjects(
                            objects: objects,
                            bucket: bucket.name
                        )

                        // Clear selection and refresh
                        await MainActor.run {
                            selectedObjects.removeAll()
                            loadObjects()
                        }
                    } catch {
                        // Show error alert
                        await MainActor.run {
                            let errorAlert = NSAlert()
                            errorAlert.messageText = "Delete Failed"
                            errorAlert.informativeText = "Failed to delete items: \(error.localizedDescription)"
                            errorAlert.alertStyle = .warning
                            errorAlert.addButton(withTitle: "OK")
                            errorAlert.runModal()
                        }
                    }
                }
            }
        }
    }

    // MARK: - Navigation

    private func goBack() {
        guard historyIndex > 0 else { return }
        historyIndex -= 1
        currentPath = navigationHistory[historyIndex]
        loadObjects()
    }

    private func goForward() {
        guard historyIndex < navigationHistory.count - 1 else { return }
        historyIndex += 1
        currentPath = navigationHistory[historyIndex]
        loadObjects()
    }

    private func goUp() {
        guard !currentPath.isEmpty else { return }

        // Remove last path component
        var components = currentPath.split(separator: "/")
        if !components.isEmpty {
            components.removeLast()
        }

        let newPath = components.isEmpty ? "" : components.joined(separator: "/") + "/"
        currentPath = newPath
        addToNavigationHistory(newPath)
        selectedObjects.removeAll()
        loadObjects()
    }

    private func navigateToPath(_ path: String) {
        currentPath = path
        addToNavigationHistory(path)
        selectedObjects.removeAll()
        loadObjects()
    }

    private func addToNavigationHistory(_ path: String) {
        // Remove forward history if we're in the middle
        if historyIndex < navigationHistory.count - 1 {
            navigationHistory.removeLast(navigationHistory.count - historyIndex - 1)
        }

        navigationHistory.append(path)
        historyIndex = navigationHistory.count - 1
    }

    // MARK: - Actions

    private func upload() {
        guard let bucket = selectedBucket else { return }

        let openPanel = NSOpenPanel()
        openPanel.title = "Select Files to Upload"
        openPanel.canChooseFiles = true
        openPanel.canChooseDirectories = false
        openPanel.allowsMultipleSelection = true

        openPanel.begin { response in
            guard response == .OK else { return }

            // Show transfer queue panel
            withAnimation {
                isTransferQueueVisible = true
            }

            // Add files to transfer queue
            Task {
                for url in openPanel.urls {
                    let remotePath = currentPath.isEmpty ? url.lastPathComponent : "\(currentPath)/\(url.lastPathComponent)"

                    do {
                        try await transferManager.uploadFile(
                            localURL: url,
                            bucket: bucket.name,
                            remotePath: remotePath
                        )
                    } catch {
                        print("Failed to queue upload: \(error)")
                    }
                }

                // Refresh objects after uploads complete
                try? await Task.sleep(nanoseconds: 500_000_000) // Wait 0.5s
                await refreshObjectsIfAllCompleted()
            }
        }
    }

    private func download() {
        guard let bucket = selectedBucket else { return }

        // Get selected objects
        let selectedItems = objects.filter { selectedObjects.contains($0.key) }
        guard !selectedItems.isEmpty else { return }

        // Show save panel for directory selection
        let savePanel = NSOpenPanel()
        savePanel.title = "Select Download Destination"
        savePanel.canChooseFiles = false
        savePanel.canChooseDirectories = true
        savePanel.canCreateDirectories = true
        savePanel.allowsMultipleSelection = false

        savePanel.begin { response in
            guard response == .OK,
                  let destinationURL = savePanel.url else { return }

            // Show transfer queue panel
            withAnimation {
                isTransferQueueVisible = true
            }

            // Add downloads to transfer queue
            Task {
                for object in selectedItems {
                    let localURL = destinationURL.appendingPathComponent(object.name)

                    do {
                        try await transferManager.downloadFile(
                            object: object,
                            bucket: bucket.name,
                            destinationURL: localURL
                        )
                    } catch {
                        print("Failed to queue download: \(error)")
                    }
                }
            }
        }
    }

    // Helper to refresh objects only when all transfers are completed
    private func refreshObjectsIfAllCompleted() async {
        // Wait for all active tasks to complete
        while !transferManager.activeTasks.isEmpty {
            try? await Task.sleep(nanoseconds: 1_000_000_000) // Wait 1s
        }
        loadObjects()
    }

    private func delete() {
        // Get selected objects from the selection set
        let selectedItems = allItems.filter { selectedObjects.contains($0.key) }

        // Delegate to deleteObjects which now uses queue
        deleteObjects(selectedItems)
    }

    // Helper to get all items (folders + objects)
    private var allItems: [R2Object] {
        let folderObjects = folders.map { folder in
            R2Object(
                key: folder,
                size: 0,
                lastModified: ISO8601DateFormatter().string(from: Date()),
                etag: nil,
                storageClass: nil
            )
        }
        return folderObjects + objects
    }

    private func toggleDebugPanel() {
        withAnimation(.easeInOut(duration: 0.25)) {
            isDebugPanelVisible.toggle()
        }
    }
}

// MARK: - Previews

#Preview {
    ContentView()
        .environmentObject(ServerManager())
        .environmentObject(SettingsManager())
        .frame(width: 1200, height: 800)
}
