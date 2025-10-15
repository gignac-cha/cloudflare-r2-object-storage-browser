import Foundation
import Combine

// MARK: - Sort Order for FileListViewModel
enum FileListSortOrder: String, CaseIterable {
    case nameAscending = "Name (A-Z)"
    case nameDescending = "Name (Z-A)"
    case sizeAscending = "Size (Smallest)"
    case sizeDescending = "Size (Largest)"
    case dateAscending = "Date (Oldest)"
    case dateDescending = "Date (Newest)"
    case typeAscending = "Type (A-Z)"
    case typeDescending = "Type (Z-A)"
}

/// ViewModel for managing file/object list with LRU caching
@MainActor
class FileListViewModel: ObservableObject {
    // MARK: - Published Properties

    @Published var state: LoadingState<FileListData> = .idle
    @Published var currentBucket: String?
    @Published var currentPrefix: String = ""
    @Published var searchQuery: String = ""
    @Published var sortOrder: FileListSortOrder = .nameAscending
    @Published var filterType: FileType?
    @Published var isBackgroundRefreshing: Bool = false

    // Navigation history for back/forward
    @Published var navigationHistory: [NavigationEntry] = []
    @Published var currentHistoryIndex: Int = -1

    // MARK: - Dependencies

    private let apiClient: APIClient
    private let cache: FolderCache
    private var cancellables = Set<AnyCancellable>()
    private var searchDebounceTask: Task<Void, Never>?

    // MARK: - Computed Properties

    var objects: [R2Object] {
        state.value?.objects ?? []
    }

    var commonPrefixes: [CommonPrefix] {
        state.value?.commonPrefixes ?? []
    }

    var allItems: [FileItem] {
        let folders = commonPrefixes.map { FileItem.folder($0) }
        let files = objects.map { FileItem.file($0) }
        return folders + files
    }

    var filteredAndSortedItems: [FileItem] {
        var items = allItems

        // Apply search filter
        if !searchQuery.isEmpty {
            let query = searchQuery.lowercased()
            items = items.filter { item in
                item.displayName.lowercased().contains(query)
            }
        }

        // Apply file type filter
        if let filterType = filterType {
            items = items.filter { item in
                if case .file(let object) = item {
                    return object.fileType == filterType
                }
                return filterType == .folder
            }
        }

        // Apply sorting
        items = sortItems(items, by: sortOrder)

        return items
    }

    var isLoading: Bool {
        state.isLoading
    }

    var error: Error? {
        state.error
    }

    var errorMessage: String? {
        state.errorMessage
    }

    var breadcrumbs: [String] {
        guard !currentPrefix.isEmpty else { return [] }
        let components = currentPrefix.split(separator: "/").map(String.init)
        return components
    }

    var canGoBack: Bool {
        currentHistoryIndex > 0
    }

    var canGoForward: Bool {
        currentHistoryIndex < navigationHistory.count - 1
    }

    var canGoUp: Bool {
        !currentPrefix.isEmpty
    }

    // MARK: - Initialization

    init(apiClient: APIClient, cache: FolderCache) {
        self.apiClient = apiClient
        self.cache = cache

        setupSearchDebouncing()
    }

    // MARK: - Public Methods

    /// Load objects for current bucket and prefix
    func loadObjects(bucket: String, prefix: String = "", forceRefresh: Bool = false) async {
        currentBucket = bucket
        currentPrefix = prefix

        let cacheKey = FolderCache.CacheKey(bucketName: bucket, prefix: prefix)

        // Check cache first (if not forcing refresh)
        if !forceRefresh, let cachedEntry = cache.get(key: cacheKey) {
            let data = FileListData(
                objects: cachedEntry.objects,
                commonPrefixes: cachedEntry.commonPrefixes.map { CommonPrefix(prefix: $0) },
                continuationToken: cachedEntry.continuationToken
            )
            state = .loaded(data)

            // Background refresh if stale
            if cachedEntry.isStale {
                Task {
                    await backgroundRefresh(bucket: bucket, prefix: prefix)
                }
            }

            addToHistory(bucket: bucket, prefix: prefix)
            return
        }

        // Load from API
        state = .loading

        do {
            let response = try await apiClient.listObjects(bucket: bucket, prefix: prefix)

            let data = FileListData(
                objects: response.data,
                commonPrefixes: response.pagination.commonPrefixes.map { CommonPrefix(prefix: $0) },
                continuationToken: response.pagination.continuationToken
            )

            state = .loaded(data)

            // Update cache
            cache.set(
                key: cacheKey,
                objects: response.data,
                commonPrefixes: response.pagination.commonPrefixes,
                continuationToken: response.pagination.continuationToken
            )

            addToHistory(bucket: bucket, prefix: prefix)

        } catch {
            state = .failed(error)
        }
    }

    /// Refresh current folder
    func refresh() async {
        guard let bucket = currentBucket else { return }
        await loadObjects(bucket: bucket, prefix: currentPrefix, forceRefresh: true)
    }

    /// Navigate to folder
    func navigateToFolder(_ prefix: String) async {
        guard let bucket = currentBucket else { return }
        await loadObjects(bucket: bucket, prefix: prefix)
    }

    /// Navigate up to parent folder
    func navigateUp() async {
        guard let bucket = currentBucket else { return }

        let parentPrefix: String
        if currentPrefix.isEmpty {
            return // Already at root
        } else {
            // Remove last component
            let components = currentPrefix.split(separator: "/").dropLast()
            parentPrefix = components.isEmpty ? "" : components.joined(separator: "/") + "/"
        }

        await loadObjects(bucket: bucket, prefix: parentPrefix)
    }

    /// Navigate back in history
    func navigateBack() async {
        guard canGoBack else { return }

        currentHistoryIndex -= 1
        let entry = navigationHistory[currentHistoryIndex]

        // Load without adding to history
        await loadObjectsWithoutHistory(bucket: entry.bucket, prefix: entry.prefix)
    }

    /// Navigate forward in history
    func navigateForward() async {
        guard canGoForward else { return }

        currentHistoryIndex += 1
        let entry = navigationHistory[currentHistoryIndex]

        // Load without adding to history
        await loadObjectsWithoutHistory(bucket: entry.bucket, prefix: entry.prefix)
    }

    /// Navigate to breadcrumb segment
    func navigateToBreadcrumb(index: Int) async {
        guard let bucket = currentBucket else { return }

        let components = breadcrumbs.prefix(index + 1)
        let prefix = components.isEmpty ? "" : components.joined(separator: "/") + "/"

        await loadObjects(bucket: bucket, prefix: prefix)
    }

    /// Invalidate cache after mutation (upload/delete/rename)
    func invalidateCache() {
        guard let bucket = currentBucket else { return }
        cache.invalidatePrefix(bucketName: bucket, prefix: currentPrefix)
    }

    /// Delete object
    func deleteObject(_ object: R2Object) async throws {
        guard let bucket = currentBucket else {
            throw R2Error.configurationError("No bucket selected")
        }

        // Optimistic update
        if case .loaded(var data) = state {
            data.objects.removeAll { $0.id == object.id }
            state = .loaded(data)
        }

        do {
            _ = try await apiClient.deleteObject(bucket: bucket, key: object.key)

            // Invalidate cache
            invalidateCache()

            // Refresh
            await refresh()

        } catch {
            // Rollback on error
            await refresh()
            throw error
        }
    }

    /// Sort items
    func setSortOrder(_ order: FileListSortOrder) {
        sortOrder = order
    }

    /// Set file type filter
    func setFilterType(_ type: FileType?) {
        filterType = type
    }

    /// Clear search
    func clearSearch() {
        searchQuery = ""
    }

    /// Clear error
    func clearError() {
        if state.isFailed {
            state = .idle
        }
    }

    /// Get cache statistics
    func getCacheStatistics() -> CacheStatistics {
        cache.statistics()
    }

    /// Clear cache
    func clearCache() {
        cache.clear()
    }

    // MARK: - Private Methods

    private func backgroundRefresh(bucket: String, prefix: String) async {
        isBackgroundRefreshing = true

        do {
            let response = try await apiClient.listObjects(bucket: bucket, prefix: prefix)

            let data = FileListData(
                objects: response.data,
                commonPrefixes: response.pagination.commonPrefixes.map { CommonPrefix(prefix: $0) },
                continuationToken: response.pagination.continuationToken
            )

            // Update state silently
            state = .loaded(data)

            // Update cache
            let cacheKey = FolderCache.CacheKey(bucketName: bucket, prefix: prefix)
            cache.set(
                key: cacheKey,
                objects: response.data,
                commonPrefixes: response.pagination.commonPrefixes,
                continuationToken: response.pagination.continuationToken
            )

        } catch {
            // Silently fail background refresh
            print("Background refresh failed: \(error)")
        }

        isBackgroundRefreshing = false
    }

    private func loadObjectsWithoutHistory(bucket: String, prefix: String) async {
        currentBucket = bucket
        currentPrefix = prefix

        let cacheKey = FolderCache.CacheKey(bucketName: bucket, prefix: prefix)

        if let cachedEntry = cache.get(key: cacheKey) {
            let data = FileListData(
                objects: cachedEntry.objects,
                commonPrefixes: cachedEntry.commonPrefixes.map { CommonPrefix(prefix: $0) },
                continuationToken: cachedEntry.continuationToken
            )
            state = .loaded(data)
            return
        }

        state = .loading

        do {
            let response = try await apiClient.listObjects(bucket: bucket, prefix: prefix)

            let data = FileListData(
                objects: response.data,
                commonPrefixes: response.pagination.commonPrefixes.map { CommonPrefix(prefix: $0) },
                continuationToken: response.pagination.continuationToken
            )

            state = .loaded(data)

            cache.set(
                key: cacheKey,
                objects: response.data,
                commonPrefixes: response.pagination.commonPrefixes,
                continuationToken: response.pagination.continuationToken
            )

        } catch {
            state = .failed(error)
        }
    }

    private func addToHistory(bucket: String, prefix: String) {
        let entry = NavigationEntry(bucket: bucket, prefix: prefix)

        // If we're not at the end of history, remove forward entries
        if currentHistoryIndex < navigationHistory.count - 1 {
            navigationHistory.removeSubrange((currentHistoryIndex + 1)...)
        }

        // Don't add duplicate consecutive entries
        if let last = navigationHistory.last, last.bucket == bucket && last.prefix == prefix {
            return
        }

        navigationHistory.append(entry)
        currentHistoryIndex = navigationHistory.count - 1

        // Limit history size
        if navigationHistory.count > 50 {
            navigationHistory.removeFirst()
            currentHistoryIndex -= 1
        }
    }

    private func setupSearchDebouncing() {
        $searchQuery
            .debounce(for: .milliseconds(300), scheduler: RunLoop.main)
            .sink { [weak self] _ in
                self?.objectWillChange.send()
            }
            .store(in: &cancellables)
    }

    private func sortItems(_ items: [FileItem], by order: FileListSortOrder) -> [FileItem] {
        switch order {
        case .nameAscending:
            return items.sorted { $0.displayName.localizedCaseInsensitiveCompare($1.displayName) == .orderedAscending }
        case .nameDescending:
            return items.sorted { $0.displayName.localizedCaseInsensitiveCompare($1.displayName) == .orderedDescending }
        case .sizeAscending:
            return items.sorted { $0.size < $1.size }
        case .sizeDescending:
            return items.sorted { $0.size > $1.size }
        case .dateAscending:
            return items.sorted { ($0.lastModified ?? .distantPast) < ($1.lastModified ?? .distantPast) }
        case .dateDescending:
            return items.sorted { ($0.lastModified ?? .distantPast) > ($1.lastModified ?? .distantPast) }
        case .typeAscending:
            return items.sorted { $0.fileType.rawValue.localizedCaseInsensitiveCompare($1.fileType.rawValue) == .orderedAscending }
        case .typeDescending:
            return items.sorted { $0.fileType.rawValue.localizedCaseInsensitiveCompare($1.fileType.rawValue) == .orderedDescending }
        }
    }
}

// MARK: - Supporting Types

struct FileListData {
    var objects: [R2Object]
    var commonPrefixes: [CommonPrefix]
    var continuationToken: String?
}

enum FileItem: Identifiable {
    case folder(CommonPrefix)
    case file(R2Object)

    var id: String {
        switch self {
        case .folder(let prefix): return prefix.id
        case .file(let object): return object.id
        }
    }

    var displayName: String {
        switch self {
        case .folder(let prefix): return prefix.displayName
        case .file(let object): return object.name
        }
    }

    var size: Int64 {
        switch self {
        case .folder: return 0
        case .file(let object): return object.size
        }
    }

    var lastModified: Date? {
        switch self {
        case .folder: return nil
        case .file(let object): return object.lastModifiedDate
        }
    }

    var fileType: FileType {
        switch self {
        case .folder: return .folder
        case .file(let object): return object.fileType
        }
    }

    var isFolder: Bool {
        if case .folder = self {
            return true
        }
        return false
    }
}

struct NavigationEntry: Equatable {
    let bucket: String
    let prefix: String
}
