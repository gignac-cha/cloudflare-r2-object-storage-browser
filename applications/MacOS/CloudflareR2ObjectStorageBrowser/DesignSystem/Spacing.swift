//
//  Spacing.swift
//  CloudflareR2ObjectStorageBrowser
//
//  Design System - Spacing
//  8-point grid system for consistent layout
//  Follows Apple HIG 2025 spacing guidelines
//

import SwiftUI

/// Spacing system based on 8pt grid for consistent layouts
/// All spacing values are multiples of 8 for perfect pixel alignment
struct DSSpacing {

    // MARK: - Base Spacing Values (8pt Grid)

    /// 2pt - Minimal spacing (for very tight layouts)
    static let xxs: CGFloat = 2

    /// 4pt - Extra small spacing (icon padding, tight chips)
    static let xs: CGFloat = 4

    /// 8pt - Small spacing (compact layouts, list items)
    static let sm: CGFloat = 8

    /// 12pt - Medium spacing (default between elements)
    static let md: CGFloat = 12

    /// 16pt - Large spacing (section separation)
    static let lg: CGFloat = 16

    /// 24pt - Extra large spacing (major sections)
    static let xl: CGFloat = 24

    /// 32pt - 2X large spacing (screen margins)
    static let xxl: CGFloat = 32

    /// 48pt - 3X large spacing (hero sections, large gaps)
    static let xxxl: CGFloat = 48

    // MARK: - Specific Use Cases

    /// Sidebar width range
    struct Sidebar {
        static let min: CGFloat = 200
        static let ideal: CGFloat = 250
        static let max: CGFloat = 400
    }

    /// List item spacing
    struct List {
        /// Padding within list items
        static let itemPadding = EdgeInsets(
            top: DSSpacing.sm,
            leading: DSSpacing.md,
            bottom: DSSpacing.sm,
            trailing: DSSpacing.md
        )

        /// Spacing between list items
        static let itemSpacing: CGFloat = 0

        /// List section header spacing
        static let sectionHeaderSpacing: CGFloat = DSSpacing.sm
    }

    /// Card/Panel spacing
    struct Card {
        /// Inner content padding
        static let padding = EdgeInsets(
            top: DSSpacing.md,
            leading: DSSpacing.lg,
            bottom: DSSpacing.md,
            trailing: DSSpacing.lg
        )

        /// Spacing between cards
        static let spacing: CGFloat = DSSpacing.lg
    }

    /// Toolbar spacing
    struct Toolbar {
        /// Height of toolbar
        static let height: CGFloat = 40

        /// Padding within toolbar
        static let padding = EdgeInsets(
            top: DSSpacing.sm,
            leading: DSSpacing.md,
            bottom: DSSpacing.sm,
            trailing: DSSpacing.md
        )

        /// Spacing between toolbar items
        static let itemSpacing: CGFloat = DSSpacing.sm
    }

    /// Button spacing
    struct Button {
        /// Padding within standard buttons
        static let padding = EdgeInsets(
            top: DSSpacing.xs,
            leading: DSSpacing.md,
            bottom: DSSpacing.xs,
            trailing: DSSpacing.md
        )

        /// Padding within prominent buttons
        static let paddingProminent = EdgeInsets(
            top: DSSpacing.sm,
            leading: DSSpacing.lg,
            bottom: DSSpacing.sm,
            trailing: DSSpacing.lg
        )

        /// Minimum button height
        static let minHeight: CGFloat = 28

        /// Spacing between adjacent buttons
        static let spacing: CGFloat = DSSpacing.sm
    }

    /// Icon sizing
    struct Icon {
        /// Small icons (list items, inline)
        static let small: CGFloat = 14

        /// Regular icons (buttons, toolbar)
        static let regular: CGFloat = 16

        /// Large icons (prominent actions)
        static let large: CGFloat = 20

        /// Extra large icons (empty states, headers)
        static let extraLarge: CGFloat = 24

        /// Massive icons (hero sections)
        static let massive: CGFloat = 48
    }

    /// Corner radius values
    struct CornerRadius {
        /// Small - Chips, tags
        static let small: CGFloat = 4

        /// Medium - Buttons, cards
        static let medium: CGFloat = 8

        /// Large - Panels, modals
        static let large: CGFloat = 12

        /// Extra large - Prominent surfaces
        static let extraLarge: CGFloat = 16

        /// Continuous - macOS style continuous corners
        static let continuous = RectangleCornerRadii(
            topLeading: 10,
            bottomLeading: 10,
            bottomTrailing: 10,
            topTrailing: 10
        )
    }

    /// Border width values
    struct Border {
        /// Thin - Subtle borders
        static let thin: CGFloat = 0.5

        /// Regular - Standard borders
        static let regular: CGFloat = 1

        /// Thick - Emphasized borders
        static let thick: CGFloat = 2
    }

    /// Window sizing
    struct Window {
        /// Minimum window width
        static let minWidth: CGFloat = 900

        /// Minimum window height
        static let minHeight: CGFloat = 600

        /// Ideal window width
        static let idealWidth: CGFloat = 1200

        /// Ideal window height
        static let idealHeight: CGFloat = 800
    }

    /// Panel sizing
    struct Panel {
        /// Debug panel minimum height
        static let debugMinHeight: CGFloat = 150

        /// Debug panel ideal height
        static let debugIdealHeight: CGFloat = 250

        /// Debug panel maximum height
        static let debugMaxHeight: CGFloat = 400

        /// Preview panel width
        static let previewWidth: CGFloat = 300
    }

    /// Grid view spacing
    struct Grid {
        /// Spacing between grid items
        static let itemSpacing: CGFloat = DSSpacing.lg

        /// Grid item size (small)
        static let itemSizeSmall: CGFloat = 80

        /// Grid item size (medium)
        static let itemSizeMedium: CGFloat = 120

        /// Grid item size (large)
        static let itemSizeLarge: CGFloat = 160
    }
}

// MARK: - Spacing View Modifiers

extension View {
    /// Apply standard card padding
    func cardPadding() -> some View {
        self.padding(DSSpacing.Card.padding)
    }

    /// Apply toolbar padding
    func toolbarPadding() -> some View {
        self.padding(DSSpacing.Toolbar.padding)
    }

    /// Apply list item padding
    func listItemPadding() -> some View {
        self.padding(DSSpacing.List.itemPadding)
    }

    /// Apply button padding (standard or prominent)
    func buttonPadding(prominent: Bool = false) -> some View {
        self.padding(prominent ? DSSpacing.Button.paddingProminent : DSSpacing.Button.padding)
    }

    /// Apply standard corner radius
    func cornerRadius(_ style: DSSpacing.CornerRadiusStyle = .medium) -> some View {
        self.clipShape(RoundedRectangle(cornerRadius: style.value, style: .continuous))
    }
}

extension DSSpacing {
    enum CornerRadiusStyle {
        case small
        case medium
        case large
        case extraLarge

        var value: CGFloat {
            switch self {
            case .small: return DSSpacing.CornerRadius.small
            case .medium: return DSSpacing.CornerRadius.medium
            case .large: return DSSpacing.CornerRadius.large
            case .extraLarge: return DSSpacing.CornerRadius.extraLarge
            }
        }
    }
}

// MARK: - Layout Helpers

extension View {
    /// Apply full width with alignment
    func fullWidth(alignment: Alignment = .center) -> some View {
        self.frame(maxWidth: .infinity, alignment: alignment)
    }

    /// Apply full height with alignment
    func fullHeight(alignment: Alignment = .center) -> some View {
        self.frame(maxHeight: .infinity, alignment: alignment)
    }

    /// Apply full width and height
    func fullFrame(alignment: Alignment = .center) -> some View {
        self.frame(maxWidth: .infinity, maxHeight: .infinity, alignment: alignment)
    }
}

// MARK: - Divider Helpers

extension Divider {
    /// Styled divider with standard color
    func styled() -> some View {
        self.background(DSColors.divider)
    }
}

// MARK: - Preview

#if DEBUG
struct DSSpacing_Previews: PreviewProvider {
    static var previews: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: DSSpacing.xl) {
                // Base Spacing
                SpacingSection(title: "Base Spacing (8pt Grid)") {
                    SpacingBar(label: "XXS (2pt)", value: DSSpacing.xxs)
                    SpacingBar(label: "XS (4pt)", value: DSSpacing.xs)
                    SpacingBar(label: "SM (8pt)", value: DSSpacing.sm)
                    SpacingBar(label: "MD (12pt)", value: DSSpacing.md)
                    SpacingBar(label: "LG (16pt)", value: DSSpacing.lg)
                    SpacingBar(label: "XL (24pt)", value: DSSpacing.xl)
                    SpacingBar(label: "XXL (32pt)", value: DSSpacing.xxl)
                    SpacingBar(label: "XXXL (48pt)", value: DSSpacing.xxxl)
                }

                Divider().styled()

                // Icon Sizes
                SpacingSection(title: "Icon Sizes") {
                    IconSample(label: "Small (14pt)", size: DSSpacing.Icon.small)
                    IconSample(label: "Regular (16pt)", size: DSSpacing.Icon.regular)
                    IconSample(label: "Large (20pt)", size: DSSpacing.Icon.large)
                    IconSample(label: "Extra Large (24pt)", size: DSSpacing.Icon.extraLarge)
                    IconSample(label: "Massive (48pt)", size: DSSpacing.Icon.massive)
                }

                Divider().styled()

                // Corner Radius
                SpacingSection(title: "Corner Radius") {
                    CornerRadiusSample(label: "Small (4pt)", radius: DSSpacing.CornerRadius.small)
                    CornerRadiusSample(label: "Medium (8pt)", radius: DSSpacing.CornerRadius.medium)
                    CornerRadiusSample(label: "Large (12pt)", radius: DSSpacing.CornerRadius.large)
                    CornerRadiusSample(label: "Extra Large (16pt)", radius: DSSpacing.CornerRadius.extraLarge)
                }

                Divider().styled()

                // Border Width
                SpacingSection(title: "Border Width") {
                    BorderSample(label: "Thin (0.5pt)", width: DSSpacing.Border.thin)
                    BorderSample(label: "Regular (1pt)", width: DSSpacing.Border.regular)
                    BorderSample(label: "Thick (2pt)", width: DSSpacing.Border.thick)
                }
            }
            .padding(DSSpacing.xl)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(DSColors.windowBackground)
    }
}

struct SpacingSection<Content: View>: View {
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

struct SpacingBar: View {
    let label: String
    let value: CGFloat

    var body: some View {
        HStack(spacing: DSSpacing.md) {
            Text(label)
                .font(DSTypography.body)
                .foregroundColor(DSColors.textSecondary)
                .frame(width: 120, alignment: .leading)

            Rectangle()
                .fill(DSColors.brandBlue)
                .frame(width: value, height: 20)

            Text("\(Int(value))pt")
                .font(DSTypography.caption)
                .foregroundColor(DSColors.textTertiary)
        }
    }
}

struct IconSample: View {
    let label: String
    let size: CGFloat

    var body: some View {
        HStack(spacing: DSSpacing.md) {
            Text(label)
                .font(DSTypography.body)
                .foregroundColor(DSColors.textSecondary)
                .frame(width: 150, alignment: .leading)

            Image(systemName: "star.fill")
                .font(.system(size: size))
                .foregroundColor(DSColors.brandOrange)
        }
    }
}

struct CornerRadiusSample: View {
    let label: String
    let radius: CGFloat

    var body: some View {
        HStack(spacing: DSSpacing.md) {
            Text(label)
                .font(DSTypography.body)
                .foregroundColor(DSColors.textSecondary)
                .frame(width: 150, alignment: .leading)

            RoundedRectangle(cornerRadius: radius, style: .continuous)
                .fill(DSColors.brandBlue)
                .frame(width: 60, height: 40)
        }
    }
}

struct BorderSample: View {
    let label: String
    let width: CGFloat

    var body: some View {
        HStack(spacing: DSSpacing.md) {
            Text(label)
                .font(DSTypography.body)
                .foregroundColor(DSColors.textSecondary)
                .frame(width: 150, alignment: .leading)

            Rectangle()
                .fill(Color.clear)
                .frame(width: 100, height: 40)
                .overlay(
                    Rectangle()
                        .stroke(DSColors.brandBlue, lineWidth: width)
                )
        }
    }
}
#endif
