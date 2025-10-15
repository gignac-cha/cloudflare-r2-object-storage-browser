import Foundation

/// Manages application settings and credential storage
@MainActor
class SettingsManager: ObservableObject {
    @Published var hasCredentials: Bool = false

    private let configDirName = ".cloudflare-r2-object-storage-browser"
    private let configFileName = "settings.json"

    nonisolated private var configFileURL: URL {
        let homeDir = FileManager.default.homeDirectoryForCurrentUser
        let configDir = homeDir.appendingPathComponent(configDirName)
        return configDir.appendingPathComponent(configFileName)
    }

    nonisolated private var configDirURL: URL {
        FileManager.default.homeDirectoryForCurrentUser
            .appendingPathComponent(configDirName)
    }

    init() {
        checkCredentials()
    }

    // MARK: - Public Properties

    nonisolated var accountId: String? {
        get { loadConfig()?.accountId }
    }

    nonisolated var accessKeyId: String? {
        get { loadConfig()?.accessKeyId }
    }

    nonisolated var secretAccessKey: String? {
        get { loadConfig()?.secretAccessKey }
    }

    // MARK: - Public Methods

    /// Save R2 credentials to config file
    func saveCredentials(accountId: String, accessKeyId: String, secretAccessKey: String) throws {
        // Validate input
        guard !accountId.isEmpty, !accessKeyId.isEmpty, !secretAccessKey.isEmpty else {
            throw SettingsError.invalidInput
        }

        let config = R2Config(
            accountId: accountId,
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey,
            endpoint: "https://\(accountId).r2.cloudflarestorage.com",
            lastUpdated: ISO8601DateFormatter().string(from: Date())
        )

        try saveConfig(config)

        hasCredentials = true
    }

    /// Clear all stored credentials
    func clearCredentials() {
        try? FileManager.default.removeItem(at: configFileURL)
        hasCredentials = false
    }

    // MARK: - Private Methods

    private func checkCredentials() {
        hasCredentials = accountId != nil && accessKeyId != nil && secretAccessKey != nil
    }

    // MARK: - File Operations

    nonisolated private func loadConfig() -> R2Config? {
        guard FileManager.default.fileExists(atPath: configFileURL.path) else {
            return nil
        }

        do {
            let data = try Data(contentsOf: configFileURL)
            let decoder = JSONDecoder()
            return try decoder.decode(R2Config.self, from: data)
        } catch {
            print("Failed to load config: \(error)")
            return nil
        }
    }

    private func saveConfig(_ config: R2Config) throws {
        // Create config directory if it doesn't exist
        let fileManager = FileManager.default
        if !fileManager.fileExists(atPath: configDirURL.path) {
            try fileManager.createDirectory(
                at: configDirURL,
                withIntermediateDirectories: true,
                attributes: [.posixPermissions: 0o700]
            )
        }

        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]

        let data = try encoder.encode(config)
        try data.write(to: configFileURL, options: .atomic)

        // Set file permissions to user-only (600)
        try fileManager.setAttributes(
            [.posixPermissions: 0o600],
            ofItemAtPath: configFileURL.path
        )
    }

}

// MARK: - Models

struct R2Config: Codable {
    let accountId: String
    let accessKeyId: String
    let secretAccessKey: String
    let endpoint: String
    let lastUpdated: String
}

// MARK: - Errors

enum SettingsError: LocalizedError {
    case invalidInput
    case encodingFailed
    case fileOperationFailed

    var errorDescription: String? {
        switch self {
        case .invalidInput:
            return "All credential fields are required"
        case .encodingFailed:
            return "Failed to encode credential data"
        case .fileOperationFailed:
            return "Failed to save configuration file"
        }
    }
}
