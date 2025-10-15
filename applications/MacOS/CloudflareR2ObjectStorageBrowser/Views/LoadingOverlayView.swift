import SwiftUI

/// Loading overlay view with progress indicator and message
/// Displays over the entire window to prevent user interaction during long operations
struct LoadingOverlayView: View {
    let message: String
    let progress: Double?
    let onCancel: (() -> Void)?

    init(message: String, progress: Double?, onCancel: (() -> Void)? = nil) {
        self.message = message
        self.progress = progress
        self.onCancel = onCancel
    }

    var body: some View {
        ZStack {
            // Semi-transparent background
            Color.black.opacity(0.4)
                .ignoresSafeArea()

            // Loading card
            VStack(spacing: 20) {
                // Progress indicator
                if let progress = progress {
                    // Determinate progress (0.0 to 1.0)
                    VStack(spacing: 12) {
                        ProgressView(value: progress)
                            .progressViewStyle(.linear)
                            .frame(width: 200)

                        Text("\(Int(progress * 100))%")
                            .font(.system(.caption, design: .monospaced))
                            .foregroundStyle(.secondary)
                    }
                } else {
                    // Indeterminate progress (spinning)
                    ProgressView()
                        .progressViewStyle(.circular)
                        .scaleEffect(1.2)
                        .controlSize(.large)
                }

                // Message
                Text(message)
                    .font(.body)
                    .foregroundStyle(.primary)
                    .multilineTextAlignment(.center)
                    .lineLimit(5)
                    .frame(maxWidth: 280)

                // Cancel button (if cancellable)
                if let onCancel = onCancel {
                    Button("Cancel") {
                        onCancel()
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.large)
                    .keyboardShortcut(.cancelAction)
                }
            }
            .padding(24)
            .background {
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(.regularMaterial)
                    .shadow(color: .black.opacity(0.3), radius: 20, x: 0, y: 10)
            }
        }
        .transition(.opacity.combined(with: .scale(scale: 0.95)))
        .animation(.easeInOut(duration: 0.2), value: progress)
    }
}

// MARK: - Previews

#Preview("Indeterminate") {
    LoadingOverlayView(
        message: "Loading buckets...",
        progress: nil
    )
}

#Preview("Determinate 25%") {
    LoadingOverlayView(
        message: "Deleting files: 2 of 8",
        progress: 0.25
    )
}

#Preview("Determinate 75%") {
    LoadingOverlayView(
        message: "Uploading file: data.zip",
        progress: 0.75
    )
}

#Preview("Long Message") {
    LoadingOverlayView(
        message: "Deleting folder 'newscasts/2025-10-13/' and all its contents...",
        progress: 0.5
    )
}
