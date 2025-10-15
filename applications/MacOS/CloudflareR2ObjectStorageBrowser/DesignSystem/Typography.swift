//
//  Typography.swift
//  CloudflareR2ObjectStorageBrowser
//
//  Design System - Typography
//  San Francisco font hierarchy with Dynamic Type support
//  Follows Apple HIG 2025 typography guidelines
//

import SwiftUI

/// Typography system using San Francisco font family
/// All text styles support Dynamic Type and scale with user preferences
struct DSTypography {

    // MARK: - Display Styles (Large hero text)

    /// Display Large - App title, hero sections (34pt)
    static let displayLarge = Font.system(size: 34, weight: .bold, design: .default)

    /// Display Medium - Section headers (28pt)
    static let displayMedium = Font.system(size: 28, weight: .bold, design: .default)

    /// Display Small - Subsection headers (22pt)
    static let displaySmall = Font.system(size: 22, weight: .semibold, design: .default)

    // MARK: - Headline Styles (Emphasized content)

    /// Headline - Panel titles, group headers (17pt bold)
    static let headline = Font.headline.weight(.semibold)

    /// Subheadline - Secondary headers (15pt medium)
    static let subheadline = Font.subheadline.weight(.medium)

    // MARK: - Body Styles (Main content)

    /// Body - Default text (13pt regular)
    static let body = Font.body

    /// Body Emphasized - Important body text (13pt medium)
    static let bodyEmphasized = Font.body.weight(.medium)

    /// Body Monospaced - Code, paths, logs (13pt monospaced)
    static let bodyMonospaced = Font.system(.body, design: .monospaced)

    // MARK: - Caption Styles (Supporting text)

    /// Caption - Metadata, timestamps (11pt regular)
    static let caption = Font.caption

    /// Caption Emphasized - Important metadata (11pt medium)
    static let captionEmphasized = Font.caption.weight(.medium)

    /// Caption 2 - Very small supporting text (10pt regular)
    static let caption2 = Font.caption2

    // MARK: - Label Styles (UI elements)

    /// Title - Sidebar sections, prominent labels (13pt regular)
    static let title = Font.system(size: 13, weight: .regular)

    /// Title Emphasized - Active sections (13pt semibold)
    static let titleEmphasized = Font.system(size: 13, weight: .semibold)

    /// Label - Buttons, menu items (13pt regular)
    static let label = Font.system(size: 13, weight: .regular)

    /// Label Emphasized - Primary actions (13pt medium)
    static let labelEmphasized = Font.system(size: 13, weight: .medium)

    // MARK: - Specialized Styles

    /// Monospaced Large - API responses, file content (14pt monospaced)
    static let monospacedLarge = Font.system(size: 14, design: .monospaced)

    /// Monospaced Small - Hex viewer, compact logs (11pt monospaced)
    static let monospacedSmall = Font.system(size: 11, design: .monospaced)

    /// Numeric - File sizes, counts (13pt tabular nums)
    /// Note: Use .monospacedDigit() modifier on Text views for aligned numbers
    static let numeric = Font.body.monospacedDigit()

    /// Button - Standard button text (13pt regular)
    static let button = Font.system(size: 13, weight: .regular)

    /// Button Prominent - Primary action buttons (13pt semibold)
    static let buttonProminent = Font.system(size: 13, weight: .semibold)

    // MARK: - Line Heights

    /// Recommended line spacing multipliers
    struct LineHeight {
        /// Tight - For headlines and titles (1.0-1.1x)
        static let tight: CGFloat = 1.0

        /// Normal - For body text (1.3-1.4x)
        static let normal: CGFloat = 1.35

        /// Relaxed - For long-form content (1.5-1.6x)
        static let relaxed: CGFloat = 1.5
    }

    // MARK: - Font Weights

    /// Standard font weights for custom usage
    struct Weight {
        static let ultraLight = Font.Weight.ultraLight
        static let thin = Font.Weight.thin
        static let light = Font.Weight.light
        static let regular = Font.Weight.regular
        static let medium = Font.Weight.medium
        static let semibold = Font.Weight.semibold
        static let bold = Font.Weight.bold
        static let heavy = Font.Weight.heavy
        static let black = Font.Weight.black
    }
}

// MARK: - Typography View Modifiers

extension View {
    /// Apply display large typography style
    func typographyDisplayLarge() -> some View {
        self.font(DSTypography.displayLarge)
            .foregroundColor(DSColors.textPrimary)
    }

    /// Apply display medium typography style
    func typographyDisplayMedium() -> some View {
        self.font(DSTypography.displayMedium)
            .foregroundColor(DSColors.textPrimary)
    }

    /// Apply headline typography style
    func typographyHeadline() -> some View {
        self.font(DSTypography.headline)
            .foregroundColor(DSColors.textPrimary)
    }

    /// Apply body typography style
    func typographyBody(emphasized: Bool = false) -> some View {
        self.font(emphasized ? DSTypography.bodyEmphasized : DSTypography.body)
            .foregroundColor(DSColors.textPrimary)
    }

    /// Apply caption typography style
    func typographyCaption(emphasized: Bool = false) -> some View {
        self.font(emphasized ? DSTypography.captionEmphasized : DSTypography.caption)
            .foregroundColor(DSColors.textSecondary)
    }

    /// Apply monospaced typography style (for code/logs)
    func typographyMonospaced(size: DSTypography.MonospacedSize = .body) -> some View {
        self.font(size.font)
            .foregroundColor(DSColors.textPrimary)
    }

    /// Apply numeric typography style (for file sizes, counts)
    func typographyNumeric() -> some View {
        self.font(DSTypography.numeric)
            .foregroundColor(DSColors.textSecondary)
    }
}

// MARK: - Monospaced Size Helper

extension DSTypography {
    enum MonospacedSize {
        case large
        case body
        case small

        var font: Font {
            switch self {
            case .large: return DSTypography.monospacedLarge
            case .body: return DSTypography.bodyMonospaced
            case .small: return DSTypography.monospacedSmall
            }
        }
    }
}

// MARK: - Text Truncation Helpers

extension Text {
    /// Truncate text with ellipsis at the middle (for file paths)
    func truncateMiddle() -> some View {
        self.lineLimit(1)
            .truncationMode(.middle)
    }

    /// Truncate text with ellipsis at the end (for file names)
    func truncateEnd() -> some View {
        self.lineLimit(1)
            .truncationMode(.tail)
    }

    /// Allow text to wrap with maximum lines
    func wrap(maxLines: Int = 3) -> some View {
        self.lineLimit(maxLines)
            .fixedSize(horizontal: false, vertical: true)
    }
}

// MARK: - Preview

#if DEBUG
struct DSTypography_Previews: PreviewProvider {
    static var previews: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: DSSpacing.xl) {
                // Display Styles
                TypographySection(title: "Display Styles") {
                    TypographySample(
                        text: "Display Large",
                        font: DSTypography.displayLarge,
                        description: "34pt Bold"
                    )
                    TypographySample(
                        text: "Display Medium",
                        font: DSTypography.displayMedium,
                        description: "28pt Bold"
                    )
                    TypographySample(
                        text: "Display Small",
                        font: DSTypography.displaySmall,
                        description: "22pt Semibold"
                    )
                }

                Divider()

                // Headline Styles
                TypographySection(title: "Headline Styles") {
                    TypographySample(
                        text: "Headline",
                        font: DSTypography.headline,
                        description: "17pt Semibold"
                    )
                    TypographySample(
                        text: "Subheadline",
                        font: DSTypography.subheadline,
                        description: "15pt Medium"
                    )
                }

                Divider()

                // Body Styles
                TypographySection(title: "Body Styles") {
                    TypographySample(
                        text: "Body Text - The quick brown fox jumps over the lazy dog",
                        font: DSTypography.body,
                        description: "13pt Regular"
                    )
                    TypographySample(
                        text: "Body Emphasized - The quick brown fox jumps over the lazy dog",
                        font: DSTypography.bodyEmphasized,
                        description: "13pt Medium"
                    )
                    TypographySample(
                        text: "Body Monospaced - The quick brown fox jumps",
                        font: DSTypography.bodyMonospaced,
                        description: "13pt Monospaced"
                    )
                }

                Divider()

                // Caption Styles
                TypographySection(title: "Caption Styles") {
                    TypographySample(
                        text: "Caption - Last modified 2 hours ago",
                        font: DSTypography.caption,
                        description: "11pt Regular"
                    )
                    TypographySample(
                        text: "Caption Emphasized - 1.2 MB",
                        font: DSTypography.captionEmphasized,
                        description: "11pt Medium"
                    )
                    TypographySample(
                        text: "Caption 2 - Additional metadata",
                        font: DSTypography.caption2,
                        description: "10pt Regular"
                    )
                }

                Divider()

                // Specialized Styles
                TypographySection(title: "Specialized Styles") {
                    TypographySample(
                        text: "{ \"status\": \"success\" }",
                        font: DSTypography.monospacedLarge,
                        description: "14pt Monospaced"
                    )
                    TypographySample(
                        text: "0x00 0x01 0x02 0x03",
                        font: DSTypography.monospacedSmall,
                        description: "11pt Monospaced"
                    )
                }
            }
            .padding(DSSpacing.xl)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(DSColors.windowBackground)
    }
}

struct TypographySection<Content: View>: View {
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

struct TypographySample: View {
    let text: String
    let font: Font
    let description: String

    var body: some View {
        VStack(alignment: .leading, spacing: DSSpacing.xs) {
            Text(text)
                .font(font)
                .foregroundColor(DSColors.textPrimary)

            Text(description)
                .font(DSTypography.caption2)
                .foregroundColor(DSColors.textTertiary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(DSSpacing.sm)
        .background(DSColors.cardBackground)
        .cornerRadius(DSSpacing.sm)
    }
}
#endif
