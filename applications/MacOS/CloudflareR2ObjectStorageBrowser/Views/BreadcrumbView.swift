import SwiftUI

/// Breadcrumb navigation showing current folder path with clickable segments
/// Follows macOS Finder-style path navigation
struct BreadcrumbView: View {
    let bucketName: String?
    let currentPath: String
    let onNavigate: (String) -> Void

    private var pathComponents: [(name: String, path: String)] {
        guard let bucket = bucketName else { return [] }

        var components: [(String, String)] = [(bucket, "")]

        if !currentPath.isEmpty {
            let parts = currentPath.split(separator: "/")
            var cumulativePath = ""

            for part in parts {
                cumulativePath += String(part) + "/"
                components.append((String(part), cumulativePath))
            }
        }

        return components
    }

    var body: some View {
        HStack(spacing: 4) {
            // Home icon for root
            if bucketName != nil {
                Image(systemName: "tray.fill")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(.secondary)
                    .frame(width: 16, height: 16)
                    .accessibilityHidden(true)
            }

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 0) {
                    ForEach(Array(pathComponents.enumerated()), id: \.offset) { index, component in
                        HStack(spacing: 4) {
                            // Breadcrumb segment
                            Button(action: {
                                onNavigate(component.path)
                            }) {
                                Text(component.name)
                                    .font(.system(.body, design: .monospaced, weight: .medium))
                                    .foregroundStyle(index == pathComponents.count - 1 ? .primary : .secondary)
                                    .lineLimit(1)
                                    .fixedSize()
                            }
                            .buttonStyle(.plain)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(
                                RoundedRectangle(cornerRadius: 4, style: .continuous)
                                    .fill(Color.primary.opacity(0))
                            )
                            .onHover { hovering in
                                NSCursor.pointingHand.set()
                            }
                            .accessibilityLabel(component.name)
                            .accessibilityHint(index == pathComponents.count - 1 ? "Current location" : "Navigate to \(component.name)")

                            // Chevron separator (not after last item)
                            if index < pathComponents.count - 1 {
                                Image(systemName: "chevron.right")
                                    .font(.system(size: 10, weight: .semibold))
                                    .foregroundStyle(.tertiary)
                                    .accessibilityHidden(true)
                            }
                        }
                    }
                }
                .padding(.horizontal, 4)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            Spacer()
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Material.thin)
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Path: \(formattedPath)")
    }

    private var formattedPath: String {
        guard let bucket = bucketName else { return "No bucket selected" }
        if currentPath.isEmpty {
            return bucket
        }
        return "\(bucket)/\(currentPath)"
    }
}

#Preview("Root Path") {
    BreadcrumbView(
        bucketName: "my-bucket",
        currentPath: "",
        onNavigate: { _ in }
    )
    .frame(height: 40)
}

#Preview("Nested Path") {
    BreadcrumbView(
        bucketName: "documents",
        currentPath: "projects/2024/reports/",
        onNavigate: { _ in }
    )
    .frame(height: 40)
}

#Preview("Long Path") {
    BreadcrumbView(
        bucketName: "archive",
        currentPath: "backup/servers/production/logs/2024/january/week1/",
        onNavigate: { _ in }
    )
    .frame(height: 40)
}

#Preview("No Bucket") {
    BreadcrumbView(
        bucketName: nil,
        currentPath: "",
        onNavigate: { _ in }
    )
    .frame(height: 40)
}
