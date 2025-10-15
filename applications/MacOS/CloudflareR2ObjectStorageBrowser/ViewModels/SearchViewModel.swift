import Foundation
import Combine

/// ViewModel for search and filter functionality
@MainActor
class SearchViewModel: ObservableObject {
    // MARK: - Published Properties

    @Published var searchQuery: String = ""
    @Published var searchScope: SearchScope = .currentFolder
    @Published var state: LoadingState<[R2Object]> = .idle

    // Filter properties
    @Published var selectedFileTypes: Set<FileType> = []
    @Published var dateRange: DateRange?
    @Published var sizeRange: SizeRange?

    // MARK: - Dependencies

    private let apiClient: APIClient
    private var cancellables = Set<AnyCancellable>()
    private var searchTask: Task<Void, Never>?

    // MARK: - Computed Properties

    var results: [R2Object] {
        state.value ?? []
    }

    var filteredResults: [R2Object] {
        var objects = results

        // Apply file type filter
        if !selectedFileTypes.isEmpty {
            objects = objects.filter { object in
                selectedFileTypes.contains(object.fileType)
            }
        }

        // Apply date range filter
        if let dateRange = dateRange {
            objects = objects.filter { object in
                guard let date = object.lastModifiedDate else { return false }
                return dateRange.contains(date)
            }
        }

        // Apply size range filter
        if let sizeRange = sizeRange {
            objects = objects.filter { object in
                sizeRange.contains(object.size)
            }
        }

        return objects
    }

    var isSearching: Bool {
        state.isLoading
    }

    var hasResults: Bool {
        !filteredResults.isEmpty
    }

    var isActive: Bool {
        !searchQuery.isEmpty || !selectedFileTypes.isEmpty || dateRange != nil || sizeRange != nil
    }

    // MARK: - Initialization

    init(apiClient: APIClient) {
        self.apiClient = apiClient
        setupSearchDebouncing()
    }

    // MARK: - Public Methods

    /// Perform search
    func search(bucket: String, prefix: String?) async {
        // Cancel previous search
        searchTask?.cancel()

        guard !searchQuery.isEmpty else {
            state = .idle
            return
        }

        state = .loading

        searchTask = Task {
            // Debounce
            try? await Task.sleep(nanoseconds: 300_000_000) // 300ms

            guard !Task.isCancelled else { return }

            do {
                let results = try await apiClient.searchObjects(bucket: bucket, query: searchQuery)

                guard !Task.isCancelled else { return }

                // Filter by prefix if searching in current folder
                let filteredResults: [R2Object]
                if searchScope == .currentFolder, let prefix = prefix {
                    filteredResults = results.filter { $0.key.hasPrefix(prefix) }
                } else {
                    filteredResults = results
                }

                state = .loaded(filteredResults)
            } catch {
                guard !Task.isCancelled else { return }
                state = .failed(error)
            }
        }
    }

    /// Clear search and filters
    func clear() {
        searchQuery = ""
        selectedFileTypes.removeAll()
        dateRange = nil
        sizeRange = nil
        state = .idle
        searchTask?.cancel()
    }

    /// Toggle file type filter
    func toggleFileType(_ type: FileType) {
        if selectedFileTypes.contains(type) {
            selectedFileTypes.remove(type)
        } else {
            selectedFileTypes.insert(type)
        }
    }

    /// Set date range filter
    func setDateRange(_ range: DateRange?) {
        dateRange = range
    }

    /// Set size range filter
    func setSizeRange(_ range: SizeRange?) {
        sizeRange = range
    }

    /// Set search scope
    func setSearchScope(_ scope: SearchScope) {
        searchScope = scope
    }

    // MARK: - Private Methods

    private func setupSearchDebouncing() {
        $searchQuery
            .debounce(for: .milliseconds(300), scheduler: RunLoop.main)
            .sink { [weak self] _ in
                // Trigger search in the calling context
                self?.objectWillChange.send()
            }
            .store(in: &cancellables)
    }
}

// MARK: - Supporting Types

enum SearchScope: String, CaseIterable {
    case currentFolder = "Current Folder"
    case entireBucket = "Entire Bucket"
}

struct DateRange {
    let start: Date?
    let end: Date?

    static let today = DateRange(
        start: Calendar.current.startOfDay(for: Date()),
        end: nil
    )

    static let last7Days = DateRange(
        start: Calendar.current.date(byAdding: .day, value: -7, to: Date()),
        end: nil
    )

    static let last30Days = DateRange(
        start: Calendar.current.date(byAdding: .day, value: -30, to: Date()),
        end: nil
    )

    func contains(_ date: Date) -> Bool {
        if let start = start, date < start {
            return false
        }
        if let end = end, date > end {
            return false
        }
        return true
    }
}

struct SizeRange {
    let min: Int64?
    let max: Int64?

    func contains(_ size: Int64) -> Bool {
        if let min = min, size < min {
            return false
        }
        if let max = max, size > max {
            return false
        }
        return true
    }

    var humanReadable: String {
        let formatter = ByteCountFormatter()
        formatter.countStyle = .file

        if let min = min, let max = max {
            return "\(formatter.string(fromByteCount: min)) - \(formatter.string(fromByteCount: max))"
        } else if let min = min {
            return "≥ \(formatter.string(fromByteCount: min))"
        } else if let max = max {
            return "≤ \(formatter.string(fromByteCount: max))"
        } else {
            return "Any size"
        }
    }
}
