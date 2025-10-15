//
//  DesignSystem.swift
//  CloudflareR2ObjectStorageBrowser
//
//  Design System - Main Index
//  Comprehensive design system for macOS R2 Object Storage Browser
//  Implements Apple HIG 2025 - Liquid Glass design language
//
//  Created: 2025-10-14
//

import SwiftUI

/// Design System namespace - single access point for all design tokens
/// Usage: DS.Colors.brandOrange, DS.Typography.headline, DS.Spacing.lg
struct DS {
    // Re-export all design system components for convenient access
    typealias Colors = DSColors
    typealias Typography = DSTypography
    typealias Spacing = DSSpacing
    typealias Effects = DSEffects
    typealias Icons = DSIcons
}

// MARK: - Design System Documentation

/// Design System Overview
///
/// The CloudflareR2ObjectStorageBrowser Design System implements Apple's 2025
/// Liquid Glass design language for native macOS applications.
///
/// ## Key Principles
///
/// 1. **Liquid Glass Materials**
///    - Translucent backgrounds that reflect surroundings
///    - Multiple thickness levels (ultra thin to ultra thick)
///    - Adaptive vibrancy for foreground content
///
/// 2. **Dynamic Colors**
///    - Automatic Light/Dark mode support
///    - Respect system accent color
///    - Semantic color naming (success, error, warning, info)
///    - High contrast accessibility
///
/// 3. **SF Symbols 7**
///    - 6,900+ symbols with semantic naming
///    - Variable color and multicolor support
///    - Consistent sizing (14pt, 16pt, 20pt, 24pt, 48pt)
///    - Symbol animations (where appropriate)
///
/// 4. **Typography Hierarchy**
///    - San Francisco font family
///    - Dynamic Type support
///    - Proper weight usage (regular, medium, semibold, bold)
///    - Monospaced variants for code/data
///
/// 5. **8-Point Grid System**
///    - All spacing values are multiples of 8
///    - Consistent padding and margins
///    - Predictable layout behavior
///
/// 6. **Smooth Animations**
///    - 0.2-0.3s duration with easeInOut
///    - Spring animations for natural feel
///    - Respect reduced motion setting
///
/// ## Usage Examples
///
/// ```swift
/// // Colors
/// Text("Hello")
///     .foregroundColor(DS.Colors.textPrimary)
///     .background(DS.Colors.cardBackground)
///
/// // Typography
/// Text("Headline")
///     .font(DS.Typography.headline)
///
/// // Spacing
/// VStack(spacing: DS.Spacing.md) { ... }
///     .padding(DS.Spacing.lg)
///
/// // Effects
/// MyView()
///     .glassEffect()
///     .shadowEffect(.medium)
///
/// // Icons
/// DSIcon(name: DS.Icons.bucket, size: .large, color: DS.Colors.iconBucket)
/// ```
///
/// ## Accessibility
///
/// - All text meets WCAG AA contrast requirements
/// - VoiceOver labels on all interactive elements
/// - Keyboard navigation support
/// - Reduced motion support
/// - High contrast mode support
///
/// ## Performance
///
/// - Lazy loading for long lists
/// - Efficient view updates with proper state management
/// - Image caching for thumbnails
/// - Debounced search (300ms)
///

// MARK: - Common View Modifiers

extension View {
    /// Apply standard card styling with Liquid Glass effect
    func styledCard() -> some View {
        self
            .padding(DS.Spacing.Card.padding)
            .cardGlass()
            .shadowEffect(.subtle)
    }

    /// Apply standard button styling
    func styledButton(prominent: Bool = false) -> some View {
        self
            .buttonPadding(prominent: prominent)
            .background(prominent ? Color.accentColor : DS.Colors.hoverBackground)
            .foregroundColor(prominent ? .white : DS.Colors.textPrimary)
            .cornerRadius(.small)
            .hoverEffect()
    }

    /// Apply standard list item styling
    func styledListItem(isSelected: Bool = false) -> some View {
        self
            .listItemPadding()
            .background(isSelected ? DS.Colors.selectedBackground : Color.clear)
            .cornerRadius(.small)
            .selectionEffect(isSelected: isSelected)
    }

    /// Apply toolbar item styling
    func styledToolbarItem() -> some View {
        self
            .padding(DS.Spacing.xs)
            .background(DS.Colors.hoverBackground.opacity(0))
            .cornerRadius(.small)
            .hoverEffect(scale: 1.1)
    }
}

// MARK: - Reusable Components

/// Standard Section Header
struct DSSectionHeader: View {
    let title: String
    var action: (() -> Void)? = nil
    var actionIcon: String? = nil

    var body: some View {
        HStack {
            Text(title)
                .font(DS.Typography.headline)
                .foregroundColor(DS.Colors.textPrimary)

            Spacer()

            if let action = action, let icon = actionIcon {
                Button(action: action) {
                    Image(systemName: icon)
                        .font(.system(size: DS.Spacing.Icon.small))
                }
                .buttonStyle(.borderless)
                .styledToolbarItem()
            }
        }
        .padding(DS.Spacing.md)
        .background(DS.Colors.sidebarBackground)
    }
}

/// Standard Empty State
struct DSEmptyState: View {
    let icon: String
    let title: String
    let description: String
    var action: (() -> Void)? = nil
    var actionTitle: String? = nil

    var body: some View {
        VStack(spacing: DS.Spacing.lg) {
            Image(systemName: icon)
                .font(.system(size: DS.Spacing.Icon.massive))
                .foregroundColor(DS.Colors.textTertiary)

            VStack(spacing: DS.Spacing.xs) {
                Text(title)
                    .font(DS.Typography.headline)
                    .foregroundColor(DS.Colors.textPrimary)

                Text(description)
                    .font(DS.Typography.body)
                    .foregroundColor(DS.Colors.textSecondary)
                    .multilineTextAlignment(.center)
            }

            if let action = action, let actionTitle = actionTitle {
                Button(action: action) {
                    Text(actionTitle)
                }
                .buttonStyle(.borderedProminent)
            }
        }
        .padding(DS.Spacing.xxl)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

/// Standard Loading Indicator
struct DSLoadingIndicator: View {
    let message: String?

    init(message: String? = nil) {
        self.message = message
    }

    var body: some View {
        VStack(spacing: DS.Spacing.md) {
            ProgressView()
                .scaleEffect(1.2)
                .controlSize(.large)

            if let message = message {
                Text(message)
                    .font(DS.Typography.caption)
                    .foregroundColor(DS.Colors.textSecondary)
            }
        }
        .padding(DS.Spacing.xl)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

/// Standard Error View
struct DSErrorView: View {
    let error: String
    var retry: (() -> Void)? = nil

    var body: some View {
        VStack(spacing: DS.Spacing.lg) {
            StatusIcon(status: .error, size: .extraLarge)

            Text("Error")
                .font(DS.Typography.headline)
                .foregroundColor(DS.Colors.textPrimary)

            Text(error)
                .font(DS.Typography.body)
                .foregroundColor(DS.Colors.textSecondary)
                .multilineTextAlignment(.center)

            if let retry = retry {
                Button(action: retry) {
                    Label("Retry", systemImage: DS.Icons.refresh)
                }
                .buttonStyle(.borderedProminent)
            }
        }
        .padding(DS.Spacing.xxl)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

/// Badge component for counts, status indicators
struct DSBadge: View {
    let text: String
    let color: Color

    init(_ text: String, color: Color = DS.Colors.textSecondary) {
        self.text = text
        self.color = color
    }

    var body: some View {
        Text(text)
            .font(DS.Typography.caption)
            .foregroundColor(.white)
            .padding(.horizontal, DS.Spacing.sm)
            .padding(.vertical, DS.Spacing.xxs)
            .background(color)
            .cornerRadius(.small)
    }
}

/// Chip component for filters, tags
struct DSChip: View {
    let text: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(text)
                .font(DS.Typography.caption)
                .foregroundColor(isSelected ? .white : DS.Colors.textPrimary)
                .padding(.horizontal, DS.Spacing.md)
                .padding(.vertical, DS.Spacing.xs)
                .background(isSelected ? Color.accentColor : DS.Colors.hoverBackground)
                .cornerRadius(.small)
        }
        .buttonStyle(.plain)
        .hoverEffect(scale: 1.05)
    }
}

/// Divider with text
struct DSDividerWithText: View {
    let text: String

    var body: some View {
        HStack(spacing: DS.Spacing.md) {
            Rectangle()
                .fill(DS.Colors.divider)
                .frame(height: 1)

            Text(text)
                .font(DS.Typography.caption)
                .foregroundColor(DS.Colors.textSecondary)

            Rectangle()
                .fill(DS.Colors.divider)
                .frame(height: 1)
        }
    }
}

// MARK: - Preview

#if DEBUG
struct DesignSystem_Previews: PreviewProvider {
    static var previews: some View {
        ScrollView {
            VStack(spacing: DS.Spacing.xl) {
                Text("Design System Showcase")
                    .font(DS.Typography.displayMedium)
                    .foregroundColor(DS.Colors.textPrimary)

                Divider().styled()

                // Section Header
                DSSectionHeader(
                    title: "Section Header",
                    action: { print("Action") },
                    actionIcon: DS.Icons.refresh
                )

                // Badges
                HStack(spacing: DS.Spacing.sm) {
                    DSBadge("3", color: DS.Colors.info)
                    DSBadge("New", color: DS.Colors.success)
                    DSBadge("Error", color: DS.Colors.error)
                }

                // Chips
                HStack(spacing: DS.Spacing.sm) {
                    DSChip(text: "Images", isSelected: true, action: {})
                    DSChip(text: "Videos", isSelected: false, action: {})
                    DSChip(text: "Documents", isSelected: false, action: {})
                }

                // Divider with text
                DSDividerWithText(text: "OR")

                // Empty State
                DSEmptyState(
                    icon: DS.Icons.bucket,
                    title: "No Buckets",
                    description: "Add a bucket to get started with R2 storage",
                    action: { print("Add") },
                    actionTitle: "Add Bucket"
                )
                .frame(height: 300)
                .styledCard()

                // Error View
                DSErrorView(
                    error: "Failed to load buckets. Check your connection.",
                    retry: { print("Retry") }
                )
                .frame(height: 300)
                .styledCard()

                // Loading Indicator
                DSLoadingIndicator(message: "Loading buckets...")
                    .frame(height: 200)
                    .styledCard()
            }
            .padding(DS.Spacing.xl)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(DS.Colors.windowBackground)
    }
}
#endif
