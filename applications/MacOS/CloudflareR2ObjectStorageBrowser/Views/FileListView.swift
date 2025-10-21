import SwiftUI

/// File and folder list with multi-column table view
/// Supports sorting, multi-select, context menu, and empty states
struct FileListView: View {
    @Binding var objects: [R2Object]
    @Binding var folders: [String]
    @Binding var selectedObjects: Set<String>
    @Binding var sortColumn: SortColumn
    @Binding var sortOrder: SortOrder
    @Binding var isLoading: Bool

    let bucketName: String?
    let serverPort: Int?
    let onFolderOpen: (String) -> Void
    let onObjectDownload: (R2Object) -> Void
    let onObjectDelete: ([R2Object]) -> Void
    let onFilePreview: (R2Object) -> Void
    let onSaveAs: (R2Object) -> Void

    var body: some View {
        VStack(spacing: 0) {
            if isLoading && objects.isEmpty && folders.isEmpty {
                // Loading state
                loadingView
            } else if objects.isEmpty && folders.isEmpty {
                // Empty state
                emptyStateView
            } else {
                // File list table
                fileTableView
            }
        }
        .background(Material.regular)
    }

    // MARK: - Loading View

    private var loadingView: some View {
        VStack(spacing: 16) {
            ProgressView()
                .controlSize(.large)
            Text("Loading objects...")
                .font(.headline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Empty State View

    private var emptyStateView: some View {
        VStack(spacing: 20) {
            Image(systemName: "tray")
                .font(.system(size: 64))
                .foregroundStyle(.tertiary)

            VStack(spacing: 8) {
                Text("No files yet")
                    .font(.title2)
                    .fontWeight(.semibold)
                    .foregroundStyle(.primary)

                Text("Drag files here to upload")
                    .font(.body)
                    .foregroundStyle(.secondary)
            }

            VStack(spacing: 12) {
                HStack(spacing: 8) {
                    Image(systemName: "arrow.up.doc")
                        .font(.system(size: 14, weight: .medium))
                    Text("Drop files to upload")
                }
                .font(.caption)
                .foregroundStyle(.secondary)

                HStack(spacing: 8) {
                    Image(systemName: "folder.badge.plus")
                        .font(.system(size: 14, weight: .medium))
                    Text("Folders are created automatically")
                }
                .font(.caption)
                .foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(40)
    }

    // MARK: - File Table View

    private var fileTableView: some View {
        Table(of: R2Object.self, selection: $selectedObjects) {
            // Icon column (non-sortable)
            TableColumn("") { item in
                if item.isFolder {
                    Image(systemName: "folder.fill")
                        .foregroundStyle(.blue)
                        .font(.system(size: 16))
                        .frame(width: 20)
                } else {
                    fileIcon(for: item.key)
                        .font(.system(size: 16))
                        .frame(width: 20)
                }
            }
            .width(40)

            // Name column
            TableColumn("Name") { item in
                HStack(spacing: 6) {
                    Text(item.name)
                        .font(.system(.body, design: .monospaced))
                        .lineLimit(1)

                    // Show cached indicator for files
                    if !item.isFolder && CacheManager.shared.isCached(key: item.key) {
                        Image(systemName: "arrow.down.circle.fill")
                            .font(.system(size: 12))
                            .foregroundStyle(.green)
                            .help("Cached locally")
                    }
                }
            }
            .width(min: 200, ideal: 350, max: .infinity)

            // Size column (sortable)
            TableColumn("Size") { item in
                if item.isFolder {
                    Text("—")
                        .foregroundStyle(.secondary)
                } else {
                    Text(formatBytes(item.size))
                        .font(.system(.body, design: .default))
                }
            }
            .width(100)

            // Last Modified column
            TableColumn("Modified") { item in
                if let formatted = item.relativeLastModified {
                    Text(formatted)
                        .font(.system(.body, design: .default))
                } else {
                    Text("—")
                        .foregroundStyle(.secondary)
                }
            }
            .width(150)

            // Type column
            TableColumn("Type") { (item: R2Object) in
                Text(item.fileType.rawValue)
                    .font(.system(.body, design: .default))
                    .foregroundStyle(.secondary)
            }
            .width(120)

        } rows: {
            // Folders first
            ForEach(folders, id: \.self) { folder in
                TableRow(
                    R2Object(
                        key: folder,
                        size: 0,
                        lastModified: "",
                        etag: nil,
                        storageClass: nil
                    )
                )
                .itemProvider {
                    NSItemProvider()
                }
            }

            // Then objects
            ForEach(objects, id: \.key) { object in
                TableRow(object)
                    .itemProvider {
                        NSItemProvider()
                    }
            }
        }
        .contextMenu(forSelectionType: String.self) { selectedKeys in
            // Context menu for selected items
            if selectedKeys.count == 1, let key = selectedKeys.first {
                if let object = allItems.first(where: { $0.key == key }) {
                    if object.isFolder {
                        folderContextMenu(folder: object.key)
                    } else {
                        objectContextMenu(object: object)
                    }
                }
            } else if selectedKeys.count > 1 {
                multiSelectContextMenu()
            }
        } primaryAction: { selectedKeys in
            // Handle double-click
            if let key = selectedKeys.first, let item = allItems.first(where: { $0.key == key }) {
                if item.isFolder {
                    onFolderOpen(item.key)
                } else {
                    // Open file preview for non-folder items
                    onFilePreview(item)
                }
            }
        }
    }

    // Combined items for easier lookup
    private var allItems: [R2Object] {
        let folderObjects = folders.map { folder in
            // Folders don't have a real lastModified date in R2
            // Use empty string to indicate no modification date
            R2Object(key: folder, size: 0, lastModified: "", etag: nil, storageClass: nil)
        }
        return folderObjects + objects
    }

    // MARK: - Context Menus

    @ViewBuilder
    private func folderContextMenu(folder: String) -> some View {
        Button("Open") {
            onFolderOpen(folder)
        }
        .accessibilityLabel("Open folder \(folder)")
        Divider()
        Button("Delete Folder and Contents", role: .destructive) {
            let folderObject = R2Object(
                key: folder,
                size: 0,
                lastModified: "",
                etag: nil,
                storageClass: nil
            )
            onObjectDelete([folderObject])
        }
        .accessibilityLabel("Delete folder \(folder) and all its contents")
        .accessibilityHint("This action cannot be undone")
    }

    @ViewBuilder
    private func objectContextMenu(object: R2Object) -> some View {
        Button("Quick Look") {
            onFilePreview(object)
        }
        Button("Download") {
            onObjectDownload(object)
        }

        // Show "Save As..." if file is cached
        if CacheManager.shared.isCached(key: object.key) {
            Button("Save As...") {
                onSaveAs(object)
            }
        }

        Button("Open in Browser") {
            // TODO: Generate presigned URL and open
        }
        Divider()
        Button("Copy Path") {
            NSPasteboard.general.clearContents()
            NSPasteboard.general.setString(object.key, forType: .string)
        }
        Button("Copy URL") {
            copyPresignedUrl(for: object)
        }
        Divider()
        Button("Get Info") {
            // TODO: Show object info panel
        }
        Divider()
        Button("Delete", role: .destructive) {
            onObjectDelete([object])
        }
        .accessibilityLabel("Delete \(object.name)")
        .accessibilityHint("This action cannot be undone")
    }

    @ViewBuilder
    private func multiSelectContextMenu() -> some View {
        Button("Download Selected") {
            // TODO: Download multiple objects
        }
        Divider()
        Button("Delete Selected (\(selectedObjects.count) items)", role: .destructive) {
            let itemsToDelete = allItems.filter { selectedObjects.contains($0.key) }
            onObjectDelete(itemsToDelete)
        }
        .accessibilityLabel("Delete \(selectedObjects.count) selected items")
        .accessibilityHint("This action cannot be undone")
    }

    // MARK: - Helper Functions

    private func fileIcon(for key: String) -> Image {
        let ext = (key as NSString).pathExtension.lowercased()

        switch ext {
        // Images
        case "jpg", "jpeg", "png", "gif", "webp", "heic", "svg":
            return Image(systemName: "photo")
        // Videos
        case "mp4", "mov", "avi", "mkv", "webm":
            return Image(systemName: "video")
        // Documents
        case "pdf":
            return Image(systemName: "doc.richtext")
        case "doc", "docx":
            return Image(systemName: "doc.text")
        case "txt", "md", "markdown":
            return Image(systemName: "doc.plaintext")
        // Archives
        case "zip", "tar", "gz", "rar", "7z":
            return Image(systemName: "doc.zipper")
        // Code
        case "js", "ts", "jsx", "tsx":
            return Image(systemName: "curlybraces")
        case "py":
            return Image(systemName: "chevron.left.forwardslash.chevron.right")
        case "swift":
            return Image(systemName: "swift")
        case "json", "xml", "yaml", "yml":
            return Image(systemName: "doc.text.below.ecg")
        // Audio
        case "mp3", "wav", "aac", "flac":
            return Image(systemName: "waveform")
        // Default
        default:
            return Image(systemName: "doc")
        }
    }

    private func formatBytes(_ bytes: Int64) -> String {
        let formatter = ByteCountFormatter()
        formatter.countStyle = .file
        formatter.allowedUnits = [.useKB, .useMB, .useGB]
        return formatter.string(fromByteCount: bytes)
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: date, relativeTo: Date())
    }

    private func copyPresignedUrl(for object: R2Object) {
        guard let bucket = bucketName, let port = serverPort else {
            showAlert(title: "Error", message: "Server or bucket information not available")
            return
        }

        Task {
            do {
                let apiClient = APIClient(serverPort: port)
                let url = try await apiClient.getPresignedUrl(
                    bucket: bucket,
                    key: object.key,
                    expiresIn: 3600 // 1 hour
                )

                await MainActor.run {
                    NSPasteboard.general.clearContents()
                    NSPasteboard.general.setString(url, forType: .string)

                    // Show success notification
                    showAlert(title: "URL Copied", message: "Presigned URL has been copied to clipboard (valid for 1 hour)")
                }
            } catch {
                await MainActor.run {
                    showAlert(title: "Copy URL Failed", message: "Failed to generate presigned URL: \(error.localizedDescription)")
                }
            }
        }
    }

    private func showAlert(title: String, message: String) {
        let alert = NSAlert()
        alert.messageText = title
        alert.informativeText = message
        alert.alertStyle = .informational
        alert.addButton(withTitle: "OK")
        alert.runModal()
    }
}

// MARK: - Previews

#Preview("Empty State") {
    FileListView(
        objects: .constant([]),
        folders: .constant([]),
        selectedObjects: .constant([]),
        sortColumn: .constant(.name),
        sortOrder: .constant(.ascending),
        isLoading: .constant(false),
        bucketName: "test-bucket",
        serverPort: 3000,
        onFolderOpen: { _ in },
        onObjectDownload: { _ in },
        onObjectDelete: { _ in },
        onFilePreview: { _ in },
        onSaveAs: { _ in }
    )
    .frame(height: 400)
}

#Preview("Loading") {
    FileListView(
        objects: .constant([]),
        folders: .constant([]),
        selectedObjects: .constant([]),
        sortColumn: .constant(.name),
        sortOrder: .constant(.ascending),
        isLoading: .constant(true),
        bucketName: "test-bucket",
        serverPort: 3000,
        onFolderOpen: { _ in },
        onObjectDownload: { _ in },
        onObjectDelete: { _ in },
        onFilePreview: { _ in },
        onSaveAs: { _ in }
    )
    .frame(height: 400)
}

#Preview("With Content") {
    FileListView(
        objects: .constant([
            R2Object(key: "document.pdf", size: 1_024_000, lastModified: ISO8601DateFormatter().string(from: Date().addingTimeInterval(-3600)), etag: "abc123", storageClass: "STANDARD"),
            R2Object(key: "image.png", size: 512_000, lastModified: ISO8601DateFormatter().string(from: Date().addingTimeInterval(-7200)), etag: "def456", storageClass: "STANDARD"),
            R2Object(key: "video.mp4", size: 52_428_800, lastModified: ISO8601DateFormatter().string(from: Date().addingTimeInterval(-86400)), etag: "ghi789", storageClass: "STANDARD")
        ]),
        folders: .constant(["Projects/", "Archive/"]),
        selectedObjects: .constant([]),
        sortColumn: .constant(.name),
        sortOrder: .constant(.ascending),
        isLoading: .constant(false),
        bucketName: "test-bucket",
        serverPort: 3000,
        onFolderOpen: { _ in },
        onObjectDownload: { _ in },
        onObjectDelete: { _ in },
        onFilePreview: { _ in },
        onSaveAs: { _ in }
    )
    .frame(height: 400)
}
