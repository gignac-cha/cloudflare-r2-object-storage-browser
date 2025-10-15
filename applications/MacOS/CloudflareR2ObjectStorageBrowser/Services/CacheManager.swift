import Foundation

/// Manages local file cache for R2 objects
class CacheManager {
    static let shared = CacheManager()

    private let fileManager = FileManager.default
    private let cacheDirectoryName = "cache"

    /// Base configuration directory
    private var configDirectory: URL {
        let homeDirectory = fileManager.homeDirectoryForCurrentUser
        return homeDirectory.appendingPathComponent(".cloudflare-r2-object-storage-browser")
    }

    /// Cache directory for downloaded files
    var cacheDirectory: URL {
        configDirectory.appendingPathComponent(cacheDirectoryName)
    }

    private init() {
        createCacheDirectoryIfNeeded()
    }

    // MARK: - Directory Management

    /// Creates cache directory if it doesn't exist
    private func createCacheDirectoryIfNeeded() {
        if !fileManager.fileExists(atPath: cacheDirectory.path) {
            try? fileManager.createDirectory(
                at: cacheDirectory,
                withIntermediateDirectories: true,
                attributes: nil
            )
        }
    }

    // MARK: - Cache Operations

    /// Saves data to cache with the given key (object key from R2)
    func saveToCache(data: Data, forKey key: String) throws -> URL {
        createCacheDirectoryIfNeeded()

        // Create subdirectories if the key contains path separators
        let fileURL = cacheFileURL(forKey: key)
        let directoryURL = fileURL.deletingLastPathComponent()

        if !fileManager.fileExists(atPath: directoryURL.path) {
            try fileManager.createDirectory(
                at: directoryURL,
                withIntermediateDirectories: true,
                attributes: nil
            )
        }

        try data.write(to: fileURL)
        return fileURL
    }

    /// Returns the cache file URL for a given key
    func cacheFileURL(forKey key: String) -> URL {
        cacheDirectory.appendingPathComponent(key)
    }

    /// Checks if a file exists in cache
    func isCached(key: String) -> Bool {
        let fileURL = cacheFileURL(forKey: key)
        return fileManager.fileExists(atPath: fileURL.path)
    }

    /// Gets cached file URL if it exists
    func getCachedFileURL(forKey key: String) -> URL? {
        guard isCached(key: key) else { return nil }
        return cacheFileURL(forKey: key)
    }

    /// Moves cached file to a custom location
    func moveCachedFile(forKey key: String, to destinationURL: URL) throws {
        guard let sourceURL = getCachedFileURL(forKey: key) else {
            throw CacheError.fileNotFound
        }

        // Create destination directory if needed
        let destinationDir = destinationURL.deletingLastPathComponent()
        if !fileManager.fileExists(atPath: destinationDir.path) {
            try fileManager.createDirectory(
                at: destinationDir,
                withIntermediateDirectories: true,
                attributes: nil
            )
        }

        // Move file
        try fileManager.moveItem(at: sourceURL, to: destinationURL)

        // Clean up empty parent directories
        cleanupEmptyDirectories(at: sourceURL.deletingLastPathComponent())
    }

    /// Copies cached file to a custom location (keeps original in cache)
    func copyCachedFile(forKey key: String, to destinationURL: URL) throws {
        guard let sourceURL = getCachedFileURL(forKey: key) else {
            throw CacheError.fileNotFound
        }

        // Create destination directory if needed
        let destinationDir = destinationURL.deletingLastPathComponent()
        if !fileManager.fileExists(atPath: destinationDir.path) {
            try fileManager.createDirectory(
                at: destinationDir,
                withIntermediateDirectories: true,
                attributes: nil
            )
        }

        // Copy file
        try fileManager.copyItem(at: sourceURL, to: destinationURL)
    }

    /// Removes a file from cache
    func removeCachedFile(forKey key: String) throws {
        guard let fileURL = getCachedFileURL(forKey: key) else {
            throw CacheError.fileNotFound
        }

        try fileManager.removeItem(at: fileURL)

        // Clean up empty parent directories
        cleanupEmptyDirectories(at: fileURL.deletingLastPathComponent())
    }

    /// Clears all cached files
    func clearCache() throws {
        if fileManager.fileExists(atPath: cacheDirectory.path) {
            try fileManager.removeItem(at: cacheDirectory)
        }
        createCacheDirectoryIfNeeded()
    }

    /// Gets the size of cached files in bytes
    func getCacheSize() -> UInt64 {
        guard let enumerator = fileManager.enumerator(
            at: cacheDirectory,
            includingPropertiesForKeys: [.fileSizeKey],
            options: [.skipsHiddenFiles]
        ) else {
            return 0
        }

        var totalSize: UInt64 = 0
        for case let fileURL as URL in enumerator {
            guard let resourceValues = try? fileURL.resourceValues(forKeys: [.fileSizeKey]),
                  let fileSize = resourceValues.fileSize else {
                continue
            }
            totalSize += UInt64(fileSize)
        }

        return totalSize
    }

    /// Gets list of all cached file keys
    func getCachedFileKeys() -> [String] {
        guard let enumerator = fileManager.enumerator(
            at: cacheDirectory,
            includingPropertiesForKeys: [.isRegularFileKey],
            options: [.skipsHiddenFiles]
        ) else {
            return []
        }

        var keys: [String] = []
        for case let fileURL as URL in enumerator {
            guard let resourceValues = try? fileURL.resourceValues(forKeys: [.isRegularFileKey]),
                  resourceValues.isRegularFile == true else {
                continue
            }

            // Get relative path from cache directory
            let relativePath = fileURL.path.replacingOccurrences(
                of: cacheDirectory.path + "/",
                with: ""
            )
            keys.append(relativePath)
        }

        return keys
    }

    // MARK: - Private Helpers

    /// Recursively removes empty directories up to cache directory
    private func cleanupEmptyDirectories(at url: URL) {
        // Don't remove the cache directory itself
        guard url.path != cacheDirectory.path else { return }

        // Check if directory is empty
        guard let contents = try? fileManager.contentsOfDirectory(atPath: url.path),
              contents.isEmpty else {
            return
        }

        // Remove empty directory
        try? fileManager.removeItem(at: url)

        // Continue up the tree
        cleanupEmptyDirectories(at: url.deletingLastPathComponent())
    }
}

// MARK: - Errors

enum CacheError: LocalizedError {
    case fileNotFound
    case saveFailed

    var errorDescription: String? {
        switch self {
        case .fileNotFound:
            return "File not found in cache"
        case .saveFailed:
            return "Failed to save file to cache"
        }
    }
}
