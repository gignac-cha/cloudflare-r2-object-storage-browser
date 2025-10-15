import SwiftUI

/// Toolbar with navigation controls and action buttons
/// Back/Forward, Upload, Download, Delete, Refresh
struct ToolbarView: View {
    let canGoBack: Bool
    let canGoForward: Bool
    let canGoUp: Bool
    let hasSelection: Bool
    let selectionCount: Int

    let onBack: () -> Void
    let onForward: () -> Void
    let onUp: () -> Void
    let onUpload: () -> Void
    let onDownload: () -> Void
    let onDelete: () -> Void
    let onRefresh: () -> Void

    var body: some View {
        HStack(spacing: 0) {
            // Navigation controls
            HStack(spacing: 2) {
                // Back button
                ToolbarButton(
                    icon: "chevron.left",
                    label: "Back",
                    isEnabled: canGoBack,
                    keyboardShortcut: "[",
                    action: onBack
                )

                // Forward button
                ToolbarButton(
                    icon: "chevron.right",
                    label: "Forward",
                    isEnabled: canGoForward,
                    keyboardShortcut: "]",
                    action: onForward
                )

                // Up to parent folder button
                ToolbarButton(
                    icon: "arrow.up",
                    label: "Up",
                    isEnabled: canGoUp,
                    keyboardShortcut: "↑",
                    action: onUp
                )
            }
            .padding(.trailing, 8)

            Divider()
                .frame(height: 24)
                .padding(.horizontal, 8)

            // Action buttons
            HStack(spacing: 2) {
                // Upload button
                ToolbarButton(
                    icon: "arrow.up.doc",
                    label: "Upload",
                    isEnabled: true,
                    isPrimary: true,
                    action: onUpload
                )

                // Download button
                ToolbarButton(
                    icon: "arrow.down.doc",
                    label: "Download",
                    isEnabled: hasSelection,
                    action: onDownload
                )

                // Delete button
                ToolbarButton(
                    icon: "trash",
                    label: "Delete",
                    isEnabled: hasSelection,
                    isDestructive: true,
                    action: onDelete
                )
            }
            .padding(.trailing, 8)

            Divider()
                .frame(height: 24)
                .padding(.horizontal, 8)

            // Refresh button
            ToolbarButton(
                icon: "arrow.clockwise",
                label: "Refresh",
                isEnabled: true,
                keyboardShortcut: "r",
                action: onRefresh
            )

            Spacer()

            // Selection counter
            if hasSelection {
                Text("\(selectionCount) \(selectionCount == 1 ? "item" : "items") selected")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(
                        RoundedRectangle(cornerRadius: 6, style: .continuous)
                            .fill(Color.accentColor.opacity(0.1))
                    )
                    .accessibilityLabel("\(selectionCount) items selected")
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Material.thin)
    }
}

/// Individual toolbar button with hover effects and accessibility
struct ToolbarButton: View {
    let icon: String
    let label: String
    var isEnabled: Bool = true
    var isPrimary: Bool = false
    var isDestructive: Bool = false
    var keyboardShortcut: String? = nil
    let action: () -> Void

    @State private var isHovered = false

    var body: some View {
        Button(action: action) {
            Image(systemName: icon)
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(foregroundColor)
                .frame(width: 32, height: 32)
                .background(
                    RoundedRectangle(cornerRadius: 6, style: .continuous)
                        .fill(backgroundColor)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 6, style: .continuous)
                        .strokeBorder(borderColor, lineWidth: isHovered && isEnabled ? 1 : 0)
                )
        }
        .buttonStyle(.plain)
        .disabled(!isEnabled)
        .onHover { hovering in
            if isEnabled {
                isHovered = hovering
            }
        }
        .accessibilityLabel(label)
        .accessibilityHint(accessibilityHint)
        .help(helpText)
        .animation(.easeInOut(duration: 0.15), value: isHovered)
    }

    private var foregroundColor: Color {
        if !isEnabled {
            return .secondary.opacity(0.4)
        } else if isDestructive {
            return .red
        } else if isPrimary {
            return .accentColor
        } else {
            return .primary
        }
    }

    private var backgroundColor: Color {
        if !isEnabled {
            return .clear
        } else if isHovered {
            if isDestructive {
                return .red.opacity(0.1)
            } else if isPrimary {
                return .accentColor.opacity(0.1)
            } else {
                return .primary.opacity(0.05)
            }
        } else {
            return .clear
        }
    }

    private var borderColor: Color {
        if isDestructive {
            return .red.opacity(0.3)
        } else if isPrimary {
            return .accentColor.opacity(0.3)
        } else {
            return .primary.opacity(0.2)
        }
    }

    private var helpText: String {
        if let shortcut = keyboardShortcut {
            return "\(label) (Cmd+\(shortcut))"
        }
        return label
    }

    private var accessibilityHint: String {
        if !isEnabled {
            return "Not available"
        }
        return ""
    }
}

#Preview("Default State") {
    ToolbarView(
        canGoBack: false,
        canGoForward: false,
        canGoUp: false,
        hasSelection: false,
        selectionCount: 0,
        onBack: {},
        onForward: {},
        onUp: {},
        onUpload: {},
        onDownload: {},
        onDelete: {},
        onRefresh: {}
    )
    .frame(height: 48)
}

#Preview("With Navigation") {
    ToolbarView(
        canGoBack: true,
        canGoForward: true,
        canGoUp: true,
        hasSelection: false,
        selectionCount: 0,
        onBack: {},
        onForward: {},
        onUp: {},
        onUpload: {},
        onDownload: {},
        onDelete: {},
        onRefresh: {}
    )
    .frame(height: 48)
}

#Preview("With Selection") {
    ToolbarView(
        canGoBack: true,
        canGoForward: false,
        canGoUp: true,
        hasSelection: true,
        selectionCount: 3,
        onBack: {},
        onForward: {},
        onUp: {},
        onUpload: {},
        onDownload: {},
        onDelete: {},
        onRefresh: {}
    )
    .frame(height: 48)
}
