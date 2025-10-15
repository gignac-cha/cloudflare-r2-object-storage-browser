import Foundation

/// Represents an R2 account configuration
struct Account: Identifiable, Codable, Equatable {
    let id: UUID
    var name: String
    var endpoint: String
    var accessKeyId: String
    var isDefault: Bool
    let createdAt: Date
    var lastUsedAt: Date?

    // Secret access key is NOT stored here - it's in Keychain

    init(
        id: UUID = UUID(),
        name: String,
        endpoint: String,
        accessKeyId: String,
        isDefault: Bool = false,
        createdAt: Date = Date(),
        lastUsedAt: Date? = nil
    ) {
        self.id = id
        self.name = name
        self.endpoint = endpoint
        self.accessKeyId = accessKeyId
        self.isDefault = isDefault
        self.createdAt = createdAt
        self.lastUsedAt = lastUsedAt
    }

    // Display name with account info
    var displayName: String {
        "\(name) (\(accessKeyId))"
    }

    // Formatted endpoint
    var formattedEndpoint: String {
        endpoint.replacingOccurrences(of: "https://", with: "")
            .replacingOccurrences(of: "http://", with: "")
    }

    // Last used relative time
    var relativeLastUsed: String? {
        guard let lastUsed = lastUsedAt else {
            return "Never used"
        }

        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: lastUsed, relativeTo: Date())
    }
}

// MARK: - Account Validation

extension Account {
    /// Validates account configuration
    func validate() -> ValidationResult {
        var errors: [String] = []

        if name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            errors.append("Account name is required")
        }

        if endpoint.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            errors.append("Endpoint URL is required")
        } else if !endpoint.hasPrefix("http://") && !endpoint.hasPrefix("https://") {
            errors.append("Endpoint URL must start with http:// or https://")
        }

        if accessKeyId.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            errors.append("Access Key ID is required")
        }

        return errors.isEmpty ? .valid : .invalid(errors)
    }

    enum ValidationResult {
        case valid
        case invalid([String])

        var isValid: Bool {
            if case .valid = self {
                return true
            }
            return false
        }

        var errors: [String] {
            if case .invalid(let errors) = self {
                return errors
            }
            return []
        }
    }
}
