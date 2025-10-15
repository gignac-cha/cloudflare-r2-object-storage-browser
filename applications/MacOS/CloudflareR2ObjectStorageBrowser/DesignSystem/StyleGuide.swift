//
//  StyleGuide.swift
//  CloudflareR2ObjectStorageBrowser
//
//  Design System - Visual Style Guide
//  Interactive preview of all design system components
//  Use this file to verify visual consistency and test changes
//

import SwiftUI

/// Interactive style guide showcasing all design system components
/// Run this preview to see the complete design system in action
struct StyleGuideView: View {
    @State private var selectedTab: StyleGuideTab = .overview
    @State private var selectedDemoCard = 0

    var body: some View {
        HSplitView {
            // Left sidebar - Navigation
            StyleGuideSidebar(selectedTab: $selectedTab)
                .frame(minWidth: 200, idealWidth: 250, maxWidth: 300)

            // Right content - Preview
            ScrollView {
                Group {
                    switch selectedTab {
                    case .overview:
                        OverviewSection()
                    case .colors:
                        ColorsSection()
                    case .typography:
                        TypographyStyleGuideSection()
                    case .spacing:
                        SpacingStyleGuideSection()
                    case .effects:
                        EffectsSection()
                    case .icons:
                        IconsSection()
                    case .components:
                        ComponentsSection()
                    }
                }
                .padding(DS.Spacing.xl)
            }
            .frame(minWidth: 600)
        }
        .frame(minWidth: 900, minHeight: 600)
    }
}

// MARK: - Style Guide Tabs

enum StyleGuideTab: String, CaseIterable {
    case overview = "Overview"
    case colors = "Colors"
    case typography = "Typography"
    case spacing = "Spacing"
    case effects = "Effects"
    case icons = "Icons"
    case components = "Components"

    var icon: String {
        switch self {
        case .overview: return "book.fill"
        case .colors: return "paintpalette.fill"
        case .typography: return "textformat"
        case .spacing: return "ruler"
        case .effects: return "sparkles"
        case .icons: return "star.fill"
        case .components: return "square.stack.3d.up.fill"
        }
    }
}

// MARK: - Sidebar

struct StyleGuideSidebar: View {
    @Binding var selectedTab: StyleGuideTab

    var body: some View {
        VStack(spacing: 0) {
            // Header
            VStack(spacing: DS.Spacing.sm) {
                Image(systemName: "paintbrush.fill")
                    .font(.system(size: DS.Spacing.Icon.massive))
                    .foregroundColor(DS.Colors.brandOrange)

                Text("Style Guide")
                    .font(DS.Typography.headline)
                    .foregroundColor(DS.Colors.textPrimary)

                Text("v1.0.0")
                    .font(DS.Typography.caption)
                    .foregroundColor(DS.Colors.textSecondary)
            }
            .padding(DS.Spacing.lg)
            .frame(maxWidth: .infinity)

            Divider().styled()

            // Navigation
            List(StyleGuideTab.allCases, id: \.self, selection: $selectedTab) { tab in
                HStack(spacing: DS.Spacing.sm) {
                    Image(systemName: tab.icon)
                        .font(.system(size: DS.Spacing.Icon.small))
                        .foregroundColor(selectedTab == tab ? DS.Colors.iconActive : DS.Colors.iconDefault)

                    Text(tab.rawValue)
                        .font(DS.Typography.body)
                }
            }
            .listStyle(.sidebar)

            Spacer()

            // Footer
            VStack(spacing: DS.Spacing.xs) {
                Text("Apple HIG 2025")
                    .font(DS.Typography.caption2)
                    .foregroundColor(DS.Colors.textTertiary)

                Text("Liquid Glass Design")
                    .font(DS.Typography.caption2)
                    .foregroundColor(DS.Colors.textTertiary)
            }
            .padding(DS.Spacing.md)
        }
        .sidebarGlass()
    }
}

// MARK: - Overview Section

struct OverviewSection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: DS.Spacing.xl) {
            Text("Design System Overview")
                .font(DS.Typography.displayMedium)
                .foregroundColor(DS.Colors.textPrimary)

            Text("A comprehensive design system for macOS R2 Object Storage Browser implementing Apple's 2025 Liquid Glass design language.")
                .font(DS.Typography.body)
                .foregroundColor(DS.Colors.textSecondary)

            Divider().styled()

            // Key principles
            VStack(alignment: .leading, spacing: DS.Spacing.lg) {
                PrincipleCard(
                    icon: "drop.fill",
                    title: "Liquid Glass Materials",
                    description: "Translucent backgrounds that reflect surroundings with adaptive vibrancy"
                )

                PrincipleCard(
                    icon: "paintpalette.fill",
                    title: "Dynamic Colors",
                    description: "Automatic Light/Dark mode with semantic color naming"
                )

                PrincipleCard(
                    icon: "star.fill",
                    title: "SF Symbols 7",
                    description: "6,900+ symbols with consistent sizing and semantic naming"
                )

                PrincipleCard(
                    icon: "textformat",
                    title: "Typography Hierarchy",
                    description: "San Francisco font with Dynamic Type support"
                )

                PrincipleCard(
                    icon: "grid",
                    title: "8-Point Grid",
                    description: "All spacing values are multiples of 8 for perfect alignment"
                )

                PrincipleCard(
                    icon: "waveform",
                    title: "Smooth Animations",
                    description: "0.2-0.3s duration with spring physics for natural feel"
                )
            }
        }
    }
}

struct PrincipleCard: View {
    let icon: String
    let title: String
    let description: String

    var body: some View {
        HStack(alignment: .top, spacing: DS.Spacing.md) {
            Image(systemName: icon)
                .font(.system(size: DS.Spacing.Icon.large))
                .foregroundColor(DS.Colors.brandBlue)
                .frame(width: 40)

            VStack(alignment: .leading, spacing: DS.Spacing.xs) {
                Text(title)
                    .font(DS.Typography.headline)
                    .foregroundColor(DS.Colors.textPrimary)

                Text(description)
                    .font(DS.Typography.body)
                    .foregroundColor(DS.Colors.textSecondary)
            }
        }
        .padding(DS.Spacing.md)
        .frame(maxWidth: .infinity, alignment: .leading)
        .cardGlass()
    }
}

// MARK: - Colors Section

struct ColorsSection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: DS.Spacing.xl) {
            Text("Colors")
                .font(DS.Typography.displayMedium)

            ColorGroup(title: "Brand Colors", colors: [
                ("Brand Orange", DS.Colors.brandOrange),
                ("Brand Blue", DS.Colors.brandBlue)
            ])

            ColorGroup(title: "Semantic Colors", colors: [
                ("Success", DS.Colors.success),
                ("Error", DS.Colors.error),
                ("Warning", DS.Colors.warning),
                ("Info", DS.Colors.info)
            ])

            ColorGroup(title: "Text Colors", colors: [
                ("Primary", DS.Colors.textPrimary),
                ("Secondary", DS.Colors.textSecondary),
                ("Tertiary", DS.Colors.textTertiary)
            ])

            ColorGroup(title: "Icon Colors", colors: [
                ("Bucket", DS.Colors.iconBucket),
                ("Folder", DS.Colors.iconFolder),
                ("File", DS.Colors.iconFile)
            ])

            ColorGroup(title: "File Type Colors", colors: [
                ("Image", DS.Colors.fileTypeImage),
                ("Video", DS.Colors.fileTypeVideo),
                ("Document", DS.Colors.fileTypeDocument),
                ("Code", DS.Colors.fileTypeCode),
                ("Archive", DS.Colors.fileTypeArchive),
                ("Audio", DS.Colors.fileTypeAudio)
            ])
        }
    }
}

struct ColorGroup: View {
    let title: String
    let colors: [(String, Color)]

    var body: some View {
        VStack(alignment: .leading, spacing: DS.Spacing.md) {
            Text(title)
                .font(DS.Typography.headline)
                .foregroundColor(DS.Colors.textPrimary)

            LazyVGrid(columns: [
                GridItem(.adaptive(minimum: 100), spacing: DS.Spacing.md)
            ], spacing: DS.Spacing.md) {
                ForEach(colors, id: \.0) { name, color in
                    VStack(spacing: DS.Spacing.xs) {
                        RoundedRectangle(cornerRadius: DS.Spacing.CornerRadius.small)
                            .fill(color)
                            .frame(height: 60)
                            .overlay(
                                RoundedRectangle(cornerRadius: DS.Spacing.CornerRadius.small)
                                    .strokeBorder(DS.Colors.borderPrimary, lineWidth: 1)
                            )

                        Text(name)
                            .font(DS.Typography.caption)
                            .foregroundColor(DS.Colors.textSecondary)
                            .multilineTextAlignment(.center)
                    }
                }
            }
        }
        .padding(DS.Spacing.md)
        .cardGlass()
    }
}

// MARK: - Typography Section

struct TypographyStyleGuideSection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: DS.Spacing.xl) {
            Text("Typography")
                .font(DS.Typography.displayMedium)

            TypographyGroup(title: "Display Styles", samples: [
                ("Display Large", DS.Typography.displayLarge, "34pt Bold"),
                ("Display Medium", DS.Typography.displayMedium, "28pt Bold"),
                ("Display Small", DS.Typography.displaySmall, "22pt Semibold")
            ])

            TypographyGroup(title: "Headline Styles", samples: [
                ("Headline", DS.Typography.headline, "17pt Semibold"),
                ("Subheadline", DS.Typography.subheadline, "15pt Medium")
            ])

            TypographyGroup(title: "Body Styles", samples: [
                ("Body", DS.Typography.body, "13pt Regular"),
                ("Body Emphasized", DS.Typography.bodyEmphasized, "13pt Medium"),
                ("Body Monospaced", DS.Typography.bodyMonospaced, "13pt Monospaced")
            ])

            TypographyGroup(title: "Caption Styles", samples: [
                ("Caption", DS.Typography.caption, "11pt Regular"),
                ("Caption Emphasized", DS.Typography.captionEmphasized, "11pt Medium"),
                ("Caption 2", DS.Typography.caption2, "10pt Regular")
            ])
        }
    }
}

struct TypographyGroup: View {
    let title: String
    let samples: [(String, Font, String)]

    var body: some View {
        VStack(alignment: .leading, spacing: DS.Spacing.md) {
            Text(title)
                .font(DS.Typography.headline)
                .foregroundColor(DS.Colors.textPrimary)

            VStack(alignment: .leading, spacing: DS.Spacing.sm) {
                ForEach(samples, id: \.0) { name, font, description in
                    VStack(alignment: .leading, spacing: DS.Spacing.xxs) {
                        Text(name)
                            .font(font)
                            .foregroundColor(DS.Colors.textPrimary)

                        Text(description)
                            .font(DS.Typography.caption2)
                            .foregroundColor(DS.Colors.textTertiary)
                    }
                    .padding(DS.Spacing.sm)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(DS.Colors.hoverBackground)
                    .cornerRadius(.small)
                }
            }
        }
        .padding(DS.Spacing.md)
        .cardGlass()
    }
}

// MARK: - Spacing Section

struct SpacingStyleGuideSection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: DS.Spacing.xl) {
            Text("Spacing")
                .font(DS.Typography.displayMedium)

            VStack(alignment: .leading, spacing: DS.Spacing.md) {
                Text("8-Point Grid System")
                    .font(DS.Typography.headline)

                VStack(alignment: .leading, spacing: DS.Spacing.sm) {
                    SpacingBarDisplay(label: "XXS", value: DS.Spacing.xxs, points: "2pt")
                    SpacingBarDisplay(label: "XS", value: DS.Spacing.xs, points: "4pt")
                    SpacingBarDisplay(label: "SM", value: DS.Spacing.sm, points: "8pt")
                    SpacingBarDisplay(label: "MD", value: DS.Spacing.md, points: "12pt")
                    SpacingBarDisplay(label: "LG", value: DS.Spacing.lg, points: "16pt")
                    SpacingBarDisplay(label: "XL", value: DS.Spacing.xl, points: "24pt")
                    SpacingBarDisplay(label: "XXL", value: DS.Spacing.xxl, points: "32pt")
                    SpacingBarDisplay(label: "XXXL", value: DS.Spacing.xxxl, points: "48pt")
                }
            }
            .padding(DS.Spacing.md)
            .cardGlass()
        }
    }
}

struct SpacingBarDisplay: View {
    let label: String
    let value: CGFloat
    let points: String

    var body: some View {
        HStack(spacing: DS.Spacing.md) {
            Text(label)
                .font(DS.Typography.bodyEmphasized)
                .foregroundColor(DS.Colors.textPrimary)
                .frame(width: 50, alignment: .leading)

            Rectangle()
                .fill(DS.Colors.brandBlue)
                .frame(width: value * 2, height: 24)

            Text(points)
                .font(DS.Typography.caption)
                .foregroundColor(DS.Colors.textSecondary)
        }
    }
}

// MARK: - Effects Section

struct EffectsSection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: DS.Spacing.xl) {
            Text("Effects")
                .font(DS.Typography.displayMedium)

            VStack(alignment: .leading, spacing: DS.Spacing.md) {
                Text("Liquid Glass Materials")
                    .font(DS.Typography.headline)

                LazyVGrid(columns: [
                    GridItem(.flexible()),
                    GridItem(.flexible())
                ], spacing: DS.Spacing.md) {
                    EffectCard(title: "Ultra Thin", thickness: .ultraThin)
                    EffectCard(title: "Thin", thickness: .thin)
                    EffectCard(title: "Regular", thickness: .regular)
                    EffectCard(title: "Thick", thickness: .thick)
                    EffectCard(title: "Ultra Thick", thickness: .ultraThick)
                }
            }

            VStack(alignment: .leading, spacing: DS.Spacing.md) {
                Text("Shadow Effects")
                    .font(DS.Typography.headline)

                LazyVGrid(columns: [
                    GridItem(.flexible()),
                    GridItem(.flexible())
                ], spacing: DS.Spacing.md) {
                    ShadowCard(title: "Subtle", style: .subtle)
                    ShadowCard(title: "Medium", style: .medium)
                    ShadowCard(title: "Prominent", style: .prominent)
                    ShadowCard(title: "Large", style: .large)
                }
            }
        }
    }
}

struct EffectCard: View {
    let title: String
    let thickness: DSEffects.MaterialThickness

    var body: some View {
        Text(title)
            .font(DS.Typography.body)
            .foregroundColor(DS.Colors.textPrimary)
            .padding(DS.Spacing.lg)
            .frame(maxWidth: .infinity)
            .glassEffect(thickness: thickness)
            .cornerRadius(.medium)
    }
}

struct ShadowCard: View {
    let title: String
    let style: DSEffects.ShadowStyle

    var body: some View {
        Text(title)
            .font(DS.Typography.body)
            .foregroundColor(DS.Colors.textPrimary)
            .padding(DS.Spacing.lg)
            .frame(maxWidth: .infinity)
            .background(Color.white)
            .cornerRadius(.medium)
            .shadowEffect(style)
    }
}

// MARK: - Icons Section

struct IconsSection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: DS.Spacing.xl) {
            Text("Icons")
                .font(DS.Typography.displayMedium)

            IconCategory(title: "Storage & Objects", icons: [
                ("Bucket", DS.Icons.bucket, DS.Colors.iconBucket),
                ("Folder", DS.Icons.folder, DS.Colors.iconFolder),
                ("File", DS.Icons.file, DS.Colors.iconFile),
                ("Image", DS.Icons.fileImage, DS.Colors.fileTypeImage),
                ("Video", DS.Icons.fileVideo, DS.Colors.fileTypeVideo),
                ("Code", DS.Icons.fileCode, DS.Colors.fileTypeCode)
            ])

            IconCategory(title: "Actions", icons: [
                ("Upload", DS.Icons.upload, DS.Colors.transferUpload),
                ("Download", DS.Icons.download, DS.Colors.transferDownload),
                ("Delete", DS.Icons.delete, DS.Colors.error),
                ("Refresh", DS.Icons.refresh, DS.Colors.iconActive),
                ("Copy", DS.Icons.copy, DS.Colors.iconDefault),
                ("Move", DS.Icons.move, DS.Colors.iconDefault)
            ])

            IconCategory(title: "Status", icons: [
                ("Success", DS.Icons.success, DS.Colors.success),
                ("Error", DS.Icons.error, DS.Colors.error),
                ("Warning", DS.Icons.error, DS.Colors.warning),
                ("Info", DS.Icons.info, DS.Colors.info)
            ])
        }
    }
}

struct IconCategory: View {
    let title: String
    let icons: [(String, String, Color)]

    var body: some View {
        VStack(alignment: .leading, spacing: DS.Spacing.md) {
            Text(title)
                .font(DS.Typography.headline)
                .foregroundColor(DS.Colors.textPrimary)

            LazyVGrid(columns: [
                GridItem(.adaptive(minimum: 100), spacing: DS.Spacing.md)
            ], spacing: DS.Spacing.md) {
                ForEach(icons, id: \.0) { name, icon, color in
                    VStack(spacing: DS.Spacing.sm) {
                        Image(systemName: icon)
                            .font(.system(size: DS.Spacing.Icon.extraLarge))
                            .foregroundColor(color)

                        Text(name)
                            .font(DS.Typography.caption)
                            .foregroundColor(DS.Colors.textSecondary)
                    }
                    .padding(DS.Spacing.sm)
                    .frame(maxWidth: .infinity)
                    .background(DS.Colors.hoverBackground)
                    .cornerRadius(.small)
                }
            }
        }
        .padding(DS.Spacing.md)
        .cardGlass()
    }
}

// MARK: - Components Section

struct ComponentsSection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: DS.Spacing.xl) {
            Text("Components")
                .font(DS.Typography.displayMedium)

            // Badges
            ComponentDemo(title: "Badges") {
                HStack(spacing: DS.Spacing.sm) {
                    DSBadge("3", color: DS.Colors.info)
                    DSBadge("New", color: DS.Colors.success)
                    DSBadge("Error", color: DS.Colors.error)
                    DSBadge("12", color: DS.Colors.textSecondary)
                }
            }

            // Chips
            ComponentDemo(title: "Chips") {
                HStack(spacing: DS.Spacing.sm) {
                    DSChip(text: "Images", isSelected: true, action: {})
                    DSChip(text: "Videos", isSelected: false, action: {})
                    DSChip(text: "Documents", isSelected: false, action: {})
                }
            }

            // Buttons
            ComponentDemo(title: "Buttons") {
                HStack(spacing: DS.Spacing.md) {
                    Button("Standard") {}
                        .styledButton()

                    Button("Prominent") {}
                        .styledButton(prominent: true)
                }
            }

            // Empty State
            ComponentDemo(title: "Empty State") {
                DSEmptyState(
                    icon: DS.Icons.bucket,
                    title: "No Items",
                    description: "Add items to get started",
                    action: {},
                    actionTitle: "Add Item"
                )
                .frame(height: 200)
            }
        }
    }
}

struct ComponentDemo<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: DS.Spacing.md) {
            Text(title)
                .font(DS.Typography.headline)
                .foregroundColor(DS.Colors.textPrimary)

            content
                .padding(DS.Spacing.md)
                .frame(maxWidth: .infinity, alignment: .leading)
                .cardGlass()
        }
    }
}

// MARK: - Preview

#if DEBUG
struct StyleGuideView_Previews: PreviewProvider {
    static var previews: some View {
        StyleGuideView()
            .frame(width: 1200, height: 800)
    }
}
#endif
