import Foundation

/// Represents an R2 bucket
struct Bucket: Codable, Identifiable, Equatable {
    let name: String
    let creationDate: String?

    // Computed property for SwiftUI Identifiable
    var id: String { name }

    // Display name (formatted)
    var displayName: String {
        name.replacingOccurrences(of: "-", with: " ").capitalized
    }

    // Formatted creation date
    var formattedCreationDate: String? {
        guard let dateString = creationDate,
              let date = ISO8601DateFormatter().date(from: dateString) else {
            return nil
        }
        return DateFormatter.localizedString(from: date, dateStyle: .medium, timeStyle: .short)
    }

    // Relative time (e.g., "2 hours ago")
    var relativeCreationDate: String? {
        guard let dateString = creationDate,
              let date = ISO8601DateFormatter().date(from: dateString) else {
            return nil
        }

        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .full
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

// MARK: - API Response Models

struct BucketsData: Codable {
    let buckets: [Bucket]
    let count: Int
}

struct ResponseMeta: Codable {
    let timestamp: String
    let requestId: String
}

struct BucketsResponse: Codable {
    let status: String
    let data: BucketsData
    let meta: ResponseMeta
}
