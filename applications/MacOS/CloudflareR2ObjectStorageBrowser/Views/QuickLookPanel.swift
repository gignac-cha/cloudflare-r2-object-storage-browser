import SwiftUI
import Quartz

struct QuickLookPanel: View {
    @Binding var isVisible: Bool
    let fileURL: URL?
    let fileName: String

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text(fileName)
                    .font(.system(.headline, design: .monospaced))
                    .lineLimit(1)

                Spacer()

                Button {
                    isVisible = false
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(.secondary)
                        .imageScale(.large)
                }
                .buttonStyle(.plain)
                .help("Close Preview")
            }
            .padding()
            .background(.regularMaterial)

            Divider()

            // Preview content
            if let url = fileURL {
                QuickLookView(url: url)
            } else {
                VStack(spacing: 16) {
                    Image(systemName: "doc.text.magnifyingglass")
                        .font(.system(size: 48))
                        .foregroundStyle(.secondary)

                    Text("Preview Unavailable")
                        .font(.headline)

                    Text("Unable to load file preview")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .frame(minWidth: 400, minHeight: 400)
    }
}

// MARK: - QuickLook NSView Representable

struct QuickLookView: NSViewRepresentable {
    let url: URL

    func makeNSView(context: Context) -> QLPreviewView {
        let preview = QLPreviewView()
        preview.autostarts = true
        return preview
    }

    func updateNSView(_ nsView: QLPreviewView, context: Context) {
        nsView.previewItem = url as QLPreviewItem
    }
}
