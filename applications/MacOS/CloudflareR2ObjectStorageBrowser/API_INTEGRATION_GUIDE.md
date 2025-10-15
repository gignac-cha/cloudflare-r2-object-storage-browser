# macOS R2 Browser - API Integration Quick Reference

Step-by-step guide for integrating the UI views with the backend API.

---

## Quick Navigation
1. [Object Listing](#1-object-listing-api-integration)
2. [Upload](#2-upload-functionality)
3. [Download](#3-download-functionality)
4. [Delete](#4-delete-functionality)
5. [Keyboard Shortcuts](#5-keyboard-shortcuts)
6. [Drag & Drop](#6-drag--drop-upload)
7. [Error Handling](#7-error-handling-best-practices)

---

## 1. Object Listing API Integration

**Location**: `ContentView.swift`, line 243 (`loadObjects()` function)

**Replace simulated code with**:
```swift
private func loadObjects() {
    guard let bucket = selectedBucket else { return }
    guard let port = serverManager.serverPort else { return }

    isLoadingObjects = true

    // Build URL with prefix for folder navigation
    var urlComponents = URLComponents(string: "http://127.0.0.1:\(port)/buckets/\(bucket.name)/objects")!
    urlComponents.queryItems = [
        URLQueryItem(name: "prefix", value: currentPath),
        URLQueryItem(name: "delimiter", value: "/")
    ]

    guard let url = urlComponents.url else {
        isLoadingObjects = false
        return
    }

    let task = URLSession.shared.dataTask(with: url) { data, response, error in
        DispatchQueue.main.async {
            isLoadingObjects = false

            if let error = error {
                print("Error loading objects: \(error.localizedDescription)")
                return
            }

            guard let data = data else { return }

            // Log to debug panel
            if let jsonString = String(data: data, encoding: .utf8) {
                apiResponses.append(APIDebugResponse(
                    method: "GET",
                    endpoint: "/buckets/\(bucket.name)/objects",
                    response: jsonString,
                    timestamp: Date()
                ))
            }

            do {
                let decoder = JSONDecoder()
                decoder.dateDecodingStrategy = .iso8601
                let result = try decoder.decode(ObjectsResponse.self, from: data)

                // Convert API response to S3Object models
                objects = result.objects.map { obj in
                    S3Object(
                        key: obj.key,
                        size: obj.size,
                        lastModified: obj.lastModified,
                        etag: obj.etag,
                        isFolder: false
                    )
                }

                // Extract folder names from commonPrefixes
                folders = result.commonPrefixes.map { $0.prefix }

            } catch {
                print("Decode error: \(error.localizedDescription)")
            }
        }
    }

    task.resume()
}
```

**Add Response Model** (at top of ContentView.swift):
```swift
struct ObjectsResponse: Codable {
    let status: String
    let objects: [ObjectItem]
    let commonPrefixes: [CommonPrefix]
    let count: Int
}

struct ObjectItem: Codable {
    let key: String
    let size: Int64
    let lastModified: Date
    let etag: String
}

struct CommonPrefix: Codable {
    let prefix: String
}
```

---

## 2. Upload Functionality

**Location**: `ContentView.swift`, line 329 (`upload()` function)

**Replace with**:
```swift
private func upload() {
    guard let bucket = selectedBucket else { return }

    let panel = NSOpenPanel()
    panel.canChooseFiles = true
    panel.canChooseDirectories = false
    panel.allowsMultipleSelection = true
    panel.message = "Select files to upload to \(bucket.name)"

    panel.begin { response in
        guard response == .OK else { return }

        for fileURL in panel.urls {
            uploadFile(fileURL, toBucket: bucket.name)
        }
    }
}

private func uploadFile(_ fileURL: URL, toBucket bucket: String) {
    guard let port = serverManager.serverPort else { return }

    // Calculate object key (with current folder path)
    let fileName = fileURL.lastPathComponent
    let objectKey = currentPath + fileName

    let uploadURL = URL(string: "http://127.0.0.1:\(port)/buckets/\(bucket)/objects/\(objectKey)")!

    var request = URLRequest(url: uploadURL)
    request.httpMethod = "PUT"

    // Read file data
    guard let fileData = try? Data(contentsOf: fileURL) else {
        print("Failed to read file: \(fileURL)")
        return
    }

    // Detect content type
    let contentType = fileURL.mimeType() ?? "application/octet-stream"
    request.setValue(contentType, forHTTPHeaderField: "Content-Type")
    request.setValue("\(fileData.count)", forHTTPHeaderField: "Content-Length")

    let task = URLSession.shared.uploadTask(with: request, from: fileData) { data, response, error in
        DispatchQueue.main.async {
            if let error = error {
                print("Upload failed: \(error.localizedDescription)")
                return
            }

            // Log response
            if let data = data, let jsonString = String(data: data, encoding: .utf8) {
                apiResponses.append(APIDebugResponse(
                    method: "PUT",
                    endpoint: "/buckets/\(bucket)/objects/\(objectKey)",
                    response: jsonString,
                    timestamp: Date()
                ))
            }

            // Refresh object list
            loadObjects()
        }
    }

    task.resume()
}
```

**Add MIME Type Extension** (at end of ContentView.swift):
```swift
extension URL {
    func mimeType() -> String? {
        let pathExtension = self.pathExtension.lowercased()

        switch pathExtension {
        case "jpg", "jpeg": return "image/jpeg"
        case "png": return "image/png"
        case "gif": return "image/gif"
        case "pdf": return "application/pdf"
        case "json": return "application/json"
        case "txt": return "text/plain"
        case "html": return "text/html"
        case "mp4": return "video/mp4"
        case "mp3": return "audio/mpeg"
        case "zip": return "application/zip"
        default: return "application/octet-stream"
        }
    }
}
```

---

## 3. Download Functionality

**Location**: `ContentView.swift`, line 334 (`download()` function)

**Replace with**:
```swift
private func download() {
    guard !selectedObjects.isEmpty else { return }
    guard let bucket = selectedBucket else { return }

    for objectKey in selectedObjects {
        if let object = objects.first(where: { $0.key == objectKey }) {
            downloadObject(object)
        }
    }
}

private func downloadObject(_ object: S3Object) {
    guard let bucket = selectedBucket else { return }
    guard let port = serverManager.serverPort else { return }

    // Show save panel
    let panel = NSSavePanel()
    panel.nameFieldStringValue = (object.key as NSString).lastPathComponent
    panel.canCreateDirectories = true
    panel.message = "Save \(object.key)"

    panel.begin { response in
        guard response == .OK, let saveURL = panel.url else { return }

        // Download URL
        let downloadURL = URL(string: "http://127.0.0.1:\(port)/buckets/\(bucket.name)/objects/\(object.key)")!

        let task = URLSession.shared.downloadTask(with: downloadURL) { tempURL, response, error in
            DispatchQueue.main.async {
                if let error = error {
                    print("Download failed: \(error.localizedDescription)")
                    return
                }

                guard let tempURL = tempURL else { return }

                // Move temp file to save location
                do {
                    try FileManager.default.moveItem(at: tempURL, to: saveURL)
                    print("Downloaded to: \(saveURL)")

                    // Show in Finder
                    NSWorkspace.shared.selectFile(saveURL.path, inFileViewerRootedAtPath: "")

                } catch {
                    print("Failed to save file: \(error.localizedDescription)")
                }
            }
        }

        task.resume()
    }
}
```

---

## 4. Delete Functionality

**Location**: `ContentView.swift`, line 339 (`delete()` function)

**Replace with**:
```swift
private func delete() {
    guard !selectedObjects.isEmpty else { return }
    guard let bucket = selectedBucket else { return }

    // Show confirmation dialog
    let alert = NSAlert()
    alert.messageText = "Delete \(selectedObjects.count) item(s)?"
    alert.informativeText = "This action cannot be undone."
    alert.alertStyle = .warning
    alert.addButton(withTitle: "Delete")
    alert.addButton(withTitle: "Cancel")

    let response = alert.runModal()
    guard response == .alertFirstButtonReturn else { return }

    // Delete each selected object
    for objectKey in selectedObjects {
        if let object = objects.first(where: { $0.key == objectKey }) {
            deleteObject(object)
        }
    }
}

private func deleteObject(_ object: S3Object) {
    guard let bucket = selectedBucket else { return }
    guard let port = serverManager.serverPort else { return }

    let deleteURL = URL(string: "http://127.0.0.1:\(port)/buckets/\(bucket.name)/objects/\(object.key)")!

    var request = URLRequest(url: deleteURL)
    request.httpMethod = "DELETE"

    let task = URLSession.shared.dataTask(with: request) { data, response, error in
        DispatchQueue.main.async {
            if let error = error {
                print("Delete failed: \(error.localizedDescription)")
                return
            }

            // Log response
            if let data = data, let jsonString = String(data: data, encoding: .utf8) {
                apiResponses.append(APIDebugResponse(
                    method: "DELETE",
                    endpoint: "/buckets/\(bucket.name)/objects/\(object.key)",
                    response: jsonString,
                    timestamp: Date()
                ))
            }

            // Remove from selection
            selectedObjects.remove(object.key)

            // Refresh object list
            loadObjects()
        }
    }

    task.resume()
}
```

---

## 5. Keyboard Shortcuts

**Location**: Create new file `Extensions/Notifications.swift`:
```swift
import Foundation

extension Notification.Name {
    static let uploadFiles = Notification.Name("uploadFiles")
    static let downloadFiles = Notification.Name("downloadFiles")
    static let deleteFiles = Notification.Name("deleteFiles")
    static let navigateBack = Notification.Name("navigateBack")
    static let navigateForward = Notification.Name("navigateForward")
    static let navigateUp = Notification.Name("navigateUp")
    static let refresh = Notification.Name("refresh")
    static let toggleDebugPanel = Notification.Name("toggleDebugPanel")
    static let uploadFileURL = Notification.Name("uploadFileURL")
}
```

**Add to `CloudflareR2ObjectStorageBrowserApp.swift` `.commands` block**:
```swift
.commands {
    // Existing quit command...

    // File operations
    CommandGroup(after: .newItem) {
        Button("Upload Files...") {
            NotificationCenter.default.post(name: .uploadFiles, object: nil)
        }
        .keyboardShortcut("u", modifiers: [.command])

        Button("Download Selected") {
            NotificationCenter.default.post(name: .downloadFiles, object: nil)
        }
        .keyboardShortcut("d", modifiers: [.command])

        Divider()

        Button("Delete Selected") {
            NotificationCenter.default.post(name: .deleteFiles, object: nil)
        }
        .keyboardShortcut(.delete, modifiers: [.command])
    }

    // Navigation
    CommandGroup(after: .sidebar) {
        Button("Back") {
            NotificationCenter.default.post(name: .navigateBack, object: nil)
        }
        .keyboardShortcut("[", modifiers: [.command])

        Button("Forward") {
            NotificationCenter.default.post(name: .navigateForward, object: nil)
        }
        .keyboardShortcut("]", modifiers: [.command])

        Button("Up") {
            NotificationCenter.default.post(name: .navigateUp, object: nil)
        }
        .keyboardShortcut(.upArrow, modifiers: [.command])

        Divider()

        Button("Refresh") {
            NotificationCenter.default.post(name: .refresh, object: nil)
        }
        .keyboardShortcut("r", modifiers: [.command])
    }

    // Debug
    CommandMenu("Debug") {
        Button("Toggle Debug Panel") {
            NotificationCenter.default.post(name: .toggleDebugPanel, object: nil)
        }
        .keyboardShortcut("d", modifiers: [.command, .shift])
    }
}
```

**Add Observers in ContentView `.onAppear`**:
```swift
.onAppear {
    // Existing code...
    serverLogs = serverManager.logs

    // Keyboard shortcut observers
    NotificationCenter.default.addObserver(
        forName: .uploadFiles, object: nil, queue: .main
    ) { _ in upload() }

    NotificationCenter.default.addObserver(
        forName: .downloadFiles, object: nil, queue: .main
    ) { _ in download() }

    NotificationCenter.default.addObserver(
        forName: .deleteFiles, object: nil, queue: .main
    ) { _ in delete() }

    NotificationCenter.default.addObserver(
        forName: .navigateBack, object: nil, queue: .main
    ) { _ in goBack() }

    NotificationCenter.default.addObserver(
        forName: .navigateForward, object: nil, queue: .main
    ) { _ in goForward() }

    NotificationCenter.default.addObserver(
        forName: .navigateUp, object: nil, queue: .main
    ) { _ in goUp() }

    NotificationCenter.default.addObserver(
        forName: .refresh, object: nil, queue: .main
    ) { _ in refreshObjects() }

    NotificationCenter.default.addObserver(
        forName: .toggleDebugPanel, object: nil, queue: .main
    ) { _ in toggleDebugPanel() }

    NotificationCenter.default.addObserver(
        forName: .uploadFileURL, object: nil, queue: .main
    ) { notification in
        if let url = notification.userInfo?["url"] as? URL,
           let bucket = selectedBucket {
            uploadFile(url, toBucket: bucket.name)
        }
    }
}
```

---

## 6. Drag & Drop Upload

**Location**: Add to `FileListView.swift` after `.contextMenu`

**Add modifier to `fileTableView`**:
```swift
.onDrop(of: [.fileURL], isTargeted: nil) { providers in
    handleDrop(providers: providers)
    return true
}
```

**Add helper method in FileListView**:
```swift
private func handleDrop(providers: [NSItemProvider]) {
    for provider in providers {
        provider.loadItem(forTypeIdentifier: "public.file-url", options: nil) { item, error in
            guard let data = item as? Data,
                  let url = URL(dataRepresentation: data, relativeTo: nil) else {
                return
            }

            DispatchQueue.main.async {
                // Notify ContentView to upload this file
                NotificationCenter.default.post(
                    name: .uploadFileURL,
                    object: nil,
                    userInfo: ["url": url]
                )
            }
        }
    }
}
```

---

## 7. Error Handling Best Practices

**Add Error Alert Helper** (in ContentView.swift):
```swift
private func showError(_ title: String, message: String) {
    let alert = NSAlert()
    alert.messageText = title
    alert.informativeText = message
    alert.alertStyle = .critical
    alert.addButton(withTitle: "OK")
    alert.runModal()
}
```

**Use in API Calls**:
```swift
if let error = error {
    showError("Network Error", message: error.localizedDescription)
    return
}

guard let data = data else {
    showError("No Data", message: "The server returned no data.")
    return
}
```

---

## Testing Checklist

After integration, test these scenarios:

### Bucket Operations
- [ ] Load buckets on app launch
- [ ] Select bucket shows empty state
- [ ] Refresh buckets updates list
- [ ] Error state shows when server is down

### Object Operations
- [ ] Navigate into folders
- [ ] Breadcrumb navigation works
- [ ] Back/Forward buttons work
- [ ] Upload files via button
- [ ] Upload files via drag & drop
- [ ] Download single file
- [ ] Download multiple files
- [ ] Delete with confirmation
- [ ] Context menu actions work

### Keyboard Shortcuts
- [ ] Cmd+U: Upload
- [ ] Cmd+D: Download
- [ ] Cmd+Delete: Delete
- [ ] Cmd+[: Back
- [ ] Cmd+]: Forward
- [ ] Cmd+↑: Up
- [ ] Cmd+R: Refresh
- [ ] Cmd+Shift+D: Toggle debug panel

### Debug Panel
- [ ] Toggle visibility
- [ ] API responses logged
- [ ] Server logs streamed
- [ ] Search in logs works
- [ ] Export logs works
- [ ] Auto-scroll works

---

## Common Issues & Fixes

**Issue**: Table selection doesn't work
- **Fix**: Ensure `S3Object` conforms to `Identifiable` and `Hashable`

**Issue**: Debug panel doesn't show
- **Fix**: Check `isDebugPanelVisible` state and animation timing

**Issue**: Breadcrumb doesn't update
- **Fix**: Verify `currentPath` is properly set when navigating

**Issue**: Context menu doesn't appear
- **Fix**: Ensure `.contextMenu(forSelectionType:)` is used, not `.contextMenu { }`

**Issue**: Hover effects don't work
- **Fix**: Check `.onHover` modifier is present and state is animated

---

**Document Version**: 1.0
**Last Updated**: 2025-10-14
