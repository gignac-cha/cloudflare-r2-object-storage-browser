import Foundation

/// LRU cache for folder listings
@MainActor
class FolderCache {
    // MARK: - Configuration

    struct Configuration {
        var maxEntries: Int = 100
        var ttl: TimeInterval = 300 // 5 minutes
        var backgroundRefreshThreshold: TimeInterval = 120 // 2 minutes

        static let `default` = Configuration()
    }

    // MARK: - Cache Entry

    struct CacheEntry {
        let key: CacheKey
        let objects: [R2Object]
        let commonPrefixes: [String]
        let continuationToken: String?
        let timestamp: Date

        var age: TimeInterval {
            Date().timeIntervalSince(timestamp)
        }

        var isStale: Bool {
            age > 120 // 2 minutes
        }
    }

    // MARK: - Cache Key

    struct CacheKey: Hashable, CustomStringConvertible {
        let accountId: String?
        let bucketName: String
        let prefix: String

        init(accountId: String? = nil, bucketName: String, prefix: String = "") {
            self.accountId = accountId
            self.bucketName = bucketName
            self.prefix = prefix
        }

        var description: String {
            if let accountId = accountId {
                return "\(accountId):\(bucketName):\(prefix)"
            }
            return "\(bucketName):\(prefix)"
        }
    }

    // MARK: - Properties

    private var cache: [CacheKey: CacheEntry] = [:]
    private var accessOrder: [CacheKey] = []

    var configuration: Configuration

    // MARK: - Initialization

    init(configuration: Configuration = .default) {
        self.configuration = configuration
    }

    // MARK: - Cache Operations

    /// Get entry from cache
    func get(key: CacheKey) -> CacheEntry? {
        guard let entry = cache[key] else {
            return nil
        }

        // Check if expired
        if entry.age > configuration.ttl {
            remove(key: key)
            return nil
        }

        // Update access order (move to end)
        updateAccessOrder(key: key)

        return entry
    }

    /// Set entry in cache
    func set(
        key: CacheKey,
        objects: [R2Object],
        commonPrefixes: [String],
        continuationToken: String?
    ) {
        let entry = CacheEntry(
            key: key,
            objects: objects,
            commonPrefixes: commonPrefixes,
            continuationToken: continuationToken,
            timestamp: Date()
        )

        cache[key] = entry
        updateAccessOrder(key: key)

        // Evict oldest entries if over limit (LRU)
        if accessOrder.count > configuration.maxEntries {
            let keysToRemove = accessOrder.prefix(accessOrder.count - configuration.maxEntries)
            keysToRemove.forEach { remove(key: $0) }
        }
    }

    /// Remove entry from cache
    func remove(key: CacheKey) {
        cache.removeValue(forKey: key)
        accessOrder.removeAll { $0 == key }
    }

    /// Invalidate cache for a specific bucket
    func invalidateBucket(bucketName: String) {
        let keysToRemove = cache.keys.filter { $0.bucketName == bucketName }
        keysToRemove.forEach { remove(key: $0) }
    }

    /// Invalidate cache for a specific prefix
    func invalidatePrefix(bucketName: String, prefix: String) {
        // Invalidate the exact prefix
        let exactKey = CacheKey(bucketName: bucketName, prefix: prefix)
        remove(key: exactKey)

        // Invalidate parent prefix (folder containing this one)
        if !prefix.isEmpty {
            let parentPrefix = (prefix as NSString).deletingLastPathComponent
            let parentKey = CacheKey(bucketName: bucketName, prefix: parentPrefix)
            remove(key: parentKey)
        }

        // Invalidate child prefixes (subfolders)
        let keysToRemove = cache.keys.filter { key in
            key.bucketName == bucketName && key.prefix.hasPrefix(prefix)
        }
        keysToRemove.forEach { remove(key: $0) }
    }

    /// Clear all cache entries
    func clear() {
        cache.removeAll()
        accessOrder.removeAll()
    }

    /// Get cache statistics
    func statistics() -> CacheStatistics {
        let totalEntries = cache.count
        let staleEntries = cache.values.filter { $0.isStale }.count
        let totalSize = cache.values.reduce(0) { $0 + $1.objects.count + $1.commonPrefixes.count }

        return CacheStatistics(
            totalEntries: totalEntries,
            staleEntries: staleEntries,
            totalSize: totalSize,
            maxEntries: configuration.maxEntries,
            ttl: configuration.ttl
        )
    }

    // MARK: - Private Helpers

    private func updateAccessOrder(key: CacheKey) {
        // Remove if exists
        accessOrder.removeAll { $0 == key }
        // Add to end (most recently used)
        accessOrder.append(key)
    }
}

// MARK: - Cache Statistics

struct CacheStatistics {
    let totalEntries: Int
    let staleEntries: Int
    let totalSize: Int
    let maxEntries: Int
    let ttl: TimeInterval

    var hitRate: Double {
        // This would need to track hits/misses
        0.0
    }

    var utilizationPercentage: Double {
        guard maxEntries > 0 else { return 0 }
        return Double(totalEntries) / Double(maxEntries) * 100
    }

    var averageItemsPerEntry: Double {
        guard totalEntries > 0 else { return 0 }
        return Double(totalSize) / Double(totalEntries)
    }
}
