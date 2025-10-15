import Foundation
import Combine

/// ViewModel for managing bucket list state
@MainActor
class BucketListViewModel: ObservableObject {
    // MARK: - Published Properties

    @Published var state: LoadingState<[Bucket]> = .idle
    @Published var selectedBucket: Bucket?
    @Published var searchQuery: String = ""

    // MARK: - Dependencies

    private let apiClient: APIClient
    private var cancellables = Set<AnyCancellable>()

    // MARK: - Computed Properties

    var buckets: [Bucket] {
        state.value ?? []
    }

    var filteredBuckets: [Bucket] {
        guard !searchQuery.isEmpty else {
            return buckets
        }

        let query = searchQuery.lowercased()
        return buckets.filter { bucket in
            bucket.name.lowercased().contains(query)
        }
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

    // MARK: - Initialization

    init(apiClient: APIClient) {
        self.apiClient = apiClient
    }

    // MARK: - Public Methods

    /// Load buckets from API
    func loadBuckets(forceRefresh: Bool = false) async {
        // Don't reload if already loaded and not forcing refresh
        if !forceRefresh && state.isLoaded {
            return
        }

        state = .loading

        do {
            let buckets = try await apiClient.listBuckets()
            state = .loaded(buckets)

            // Auto-select first bucket if none selected
            if selectedBucket == nil, let first = buckets.first {
                selectedBucket = first
            }
        } catch {
            state = .failed(error)
        }
    }

    /// Refresh buckets (force reload)
    func refresh() async {
        await loadBuckets(forceRefresh: true)
    }

    /// Select a bucket
    func selectBucket(_ bucket: Bucket) {
        selectedBucket = bucket
    }

    /// Deselect bucket
    func deselectBucket() {
        selectedBucket = nil
    }

    /// Clear error state
    func clearError() {
        if state.isFailed {
            state = .idle
        }
    }
}
