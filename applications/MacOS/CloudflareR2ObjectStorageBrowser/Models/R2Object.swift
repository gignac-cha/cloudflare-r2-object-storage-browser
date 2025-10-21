import Foundation

/// Represents an object in R2 storage
struct R2Object: Codable, Identifiable, Equatable {
    let key: String
    let size: Int64
    let lastModified: String
    let etag: String?
    let storageClass: String?

    // Computed property for SwiftUI Identifiable
    var id: String { key }

    // File name (last component of key)
    var name: String {
        if key.hasSuffix("/") {
            // Folder: remove trailing slash and get last component
            let trimmed = String(key.dropLast())
            return (trimmed as NSString).lastPathComponent
        } else {
            return (key as NSString).lastPathComponent
        }
    }

    // Is this a folder (prefix)?
    var isFolder: Bool {
        key.hasSuffix("/")
    }

    // File extension
    var fileExtension: String? {
        guard !isFolder else { return nil }
        let ext = (key as NSString).pathExtension
        return ext.isEmpty ? nil : ext.lowercased()
    }

    // File type category
    var fileType: FileType {
        guard let ext = fileExtension else {
            return isFolder ? .folder : .unknown
        }

        switch ext {
        case "jpg", "jpeg", "png", "gif", "webp", "heic", "svg", "bmp", "tiff":
            return .image
        case "mp4", "mov", "avi", "webm", "mkv", "m4v", "flv":
            return .video
        case "mp3", "wav", "aac", "flac", "m4a", "ogg":
            return .audio
        case "pdf", "doc", "docx", "txt", "md", "rtf", "pages":
            return .document
        case "zip", "tar", "gz", "rar", "7z", "bz2":
            return .archive
        case "js", "ts", "py", "swift", "go", "java", "cpp", "c", "h", "rs", "rb", "php":
            return .code
        case "json", "xml", "yaml", "yml", "csv", "log":
            return .data
        default:
            return .unknown
        }
    }

    // Human-readable file size
    var humanReadableSize: String {
        ByteCountFormatter.string(fromByteCount: size, countStyle: .file)
    }

    // Formatted last modified date
    var formattedLastModified: String? {
        // Folders don't have lastModified dates
        guard !lastModified.isEmpty else {
            return nil
        }

        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

        guard let date = formatter.date(from: lastModified) else {
            return nil
        }
        return DateFormatter.localizedString(from: date, dateStyle: .medium, timeStyle: .short)
    }

    // Relative time (e.g., "2 hours ago")
    var relativeLastModified: String? {
        // Folders don't have lastModified dates
        guard !lastModified.isEmpty else {
            return nil
        }

        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

        guard let date = formatter.date(from: lastModified) else {
            return nil
        }

        let relativeFormatter = RelativeDateTimeFormatter()
        relativeFormatter.unitsStyle = .abbreviated
        return relativeFormatter.localizedString(for: date, relativeTo: Date())
    }

    // Last modified date as Date object
    var lastModifiedDate: Date? {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter.date(from: lastModified)
    }
}

// MARK: - File Type Enum

enum FileType: String, CaseIterable {
    case folder = "Folder"
    case image = "Image"
    case video = "Video"
    case audio = "Audio"
    case document = "Document"
    case archive = "Archive"
    case code = "Code"
    case data = "Data"
    case unknown = "Unknown"

    var icon: String {
        switch self {
        case .folder: return "folder.fill"
        case .image: return "photo.fill"
        case .video: return "video.fill"
        case .audio: return "music.note"
        case .document: return "doc.fill"
        case .archive: return "doc.zipper"
        case .code: return "curlybraces"
        case .data: return "doc.text.fill"
        case .unknown: return "doc"
        }
    }
}

// MARK: - API Response Models

struct PaginationInfo: Codable {
    let isTruncated: Bool
    let maxKeys: Int
    let keyCount: Int
    let delimiter: String?
    let commonPrefixes: [String]
    let continuationToken: String?
    let prefix: String?
}

struct ObjectsResponse: Codable {
    let status: String
    let data: [R2Object]
    let pagination: PaginationInfo
    let meta: ResponseMeta
}

struct ObjectUploadResponse: Codable {
    let status: String
    let key: String
    let etag: String
    let size: Int64
}

struct DeleteData: Codable {
    let key: String
    let deleted: Bool
}

struct ObjectDeleteResponse: Codable {
    let status: String
    let data: DeleteData
    let meta: ResponseMeta
}

struct PresignedUrlData: Codable {
    let key: String
    let url: String
    let expiresIn: Int
    let expiresAt: String
}

struct PresignedUrlResponse: Codable {
    let status: String
    let data: PresignedUrlData
    let meta: ResponseMeta
}

// MARK: - Common Prefix (Folder)

struct CommonPrefix: Identifiable, Equatable {
    let prefix: String

    var id: String { prefix }

    var name: String {
        let trimmed = prefix.hasSuffix("/") ? String(prefix.dropLast()) : prefix
        return (trimmed as NSString).lastPathComponent
    }

    var displayName: String {
        name
    }
}
