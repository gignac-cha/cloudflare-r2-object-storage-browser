import SwiftUI

/// Debug panel with API Response and Server Logs tabs
/// Collapsible bottom panel (Cmd+Shift+D to toggle)
struct DebugPanelView: View {
    @Binding var isVisible: Bool
    @Binding var selectedTab: DebugTab
    @Binding var apiResponses: [APIDebugResponse]
    @Binding var serverLogs: [String]

    var body: some View {
        VStack(spacing: 0) {
            // Header with tabs and controls
            HStack(spacing: 0) {
                // Tab buttons
                HStack(spacing: 0) {
                    TabButton(
                        title: "API Response",
                        icon: "network",
                        isSelected: selectedTab == .apiResponse,
                        count: apiResponses.count,
                        action: { selectedTab = .apiResponse }
                    )

                    TabButton(
                        title: "Server Logs",
                        icon: "doc.text",
                        isSelected: selectedTab == .serverLogs,
                        count: serverLogs.count,
                        action: { selectedTab = .serverLogs }
                    )
                }

                Spacer()

                // Control buttons
                HStack(spacing: 8) {
                    if selectedTab == .apiResponse {
                        Button(action: copyAPIResponse) {
                            Image(systemName: "doc.on.doc")
                                .font(.system(size: 12, weight: .medium))
                        }
                        .buttonStyle(.borderless)
                        .help("Copy to clipboard")

                        Button(action: clearAPIResponses) {
                            Image(systemName: "trash")
                                .font(.system(size: 12, weight: .medium))
                        }
                        .buttonStyle(.borderless)
                        .help("Clear history")
                    } else {
                        Button(action: exportLogs) {
                            Image(systemName: "square.and.arrow.up")
                                .font(.system(size: 12, weight: .medium))
                        }
                        .buttonStyle(.borderless)
                        .help("Export logs")

                        Button(action: clearLogs) {
                            Image(systemName: "trash")
                                .font(.system(size: 12, weight: .medium))
                        }
                        .buttonStyle(.borderless)
                        .help("Clear logs")
                    }

                    Divider()
                        .frame(height: 16)

                    Button(action: { isVisible = false }) {
                        Image(systemName: "xmark")
                            .font(.system(size: 12, weight: .semibold))
                    }
                    .buttonStyle(.borderless)
                    .help("Hide debug panel (Cmd+Shift+D)")
                }
                .padding(.trailing, 12)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(Material.thin)

            Divider()

            // Content area
            if selectedTab == .apiResponse {
                APIResponseView(responses: apiResponses)
            } else {
                ServerLogsView(logs: serverLogs)
            }
        }
        .frame(minHeight: 200, idealHeight: 250, maxHeight: 400)
    }

    // MARK: - Actions

    private func copyAPIResponse() {
        guard let latest = apiResponses.last else { return }
        let text = """
        \(latest.method) \(latest.endpoint)
        Timestamp: \(latest.timestamp)

        \(latest.response)
        """
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(text, forType: .string)
    }

    private func clearAPIResponses() {
        apiResponses.removeAll()
    }

    private func exportLogs() {
        let panel = NSSavePanel()
        panel.nameFieldStringValue = "server-logs-\(Date().timeIntervalSince1970).txt"
        panel.allowedContentTypes = [.plainText]
        panel.canCreateDirectories = true

        panel.begin { response in
            guard response == .OK, let url = panel.url else { return }
            let content = serverLogs.joined(separator: "\n")
            try? content.write(to: url, atomically: true, encoding: .utf8)
        }
    }

    private func clearLogs() {
        serverLogs.removeAll()
    }
}

// MARK: - Tab Button

struct TabButton: View {
    let title: String
    let icon: String
    let isSelected: Bool
    let count: Int
    let action: () -> Void

    @State private var isHovered = false

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 12, weight: .medium))

                Text(title)
                    .font(.system(.caption, design: .default, weight: .medium))

                if count > 0 {
                    Text("\(count)")
                        .font(.system(.caption2, design: .rounded, weight: .semibold))
                        .foregroundStyle(isSelected ? .white : .secondary)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(
                            Capsule()
                                .fill(isSelected ? Color.white.opacity(0.3) : Color.secondary.opacity(0.2))
                        )
                }
            }
            .foregroundStyle(isSelected ? .white : .primary)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(
                RoundedRectangle(cornerRadius: 6, style: .continuous)
                    .fill(isSelected ? Color.accentColor : (isHovered ? Color.primary.opacity(0.05) : Color.clear))
            )
        }
        .buttonStyle(.plain)
        .onHover { hovering in
            isHovered = hovering
        }
        .animation(.easeInOut(duration: 0.15), value: isSelected)
        .animation(.easeInOut(duration: 0.15), value: isHovered)
    }
}

// MARK: - API Response View

struct APIResponseView: View {
    let responses: [APIDebugResponse]

    var body: some View {
        if responses.isEmpty {
            VStack(spacing: 12) {
                Image(systemName: "network.slash")
                    .font(.system(size: 32))
                    .foregroundStyle(.tertiary)
                Text("No API responses yet")
                    .font(.body)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else {
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 12) {
                        ForEach(responses) { response in
                            VStack(alignment: .leading, spacing: 6) {
                                // Request header
                                HStack {
                                    methodBadge(response.method)

                                    Text(response.endpoint)
                                        .font(.system(.caption, design: .monospaced))
                                        .foregroundStyle(.primary)

                                    Spacer()

                                    Text(formatTimestamp(response.timestamp))
                                        .font(.caption2)
                                        .foregroundStyle(.secondary)
                                }

                                // Response body
                                Text(response.response)
                                    .font(.system(.caption, design: .monospaced))
                                    .foregroundStyle(.secondary)
                                    .textSelection(.enabled)
                                    .padding(8)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .background(
                                        RoundedRectangle(cornerRadius: 4, style: .continuous)
                                            .fill(Color.primary.opacity(0.03))
                                    )
                            }
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .id(response.id)
                        }
                    }
                    .padding(.vertical, 8)
                }
                .onChange(of: responses.count) { _ in
                    if let last = responses.last {
                        withAnimation {
                            proxy.scrollTo(last.id, anchor: .bottom)
                        }
                    }
                }
            }
        }
    }

    private func methodBadge(_ method: String) -> some View {
        let color: Color = {
            switch method {
            case "GET": return .green
            case "POST": return .blue
            case "PUT": return .orange
            case "DELETE": return .red
            default: return .gray
            }
        }()

        return Text(method)
            .font(.system(.caption2, design: .monospaced, weight: .bold))
            .foregroundStyle(.white)
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .background(
                RoundedRectangle(cornerRadius: 3, style: .continuous)
                    .fill(color)
            )
    }

    private func formatTimestamp(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm:ss"
        return formatter.string(from: date)
    }
}

// MARK: - Server Logs View

struct ServerLogsView: View {
    let logs: [String]
    @State private var autoScroll = true
    @State private var searchText = ""

    var filteredLogs: [String] {
        if searchText.isEmpty {
            return logs
        }
        return logs.filter { $0.localizedCaseInsensitiveContains(searchText) }
    }

    var body: some View {
        VStack(spacing: 0) {
            // Search bar
            HStack {
                Image(systemName: "magnifyingglass")
                    .font(.system(size: 12))
                    .foregroundStyle(.secondary)

                TextField("Search logs...", text: $searchText)
                    .textFieldStyle(.plain)
                    .font(.system(.caption, design: .default))

                if !searchText.isEmpty {
                    Button(action: { searchText = "" }) {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 12))
                            .foregroundStyle(.secondary)
                    }
                    .buttonStyle(.plain)
                }

                Toggle(isOn: $autoScroll) {
                    Text("Auto-scroll")
                        .font(.caption)
                }
                .toggleStyle(.switch)
                .controlSize(.mini)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(Material.thin)

            Divider()

            // Logs list
            if filteredLogs.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: searchText.isEmpty ? "doc.text" : "magnifyingglass")
                        .font(.system(size: 32))
                        .foregroundStyle(.tertiary)
                    Text(searchText.isEmpty ? "No logs yet" : "No matching logs")
                        .font(.body)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(alignment: .leading, spacing: 0) {
                            ForEach(Array(filteredLogs.enumerated()), id: \.offset) { index, log in
                                HStack(alignment: .top, spacing: 8) {
                                    Text("\(index + 1)")
                                        .font(.system(.caption2, design: .monospaced))
                                        .foregroundStyle(.tertiary)
                                        .frame(width: 40, alignment: .trailing)
                                        .padding(.top, 1)

                                    Text(log)
                                        .font(.system(.caption, design: .monospaced))
                                        .foregroundStyle(.primary)
                                        .textSelection(.enabled)
                                        .frame(maxWidth: .infinity, alignment: .leading)
                                }
                                .padding(.horizontal, 12)
                                .padding(.vertical, 2)
                                .background(index % 2 == 0 ? Color.clear : Color.primary.opacity(0.02))
                                .id(index)
                            }
                        }
                    }
                    .onChange(of: logs.count) { _ in
                        if autoScroll && !logs.isEmpty {
                            withAnimation {
                                proxy.scrollTo(logs.count - 1, anchor: .bottom)
                            }
                        }
                    }
                }
            }
        }
    }
}

// MARK: - Supporting Types

enum DebugTab {
    case apiResponse
    case serverLogs
}

struct APIDebugResponse: Identifiable {
    let id = UUID()
    let method: String
    let endpoint: String
    let response: String
    let timestamp: Date
}

// MARK: - Previews

#Preview("API Response Tab") {
    DebugPanelView(
        isVisible: .constant(true),
        selectedTab: .constant(.apiResponse),
        apiResponses: .constant([
            APIDebugResponse(method: "GET", endpoint: "/buckets", response: """
                {
                  "status": "success",
                  "buckets": [
                    { "name": "my-bucket", "creationDate": "2024-01-15T10:30:00Z" }
                  ],
                  "count": 1
                }
                """, timestamp: Date().addingTimeInterval(-120)),
            APIDebugResponse(method: "GET", endpoint: "/buckets/my-bucket/objects", response: """
                {
                  "status": "success",
                  "objects": [],
                  "count": 0
                }
                """, timestamp: Date())
        ]),
        serverLogs: .constant([])
    )
    .frame(height: 250)
}

#Preview("Server Logs Tab") {
    DebugPanelView(
        isVisible: .constant(true),
        selectedTab: .constant(.serverLogs),
        apiResponses: .constant([]),
        serverLogs: .constant([
            "[14:23:45] Server started on port 3000",
            "[14:23:46] Connected to R2",
            "[14:24:12] GET /buckets - 200 OK (142ms)",
            "[14:24:15] GET /buckets/my-bucket/objects - 200 OK (89ms)",
            "[14:24:20] POST /buckets/my-bucket/objects/test.txt - 201 Created (234ms)"
        ])
    )
    .frame(height: 250)
}

#Preview("Empty State") {
    DebugPanelView(
        isVisible: .constant(true),
        selectedTab: .constant(.apiResponse),
        apiResponses: .constant([]),
        serverLogs: .constant([])
    )
    .frame(height: 250)
}
