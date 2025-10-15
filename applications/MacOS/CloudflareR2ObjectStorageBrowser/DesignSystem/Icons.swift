//
//  Icons.swift
//  CloudflareR2ObjectStorageBrowser
//
//  Design System - Icons
//  SF Symbols 7 icon system with semantic naming
//  6,900+ symbols designed to integrate with San Francisco font
//

import SwiftUI

/// Centralized icon system using SF Symbols 7
/// All icons are semantic and support variable color, multicolor, and animations
struct DSIcons {

    // MARK: - Storage & Objects

    /// Bucket icon - Use tray.fill for bucket/container
    static let bucket = "tray.fill"

    /// Alternative bucket icon with more detail
    static let bucketDetailed = "tray.2.fill"

    /// Folder icon - Standard folder
    static let folder = "folder.fill"

    /// Folder open state
    static let folderOpen = "folder.fill.badge.plus"

    /// File/Document icon - Generic file
    static let file = "doc.fill"

    /// Text file
    static let fileText = "doc.text.fill"

    /// Image file
    static let fileImage = "photo.fill"

    /// Video file
    static let fileVideo = "video.fill"

    /// Audio file
    static let fileAudio = "music.note"

    /// Archive/ZIP file
    static let fileArchive = "doc.zipper"

    /// Code file
    static let fileCode = "curlybraces"

    /// PDF file
    static let filePDF = "doc.richtext.fill"

    // MARK: - Actions

    /// Upload action
    static let upload = "arrow.up.doc.fill"

    /// Upload to cloud
    static let uploadCloud = "icloud.and.arrow.up.fill"

    /// Download action
    static let download = "arrow.down.doc.fill"

    /// Download from cloud
    static let downloadCloud = "icloud.and.arrow.down.fill"

    /// Delete/Remove
    static let delete = "trash.fill"

    /// Delete permanently
    static let deletePermanent = "xmark.bin.fill"

    /// Rename/Edit
    static let rename = "pencil"

    /// Copy
    static let copy = "doc.on.doc.fill"

    /// Move
    static let move = "folder.fill.badge.gearshape"

    /// Refresh/Reload
    static let refresh = "arrow.clockwise"

    /// Sync
    static let sync = "arrow.triangle.2.circlepath"

    // MARK: - Navigation

    /// Back arrow
    static let back = "chevron.left"

    /// Forward arrow
    static let forward = "chevron.right"

    /// Up to parent
    static let up = "chevron.up"

    /// Down to child
    static let down = "chevron.down"

    /// Home
    static let home = "house.fill"

    /// Breadcrumb separator
    static let breadcrumbSeparator = "chevron.right"

    // MARK: - Search & Filter

    /// Search/Find
    static let search = "magnifyingglass"

    /// Search with circle background
    static let searchCircle = "magnifyingglass.circle.fill"

    /// Filter
    static let filter = "line.3.horizontal.decrease.circle"

    /// Sort ascending
    static let sortAscending = "arrow.up.arrow.down"

    /// Sort descending
    static let sortDescending = "arrow.down.arrow.up"

    /// Clear filter/search
    static let clear = "xmark.circle.fill"

    // MARK: - Status & Indicators

    /// Success/Checkmark
    static let success = "checkmark.circle.fill"

    /// Error/Warning
    static let error = "exclamationmark.triangle.fill"

    /// Info
    static let info = "info.circle.fill"

    /// Loading/Progress
    static let loading = "arrow.clockwise.circle.fill"

    /// Paused state
    static let paused = "pause.circle.fill"

    /// Playing/Active
    static let playing = "play.circle.fill"

    /// Stopped
    static let stopped = "stop.circle.fill"

    /// Connection status (connected)
    static let connected = "circle.fill"

    /// Connection status (disconnected)
    static let disconnected = "circle"

    // MARK: - View Options

    /// List view
    static let viewList = "list.bullet"

    /// Grid view
    static let viewGrid = "square.grid.2x2.fill"

    /// Column view
    static let viewColumn = "rectangle.split.3x1.fill"

    /// Preview pane
    static let viewPreview = "sidebar.right"

    // MARK: - Transfer & Progress

    /// Upload progress
    static let uploadProgress = "arrow.up.circle"

    /// Download progress
    static let downloadProgress = "arrow.down.circle"

    /// Transfer speed (fast)
    static let speedFast = "hare.fill"

    /// Transfer speed (slow)
    static let speedSlow = "tortoise.fill"

    /// Queue
    static let queue = "list.bullet.rectangle.fill"

    // MARK: - Settings & Tools

    /// Settings/Preferences
    static let settings = "gearshape.fill"

    /// Account/User
    static let account = "person.crop.circle.fill"

    /// Key/Credentials
    static let credentials = "key.fill"

    /// Server/Cloud
    static let server = "externaldrive.fill.badge.wifi"

    /// Connection endpoint
    static let endpoint = "network"

    // MARK: - Window & UI

    /// Sidebar toggle
    static let sidebar = "sidebar.left"

    /// Toolbar
    static let toolbar = "slider.horizontal.3"

    /// Panel/Window
    static let panel = "rectangle.split.3x1"

    /// Full screen
    static let fullScreen = "arrow.up.left.and.arrow.down.right"

    /// Minimize
    static let minimize = "minus.circle"

    /// Close
    static let close = "xmark.circle.fill"

    // MARK: - Clipboard & Sharing

    /// Copy to clipboard
    static let clipboard = "doc.on.clipboard.fill"

    /// Share
    static let share = "square.and.arrow.up"

    /// Link/URL
    static let link = "link.circle.fill"

    /// QR Code
    static let qrCode = "qrcode"

    // MARK: - Notifications

    /// Bell/Alert
    static let notification = "bell.fill"

    /// Badge/Count
    static let badge = "app.badge.fill"

    /// Message
    static let message = "message.fill"

    // MARK: - Debug & Development

    /// Console/Terminal
    static let console = "terminal.fill"

    /// Log
    static let log = "doc.plaintext.fill"

    /// Bug
    static let bug = "ladybug.fill"

    /// API
    static let api = "network"

    /// Database
    static let database = "cylinder.fill"
}

// MARK: - Icon Size Presets

extension DSIcons {
    enum Size {
        case small
        case regular
        case large
        case extraLarge
        case massive

        var value: CGFloat {
            switch self {
            case .small: return DSSpacing.Icon.small
            case .regular: return DSSpacing.Icon.regular
            case .large: return DSSpacing.Icon.large
            case .extraLarge: return DSSpacing.Icon.extraLarge
            case .massive: return DSSpacing.Icon.massive
            }
        }
    }
}

// MARK: - Icon View Component

/// Reusable icon view with consistent styling
struct DSIcon: View {
    let name: String
    var size: DSIcons.Size = .regular
    var color: Color? = nil
    var weight: Font.Weight = .regular

    var body: some View {
        Image(systemName: name)
            .font(.system(size: size.value, weight: weight))
            .foregroundColor(color ?? DSColors.iconDefault)
    }
}

// MARK: - Specialized Icon Components

/// Bucket icon with semantic color
struct BucketIcon: View {
    var size: DSIcons.Size = .regular

    var body: some View {
        DSIcon(name: DSIcons.bucket, size: size, color: DSColors.iconBucket)
    }
}

/// Folder icon with semantic color
struct FolderIcon: View {
    var size: DSIcons.Size = .regular
    var isOpen: Bool = false

    var body: some View {
        DSIcon(
            name: isOpen ? DSIcons.folderOpen : DSIcons.folder,
            size: size,
            color: DSColors.iconFolder
        )
    }
}

/// File icon with type-based color
struct FileIcon: View {
    let fileType: FileType
    var size: DSIcons.Size = .regular

    var body: some View {
        DSIcon(
            name: fileType.iconName,
            size: size,
            color: fileType.iconColor
        )
    }

    enum FileType {
        case generic
        case text
        case image
        case video
        case audio
        case archive
        case code
        case pdf

        var iconName: String {
            switch self {
            case .generic: return DSIcons.file
            case .text: return DSIcons.fileText
            case .image: return DSIcons.fileImage
            case .video: return DSIcons.fileVideo
            case .audio: return DSIcons.fileAudio
            case .archive: return DSIcons.fileArchive
            case .code: return DSIcons.fileCode
            case .pdf: return DSIcons.filePDF
            }
        }

        var iconColor: Color {
            switch self {
            case .generic: return DSColors.iconFile
            case .text: return DSColors.fileTypeDocument
            case .image: return DSColors.fileTypeImage
            case .video: return DSColors.fileTypeVideo
            case .audio: return DSColors.fileTypeAudio
            case .archive: return DSColors.fileTypeArchive
            case .code: return DSColors.fileTypeCode
            case .pdf: return DSColors.fileTypeDocument
            }
        }
    }
}

/// Status icon with semantic color
struct StatusIcon: View {
    let status: StatusType
    var size: DSIcons.Size = .regular

    var body: some View {
        DSIcon(
            name: status.iconName,
            size: size,
            color: status.iconColor
        )
    }

    enum StatusType {
        case success
        case error
        case warning
        case info
        case loading

        var iconName: String {
            switch self {
            case .success: return DSIcons.success
            case .error: return DSIcons.error
            case .warning: return DSIcons.error
            case .info: return DSIcons.info
            case .loading: return DSIcons.loading
            }
        }

        var iconColor: Color {
            switch self {
            case .success: return DSColors.success
            case .error: return DSColors.error
            case .warning: return DSColors.warning
            case .info: return DSColors.info
            case .loading: return DSColors.iconActive
            }
        }
    }
}

/// Transfer direction icon (upload/download)
struct TransferIcon: View {
    let direction: TransferDirection
    var size: DSIcons.Size = .regular

    var body: some View {
        DSIcon(
            name: direction.iconName,
            size: size,
            color: direction.iconColor
        )
    }

    enum TransferDirection {
        case upload
        case download

        var iconName: String {
            switch self {
            case .upload: return DSIcons.upload
            case .download: return DSIcons.download
            }
        }

        var iconColor: Color {
            switch self {
            case .upload: return DSColors.transferUpload
            case .download: return DSColors.transferDownload
            }
        }
    }
}

// MARK: - File Extension to FileType Mapping

extension FileIcon.FileType {
    /// Determine file type from file extension
    static func from(extension ext: String) -> FileIcon.FileType {
        let lowercased = ext.lowercased()

        // Image extensions
        if ["jpg", "jpeg", "png", "gif", "webp", "heic", "svg", "bmp", "tiff"].contains(lowercased) {
            return .image
        }

        // Video extensions
        if ["mp4", "mov", "avi", "webm", "mkv", "m4v", "flv"].contains(lowercased) {
            return .video
        }

        // Audio extensions
        if ["mp3", "wav", "aac", "flac", "m4a", "ogg", "wma"].contains(lowercased) {
            return .audio
        }

        // Archive extensions
        if ["zip", "tar", "gz", "rar", "7z", "bz2", "xz"].contains(lowercased) {
            return .archive
        }

        // Code extensions
        if ["js", "ts", "py", "swift", "go", "java", "cpp", "c", "h", "rs", "rb", "php", "html", "css", "json", "xml", "yaml", "yml"].contains(lowercased) {
            return .code
        }

        // Text extensions
        if ["txt", "md", "log", "csv"].contains(lowercased) {
            return .text
        }

        // PDF
        if lowercased == "pdf" {
            return .pdf
        }

        return .generic
    }

    /// Determine file type from file name
    static func from(fileName: String) -> FileIcon.FileType {
        let components = fileName.split(separator: ".")
        guard let ext = components.last else { return .generic }
        return from(extension: String(ext))
    }
}

// MARK: - Preview

#if DEBUG
struct DSIcons_Previews: PreviewProvider {
    static var previews: some View {
        ScrollView {
            VStack(spacing: DSSpacing.xl) {
                // Storage Icons
                IconSection(title: "Storage & Objects") {
                    IconRow(name: "Bucket", icon: DSIcons.bucket, color: DSColors.iconBucket)
                    IconRow(name: "Folder", icon: DSIcons.folder, color: DSColors.iconFolder)
                    IconRow(name: "File", icon: DSIcons.file, color: DSColors.iconFile)
                }

                Divider().styled()

                // Action Icons
                IconSection(title: "Actions") {
                    IconRow(name: "Upload", icon: DSIcons.upload, color: DSColors.transferUpload)
                    IconRow(name: "Download", icon: DSIcons.download, color: DSColors.transferDownload)
                    IconRow(name: "Delete", icon: DSIcons.delete, color: DSColors.error)
                    IconRow(name: "Refresh", icon: DSIcons.refresh, color: DSColors.iconActive)
                }

                Divider().styled()

                // Search & Filter
                IconSection(title: "Search & Filter") {
                    IconRow(name: "Search", icon: DSIcons.search, color: DSColors.iconDefault)
                    IconRow(name: "Filter", icon: DSIcons.filter, color: DSColors.iconDefault)
                    IconRow(name: "Sort", icon: DSIcons.sortAscending, color: DSColors.iconDefault)
                }

                Divider().styled()

                // Status Icons
                IconSection(title: "Status") {
                    IconRow(name: "Success", icon: DSIcons.success, color: DSColors.success)
                    IconRow(name: "Error", icon: DSIcons.error, color: DSColors.error)
                    IconRow(name: "Info", icon: DSIcons.info, color: DSColors.info)
                }

                Divider().styled()

                // Specialized Components
                IconSection(title: "Specialized Components") {
                    VStack(alignment: .leading, spacing: DSSpacing.sm) {
                        HStack(spacing: DSSpacing.lg) {
                            BucketIcon(size: .large)
                            Text("Bucket Icon")
                                .font(DSTypography.body)
                        }

                        HStack(spacing: DSSpacing.lg) {
                            FolderIcon(size: .large)
                            Text("Folder Icon")
                                .font(DSTypography.body)
                        }

                        HStack(spacing: DSSpacing.lg) {
                            FileIcon(fileType: .image, size: .large)
                            Text("Image File")
                                .font(DSTypography.body)
                        }

                        HStack(spacing: DSSpacing.lg) {
                            StatusIcon(status: .success, size: .large)
                            Text("Success Status")
                                .font(DSTypography.body)
                        }

                        HStack(spacing: DSSpacing.lg) {
                            TransferIcon(direction: .upload, size: .large)
                            Text("Upload Transfer")
                                .font(DSTypography.body)
                        }
                    }
                }
            }
            .padding(DSSpacing.xl)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(DSColors.windowBackground)
    }
}

struct IconSection<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: DSSpacing.md) {
            Text(title)
                .font(DSTypography.headline)
                .foregroundColor(DSColors.textPrimary)

            VStack(alignment: .leading, spacing: DSSpacing.sm) {
                content
            }
        }
    }
}

struct IconRow: View {
    let name: String
    let icon: String
    let color: Color

    var body: some View {
        HStack(spacing: DSSpacing.lg) {
            Image(systemName: icon)
                .font(.system(size: DSSpacing.Icon.large))
                .foregroundColor(color)
                .frame(width: 30)

            Text(name)
                .font(DSTypography.body)
                .foregroundColor(DSColors.textPrimary)

            Spacer()

            Text(icon)
                .font(DSTypography.caption)
                .foregroundColor(DSColors.textTertiary)
        }
        .padding(DSSpacing.sm)
        .background(DSColors.cardBackground)
        .cornerRadius(.small)
    }
}
#endif
