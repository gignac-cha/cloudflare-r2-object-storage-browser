# State Management Architecture

## Overview

This document describes the comprehensive state management architecture for the macOS R2 Object Storage Browser app. The architecture follows SwiftUI best practices with MVVM pattern, reactive programming with Combine, and async/await for API operations.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        SwiftUI Views                             │
│  (ContentView, BucketListView, FileListView, etc.)              │
└────────────────────────┬────────────────────────────────────────┘
                         │ @StateObject / @ObservedObject
                         │ @Published properties trigger updates
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                         ViewModels                               │
│  • BucketListViewModel                                          │
│  • FileListViewModel (with LRU cache)                           │
│  • TransferManagerViewModel                                     │
│  • SearchViewModel                                              │
│                                                                  │
│  Responsibilities:                                              │
│  - Hold UI state (@Published)                                   │
│  - Handle business logic                                        │
│  - Coordinate with services                                     │
│  - Expose computed properties                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │ async/await API calls
                         │ Cache management
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Services                                 │
│  • APIClient - HTTP communication with server                   │
│  • FolderCache - LRU cache for folder listings                 │
│                                                                  │
│  Responsibilities:                                              │
│  - Network requests                                             │
│  - Data caching                                                 │
│  - Error handling                                               │
└────────────────────────┬────────────────────────────────────────┘
                         │ URLSession
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Local API Server                              │
│  (Node.js/Fastify - ServerManager)                             │
└────────────────────────┬────────────────────────────────────────┘
                         │ AWS S3 SDK
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Cloudflare R2 Storage                          │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Unidirectional Data Flow

```
User Action → View → ViewModel → Service → API → R2
                 ↑                               │
                 └───────────────────────────────┘
              @Published state updates
```

1. **User interacts** with SwiftUI View (tap, search, upload, etc.)
2. **View calls** ViewModel method
3. **ViewModel updates** state to `.loading`
4. **ViewModel calls** Service (APIClient, Cache)
5. **Service makes** async API request
6. **API responds** with data or error
7. **ViewModel updates** state to `.loaded(data)` or `.failed(error)`
8. **SwiftUI automatically** re-renders View based on `@Published` changes

## State Models

### LoadingState<T>

Generic enum representing async operation states:

```swift
enum LoadingState<T> {
    case idle        // Initial state
    case loading     // Request in progress
    case loaded(T)   // Success with data
    case failed(Error) // Error occurred
}
```

**Benefits:**
- Type-safe state representation
- Eliminates boolean flag combinations
- Easy pattern matching
- Computed properties for convenience

**Usage:**
```swift
@Published var state: LoadingState<[Bucket]> = .idle

// In ViewModel
state = .loading
state = .loaded(buckets)
state = .failed(error)

// In View
switch state {
case .idle:
    EmptyStateView()
case .loading:
    ProgressView()
case .loaded(let buckets):
    BucketListView(buckets: buckets)
case .failed(let error):
    ErrorView(error: error)
}
```

## ViewModels

### 1. BucketListViewModel

**Responsibilities:**
- Load and manage bucket list
- Handle bucket selection
- Search/filter buckets

**State:**
```swift
@Published var state: LoadingState<[Bucket]> = .idle
@Published var selectedBucket: Bucket?
@Published var searchQuery: String = ""
```

**Key Methods:**
```swift
func loadBuckets(forceRefresh: Bool = false) async
func refresh() async
func selectBucket(_ bucket: Bucket)
```

**Usage:**
```swift
@StateObject private var viewModel = BucketListViewModel(apiClient: apiClient)

// Load buckets
await viewModel.loadBuckets()

// Select bucket
viewModel.selectBucket(bucket)

// Access data
let buckets = viewModel.filteredBuckets
```

### 2. FileListViewModel

**Responsibilities:**
- Load and manage object/folder lists
- Implement LRU caching (100 entries, 5min TTL)
- Handle navigation (back/forward/up)
- Sort and filter objects
- Invalidate cache on mutations

**State:**
```swift
@Published var state: LoadingState<FileListData> = .idle
@Published var currentBucket: String?
@Published var currentPrefix: String = ""
@Published var sortOrder: SortOrder = .nameAscending
@Published var filterType: FileType?
```

**LRU Cache:**
- **Max entries:** 100 folders
- **TTL:** 5 minutes (configurable)
- **Cache key:** `{accountId}:{bucketName}:{prefix}`
- **Eviction:** Least Recently Used (LRU)
- **Invalidation:** On upload/delete/rename operations
- **Background refresh:** If cache age > 2 minutes

**Key Methods:**
```swift
func loadObjects(bucket: String, prefix: String = "", forceRefresh: Bool = false) async
func navigateToFolder(_ prefix: String) async
func navigateUp() async
func navigateBack() async
func navigateForward() async
func deleteObject(_ object: R2Object) async throws
func invalidateCache()
```

**Cache Behavior:**
```swift
// Cache hit - instant display
if let cached = cache.get(key: cacheKey) {
    state = .loaded(cached)

    // Background refresh if stale
    if cached.isStale {
        await backgroundRefresh()
    }
}

// Cache miss - fetch from API
state = .loading
let response = try await apiClient.listObjects(...)
state = .loaded(response)
cache.set(key: cacheKey, data: response)
```

**Invalidation Strategy:**
```swift
// After upload
await viewModel.uploadFile(...)
viewModel.invalidateCache() // Invalidates current folder + parent

// After delete
try await viewModel.deleteObject(object)
viewModel.invalidateCache() // Auto-refreshes
```

### 3. TransferManagerViewModel

**Responsibilities:**
- Manage upload/download queue
- Track transfer progress
- Handle pause/resume/cancel
- Enforce concurrency limits

**State:**
```swift
@Published var activeTasks: [TransferTask] = []
@Published var completedTasks: [TransferTask] = []
@Published var failedTasks: [TransferTask] = []
@Published var maxConcurrentUploads: Int = 3
@Published var maxConcurrentDownloads: Int = 5
```

**Key Methods:**
```swift
func uploadFile(localURL: URL, bucket: String, remotePath: String) async throws
func downloadFile(object: R2Object, bucket: String, destinationURL: URL) async throws
func pauseTransfer(_ taskId: UUID)
func resumeTransfer(_ taskId: UUID) async
func cancelTransfer(_ taskId: UUID)
func retryTransfer(_ taskId: UUID) async
```

**Queue Management:**
- Automatic queue processing
- Respects concurrency limits
- Optimistic updates
- Progress tracking with speed calculation

### 4. SearchViewModel

**Responsibilities:**
- Handle search queries with debouncing
- Apply filters (file type, date, size)
- Toggle search scope (current folder vs entire bucket)

**State:**
```swift
@Published var searchQuery: String = ""
@Published var state: LoadingState<[R2Object]> = .idle
@Published var selectedFileTypes: Set<FileType> = []
@Published var dateRange: DateRange?
@Published var sizeRange: SizeRange?
```

**Key Methods:**
```swift
func search(bucket: String, prefix: String?) async
func toggleFileType(_ type: FileType)
func setDateRange(_ range: DateRange?)
func setSizeRange(_ range: SizeRange?)
```

**Debouncing:**
```swift
// Automatic 300ms debounce on searchQuery
$searchQuery
    .debounce(for: .milliseconds(300), scheduler: RunLoop.main)
    .sink { [weak self] _ in
        self?.objectWillChange.send()
    }
```

## Models

### Bucket
```swift
struct Bucket: Codable, Identifiable, Equatable {
    let name: String
    let creationDate: String?
    var id: String { name }
}
```

### R2Object
```swift
struct R2Object: Codable, Identifiable, Equatable {
    let key: String
    let size: Int64
    let lastModified: String
    let etag: String?
    let storageClass: String?

    var id: String { key }
    var name: String { /* computed */ }
    var fileType: FileType { /* computed */ }
    var humanReadableSize: String { /* computed */ }
}
```

### TransferTask
```swift
struct TransferTask: Identifiable, Equatable {
    let id: UUID
    let type: TransferType
    let fileName: String
    let remotePath: String
    let bucketName: String
    let totalSize: Int64
    var transferredSize: Int64
    var status: TransferStatus
    var speed: Double

    var progress: Double { /* computed */ }
    var estimatedTimeRemaining: TimeInterval? { /* computed */ }
}
```

### Account
```swift
struct Account: Identifiable, Codable, Equatable {
    let id: UUID
    var name: String
    var endpoint: String
    var accessKeyId: String
    var isDefault: Bool
}
```

## Services

### APIClient

**Responsibilities:**
- HTTP communication with local server
- Request/response handling
- Error mapping

**Key Methods:**
```swift
func listBuckets() async throws -> [Bucket]
func listObjects(bucket: String, prefix: String?, ...) async throws -> ObjectsResponse
func downloadObject(bucket: String, key: String) async throws -> (Data, HTTPURLResponse)
func uploadObject(bucket: String, key: String, data: Data) async throws -> ObjectUploadResponse
func deleteObject(bucket: String, key: String) async throws -> ObjectDeleteResponse
```

**Error Handling:**
```swift
enum R2Error: Error {
    case networkError(String)
    case serverError(Int, String)
    case decodingError(String)
    case invalidResponse
    case unauthorized
    case notFound(String)
    case configurationError(String)
}
```

### FolderCache

**Responsibilities:**
- LRU cache implementation
- TTL-based expiration
- Cache invalidation strategies

**Configuration:**
```swift
struct Configuration {
    var maxEntries: Int = 100
    var ttl: TimeInterval = 300 // 5 minutes
    var backgroundRefreshThreshold: TimeInterval = 120 // 2 minutes
}
```

**Cache Key:**
```swift
struct CacheKey: Hashable {
    let accountId: String?
    let bucketName: String
    let prefix: String

    // Example: "account123:my-bucket:folder1/folder2/"
}
```

**LRU Eviction:**
- Tracks access order
- Evicts oldest entry when exceeding `maxEntries`
- Updates access order on every read

**Statistics:**
```swift
func statistics() -> CacheStatistics {
    // totalEntries, staleEntries, utilizationPercentage, etc.
}
```

## State Update Patterns

### 1. Loading State Pattern

```swift
// Start loading
state = .loading

do {
    let data = try await apiClient.fetchData()
    state = .loaded(data)
} catch {
    state = .failed(error)
}
```

### 2. Optimistic Update Pattern

```swift
func deleteObject(_ object: R2Object) async throws {
    // Optimistic update
    let originalObjects = objects
    objects.removeAll { $0.id == object.id }

    do {
        try await apiClient.deleteObject(object)
        // Success - update already reflected
        invalidateCache()
        await refresh()
    } catch {
        // Rollback on error
        objects = originalObjects
        throw error
    }
}
```

### 3. Cache-First Pattern

```swift
func loadObjects(bucket: String, prefix: String) async {
    // Check cache first
    if let cached = cache.get(key: cacheKey) {
        state = .loaded(cached)

        // Background refresh if stale
        if cached.isStale {
            await backgroundRefresh()
        }
        return
    }

    // Cache miss - fetch from API
    state = .loading
    let data = try await apiClient.fetchData()
    state = .loaded(data)
    cache.set(key: cacheKey, data: data)
}
```

### 4. Debounced Search Pattern

```swift
// Setup debouncing
$searchQuery
    .debounce(for: .milliseconds(300), scheduler: RunLoop.main)
    .sink { [weak self] query in
        Task {
            await self?.performSearch(query)
        }
    }
    .store(in: &cancellables)
```

## Integration with SwiftUI

### App-level Setup

```swift
@main
struct CloudflareR2ObjectStorageBrowserApp: App {
    @StateObject private var serverManager = ServerManager()
    @StateObject private var apiClient: APIClient

    init() {
        let manager = ServerManager()
        _serverManager = StateObject(wrappedValue: manager)

        // APIClient observes ServerManager's port
        let client = APIClient()
        _apiClient = StateObject(wrappedValue: client)
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(serverManager)
                .environmentObject(apiClient)
        }
    }
}
```

### View-level Usage

```swift
struct BucketListView: View {
    @EnvironmentObject var apiClient: APIClient
    @StateObject private var viewModel: BucketListViewModel

    init() {
        // Inject dependencies
        _viewModel = StateObject(wrappedValue: BucketListViewModel(apiClient: apiClient))
    }

    var body: some View {
        Group {
            switch viewModel.state {
            case .idle:
                EmptyStateView()
            case .loading:
                ProgressView()
            case .loaded(let buckets):
                List(buckets) { bucket in
                    BucketRow(bucket: bucket)
                }
            case .failed(let error):
                ErrorView(error: error)
            }
        }
        .task {
            await viewModel.loadBuckets()
        }
    }
}
```

## Performance Optimizations

### 1. Lazy Loading
- Virtual scrolling for large lists
- Pagination support with continuation tokens

### 2. Caching
- LRU cache for folder listings
- Background refresh for stale data
- Cache invalidation on mutations

### 3. Debouncing
- Search queries debounced by 300ms
- Prevents excessive API calls

### 4. Concurrent Operations
- Async/await for parallel requests
- Configurable concurrency limits for transfers

### 5. Memory Management
- Weak references in Combine closures
- Task cancellation on view dismissal
- Limited cache size (100 entries)

## Error Handling

### User-Friendly Messages

```swift
enum R2Error: Error {
    case networkError(String)
    case serverError(Int, String)
    // ...

    var userMessage: String {
        switch self {
        case .networkError:
            return "Unable to connect. Check your network."
        case .unauthorized:
            return "Invalid credentials. Check account settings."
        // ...
        }
    }
}
```

### Error Display in Views

```swift
if let errorMessage = viewModel.errorMessage {
    VStack {
        Image(systemName: "exclamationmark.triangle")
        Text(errorMessage)
        Button("Retry") {
            Task { await viewModel.refresh() }
        }
    }
}
```

## Testing

### ViewModel Testing

```swift
@MainActor
final class BucketListViewModelTests: XCTestCase {
    func testLoadBuckets() async throws {
        let mockAPIClient = MockAPIClient()
        let viewModel = BucketListViewModel(apiClient: mockAPIClient)

        await viewModel.loadBuckets()

        XCTAssertTrue(viewModel.state.isLoaded)
        XCTAssertFalse(viewModel.buckets.isEmpty)
    }
}
```

### Cache Testing

```swift
@MainActor
final class FolderCacheTests: XCTestCase {
    func testLRUEviction() {
        let cache = FolderCache(configuration: .init(maxEntries: 2))

        // Add 3 entries
        cache.set(key: key1, objects: [], commonPrefixes: [], continuationToken: nil)
        cache.set(key: key2, objects: [], commonPrefixes: [], continuationToken: nil)
        cache.set(key: key3, objects: [], commonPrefixes: [], continuationToken: nil)

        // First entry should be evicted
        XCTAssertNil(cache.get(key: key1))
        XCTAssertNotNil(cache.get(key: key2))
        XCTAssertNotNil(cache.get(key: key3))
    }
}
```

## Future Enhancements

1. **Persistent Cache** - Save cache to disk for faster app launches
2. **Multi-Account Support** - Cache per account with separate keys
3. **Background Sync** - Periodic refresh of visible folders
4. **Offline Mode** - Queue operations when offline, sync when online
5. **Analytics** - Track cache hit rate, API performance metrics
6. **Prefetching** - Predictive loading of likely-to-be-visited folders

## Best Practices

1. **Always use @MainActor** for ViewModels and UI updates
2. **Prefer LoadingState<T>** over multiple boolean flags
3. **Invalidate cache** after mutations
4. **Handle errors gracefully** with user-friendly messages
5. **Debounce user input** (search, filters) to reduce API calls
6. **Use weak references** in Combine closures to prevent retain cycles
7. **Cancel tasks** when views disappear
8. **Test ViewModels** in isolation with mock services
9. **Document state transitions** for complex flows
10. **Monitor cache statistics** to tune configuration

## References

- [SwiftUI Documentation](https://developer.apple.com/documentation/swiftui)
- [Combine Framework](https://developer.apple.com/documentation/combine)
- [Swift Concurrency](https://docs.swift.org/swift-book/LanguageGuide/Concurrency.html)
- [MVVM Pattern](https://www.hackingwithswift.com/books/ios-swiftui/introducing-mvvm-into-your-swiftui-project)
