import SwiftUI

/// Bucket sidebar view with list of R2 buckets
/// Uses SF Symbol "tray.fill" for bucket icon (as per PRD 3.2.1)
struct BucketSidebarView: View {
    @Binding var buckets: [Bucket]
    @Binding var selectedBucket: Bucket?
    @Binding var isLoading: Bool
    @Binding var error: String?

    let onRefresh: () -> Void
    let onBucketSelect: (Bucket) -> Void

    var body: some View {
        VStack(spacing: 0) {
            // Header with refresh button
            HStack {
                Text("Buckets")
                    .font(.headline)
                    .foregroundStyle(.primary)
                    .accessibilityAddTraits(.isHeader)

                Spacer()

                Button(action: onRefresh) {
                    if isLoading {
                        ProgressView()
                            .controlSize(.small)
                            .scaleEffect(0.7)
                            .accessibilityLabel("Loading buckets")
                    } else {
                        Image(systemName: "arrow.clockwise")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundStyle(.secondary)
                    }
                }
                .buttonStyle(.borderless)
                .disabled(isLoading)
                .accessibilityLabel("Refresh bucket list")
                .help("Refresh bucket list (Cmd+R)")
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(.background)

            Divider()

            // Bucket list
            ScrollView {
                LazyVStack(spacing: 0) {
                    if isLoading && buckets.isEmpty {
                        // Initial loading state
                        VStack(spacing: 12) {
                            ProgressView()
                                .controlSize(.regular)
                            Text("Loading buckets...")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 32)

                    } else if let error = error {
                        // Error state
                        VStack(spacing: 12) {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .font(.system(size: 24))
                                .foregroundStyle(.red)
                            Text("Error loading buckets")
                                .font(.headline)
                                .foregroundStyle(.primary)
                            Text(error)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                                .multilineTextAlignment(.center)
                            Button("Try Again", action: onRefresh)
                                .buttonStyle(.bordered)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(24)

                    } else if buckets.isEmpty {
                        // Empty state
                        VStack(spacing: 12) {
                            Image(systemName: "tray")
                                .font(.system(size: 32))
                                .foregroundStyle(.secondary)
                            Text("No buckets found")
                                .font(.headline)
                                .foregroundStyle(.primary)
                            Text("Create a bucket in the Cloudflare dashboard to get started.")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                                .multilineTextAlignment(.center)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(24)

                    } else {
                        // Bucket list
                        ForEach(buckets, id: \.name) { bucket in
                            BucketRowView(
                                bucket: bucket,
                                isSelected: selectedBucket?.name == bucket.name,
                                onSelect: { onBucketSelect(bucket) }
                            )
                        }
                    }
                }
            }
            .background(Material.regular)
        }
        .frame(minWidth: 200, idealWidth: 250, maxWidth: 400)
    }
}

/// Individual bucket row in sidebar
struct BucketRowView: View {
    let bucket: Bucket
    let isSelected: Bool
    let onSelect: () -> Void

    @State private var isHovered = false

    var body: some View {
        Button(action: onSelect) {
            HStack(spacing: 12) {
                // Bucket icon (pail/tray icon as per PRD)
                Image(systemName: "tray.fill")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundStyle(isSelected ? .white : .blue)
                    .frame(width: 20)

                VStack(alignment: .leading, spacing: 2) {
                    Text(bucket.name)
                        .font(.system(.body, design: .monospaced, weight: .medium))
                        .foregroundStyle(isSelected ? .white : .primary)
                        .lineLimit(1)
                        .accessibilityLabel("Bucket \(bucket.name)")

                    if let creationDate = bucket.creationDate {
                        Text(formatDate(creationDate))
                            .font(.caption2)
                            .foregroundStyle(isSelected ? .white.opacity(0.8) : .secondary)
                            .lineLimit(1)
                    }
                }

                Spacer()
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: 6, style: .continuous)
                    .fill(isSelected ? Color.accentColor : (isHovered ? Color.primary.opacity(0.05) : Color.clear))
            )
            .animation(.easeInOut(duration: 0.15), value: isHovered)
            .animation(.easeInOut(duration: 0.15), value: isSelected)
        }
        .buttonStyle(.plain)
        .padding(.horizontal, 8)
        .onHover { hovering in
            isHovered = hovering
        }
        .accessibilityAddTraits(isSelected ? [.isSelected] : [])
        .help("Open \(bucket.name)")
    }

    /// Format ISO8601 date to relative time
    private func formatDate(_ dateString: String) -> String {
        let formatter = ISO8601DateFormatter()
        guard let date = formatter.date(from: dateString) else {
            return dateString
        }

        let displayFormatter = DateFormatter()
        displayFormatter.dateStyle = .medium
        displayFormatter.timeStyle = .none
        return displayFormatter.string(from: date)
    }
}

#Preview("With Buckets") {
    BucketSidebarView(
        buckets: .constant([
            Bucket(name: "my-images", creationDate: "2024-01-15T10:30:00Z"),
            Bucket(name: "videos-archive", creationDate: "2024-02-20T14:45:00Z"),
            Bucket(name: "documents", creationDate: "2024-03-10T09:15:00Z")
        ]),
        selectedBucket: .constant(Bucket(name: "my-images", creationDate: "2024-01-15T10:30:00Z")),
        isLoading: .constant(false),
        error: .constant(nil),
        onRefresh: {},
        onBucketSelect: { _ in }
    )
}

#Preview("Empty State") {
    BucketSidebarView(
        buckets: .constant([]),
        selectedBucket: .constant(nil),
        isLoading: .constant(false),
        error: .constant(nil),
        onRefresh: {},
        onBucketSelect: { _ in }
    )
}

#Preview("Loading") {
    BucketSidebarView(
        buckets: .constant([]),
        selectedBucket: .constant(nil),
        isLoading: .constant(true),
        error: .constant(nil),
        onRefresh: {},
        onBucketSelect: { _ in }
    )
}

#Preview("Error State") {
    BucketSidebarView(
        buckets: .constant([]),
        selectedBucket: .constant(nil),
        isLoading: .constant(false),
        error: .constant("Failed to connect to R2. Please check your credentials."),
        onRefresh: {},
        onBucketSelect: { _ in }
    )
}
