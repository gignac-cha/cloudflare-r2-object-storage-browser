//
//  Colors.swift
//  CloudflareR2ObjectStorageBrowser
//
//  Design System - Colors
//  Dynamic color system with Light/Dark mode support
//  Follows Apple HIG 2025 - Liquid Glass design language
//

import SwiftUI

/// Semantic color palette for the R2 Object Storage Browser
/// All colors automatically adapt to Light/Dark mode and respect system accent color
struct DSColors {

    // MARK: - Brand Colors

    /// Cloudflare brand orange - used sparingly for brand identity
    static let brandOrange = Color(
        light: Color(red: 0.98, green: 0.49, blue: 0.21), // #FA7D35
        dark: Color(red: 1.0, green: 0.55, blue: 0.29)    // Lighter for dark mode
    )

    /// Cloudflare brand blue - secondary brand color
    static let brandBlue = Color(
        light: Color(red: 0.14, green: 0.49, blue: 0.87), // #2480DD
        dark: Color(red: 0.29, green: 0.62, blue: 0.95)   // Lighter for dark mode
    )

    // MARK: - Background Colors (Liquid Glass)

    /// Primary window background - uses system material
    static let windowBackground = Color(NSColor.windowBackgroundColor)

    /// Sidebar background - translucent glass effect
    static let sidebarBackground = Color(NSColor.controlBackgroundColor)

    /// Content area background
    static let contentBackground = Color(NSColor.textBackgroundColor)

    /// Card/panel background - elevated surface
    static let cardBackground = Color(
        light: Color(white: 1.0, opacity: 0.7),
        dark: Color(white: 0.15, opacity: 0.7)
    )

    /// Hover background - subtle interaction feedback
    static let hoverBackground = Color(
        light: Color(white: 0.0, opacity: 0.05),
        dark: Color(white: 1.0, opacity: 0.08)
    )

    /// Selected background - clear indication of selection
    static let selectedBackground = Color.accentColor.opacity(0.15)

    // MARK: - Text Colors

    /// Primary text - highest contrast, main content
    static let textPrimary = Color(NSColor.labelColor)

    /// Secondary text - supporting content, metadata
    static let textSecondary = Color(NSColor.secondaryLabelColor)

    /// Tertiary text - disabled or less important content
    static let textTertiary = Color(NSColor.tertiaryLabelColor)

    /// Placeholder text - form inputs, empty states
    static let textPlaceholder = Color(NSColor.placeholderTextColor)

    // MARK: - Semantic Colors (Status)

    /// Success state - upload complete, operation successful
    static let success = Color(
        light: Color(red: 0.20, green: 0.78, blue: 0.35), // #34C759
        dark: Color(red: 0.20, green: 0.84, blue: 0.40)   // iOS green
    )

    /// Error state - failed operation, validation error
    static let error = Color(
        light: Color(red: 1.0, green: 0.23, blue: 0.19),  // #FF3B30
        dark: Color(red: 1.0, green: 0.27, blue: 0.23)    // iOS red
    )

    /// Warning state - caution, review needed
    static let warning = Color(
        light: Color(red: 1.0, green: 0.80, blue: 0.0),   // #FFCC00
        dark: Color(red: 1.0, green: 0.84, blue: 0.04)    // iOS yellow
    )

    /// Info state - informational messages
    static let info = Color(
        light: Color(red: 0.0, green: 0.48, blue: 1.0),   // #007AFF
        dark: Color(red: 0.04, green: 0.52, blue: 1.0)    // iOS blue
    )

    // MARK: - Border Colors

    /// Primary border - visible separation
    static let borderPrimary = Color(
        light: Color(white: 0.0, opacity: 0.1),
        dark: Color(white: 1.0, opacity: 0.15)
    )

    /// Secondary border - subtle separation
    static let borderSecondary = Color(
        light: Color(white: 0.0, opacity: 0.06),
        dark: Color(white: 1.0, opacity: 0.08)
    )

    /// Divider - horizontal/vertical rules
    static let divider = Color(NSColor.separatorColor)

    // MARK: - Icon Colors

    /// Default icon tint
    static let iconDefault = Color(NSColor.secondaryLabelColor)

    /// Active/selected icon tint
    static let iconActive = Color.accentColor

    /// Bucket icon color
    static let iconBucket = Color(
        light: Color(red: 0.35, green: 0.64, blue: 0.95), // Light blue
        dark: Color(red: 0.45, green: 0.70, blue: 1.0)
    )

    /// Folder icon color
    static let iconFolder = Color(
        light: Color(red: 0.0, green: 0.48, blue: 1.0),   // System blue
        dark: Color(red: 0.04, green: 0.52, blue: 1.0)
    )

    /// File icon color (changes based on file type)
    static let iconFile = Color(NSColor.secondaryLabelColor)

    // MARK: - Transfer Colors

    /// Upload indicator
    static let transferUpload = Color(
        light: Color(red: 0.35, green: 0.64, blue: 0.95),
        dark: Color(red: 0.45, green: 0.70, blue: 1.0)
    )

    /// Download indicator
    static let transferDownload = Color(
        light: Color(red: 0.40, green: 0.78, blue: 0.40),
        dark: Color(red: 0.45, green: 0.84, blue: 0.45)
    )

    /// Paused state
    static let transferPaused = Color(
        light: Color(red: 1.0, green: 0.80, blue: 0.0),
        dark: Color(red: 1.0, green: 0.84, blue: 0.04)
    )

    // MARK: - File Type Colors (for icons and badges)

    static let fileTypeImage = Color(red: 1.0, green: 0.35, blue: 0.62)    // Pink
    static let fileTypeVideo = Color(red: 0.75, green: 0.22, blue: 0.97)   // Purple
    static let fileTypeDocument = Color(red: 0.0, green: 0.48, blue: 1.0)  // Blue
    static let fileTypeArchive = Color(red: 0.6, green: 0.6, blue: 0.6)    // Gray
    static let fileTypeCode = Color(red: 0.35, green: 0.95, blue: 0.35)    // Green
    static let fileTypeAudio = Color(red: 1.0, green: 0.60, blue: 0.0)     // Orange
}

// MARK: - Color Extension for Light/Dark Mode

extension Color {
    /// Initialize a color that adapts to light and dark mode
    /// - Parameters:
    ///   - light: Color for light appearance
    ///   - dark: Color for dark appearance
    init(light: Color, dark: Color) {
        self.init(NSColor(name: nil) { appearance in
            switch appearance.bestMatch(from: [.aqua, .darkAqua]) {
            case .darkAqua:
                return NSColor(dark)
            default:
                return NSColor(light)
            }
        })
    }
}

// MARK: - Preview Helper

#if DEBUG
struct DSColors_Previews: PreviewProvider {
    static var previews: some View {
        VStack(spacing: DSSpacing.lg) {
            // Brand Colors
            ColorSection(title: "Brand Colors") {
                ColorSwatch(name: "Brand Orange", color: DSColors.brandOrange)
                ColorSwatch(name: "Brand Blue", color: DSColors.brandBlue)
            }

            // Semantic Colors
            ColorSection(title: "Semantic Colors") {
                ColorSwatch(name: "Success", color: DSColors.success)
                ColorSwatch(name: "Error", color: DSColors.error)
                ColorSwatch(name: "Warning", color: DSColors.warning)
                ColorSwatch(name: "Info", color: DSColors.info)
            }

            // Icon Colors
            ColorSection(title: "Icon Colors") {
                ColorSwatch(name: "Bucket", color: DSColors.iconBucket)
                ColorSwatch(name: "Folder", color: DSColors.iconFolder)
                ColorSwatch(name: "File", color: DSColors.iconFile)
            }

            // File Type Colors
            ColorSection(title: "File Type Colors") {
                ColorSwatch(name: "Image", color: DSColors.fileTypeImage)
                ColorSwatch(name: "Video", color: DSColors.fileTypeVideo)
                ColorSwatch(name: "Document", color: DSColors.fileTypeDocument)
                ColorSwatch(name: "Code", color: DSColors.fileTypeCode)
            }
        }
        .padding(DSSpacing.xl)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(DSColors.windowBackground)
    }
}

struct ColorSection<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: DSSpacing.sm) {
            Text(title)
                .font(DSTypography.headline)
                .foregroundColor(DSColors.textPrimary)

            HStack(spacing: DSSpacing.md) {
                content
            }
        }
    }
}

struct ColorSwatch: View {
    let name: String
    let color: Color

    var body: some View {
        VStack(spacing: DSSpacing.xs) {
            RoundedRectangle(cornerRadius: DSSpacing.sm)
                .fill(color)
                .frame(width: 60, height: 60)
                .overlay(
                    RoundedRectangle(cornerRadius: DSSpacing.sm)
                        .stroke(DSColors.borderPrimary, lineWidth: 1)
                )

            Text(name)
                .font(DSTypography.caption)
                .foregroundColor(DSColors.textSecondary)
                .multilineTextAlignment(.center)
        }
    }
}
#endif
