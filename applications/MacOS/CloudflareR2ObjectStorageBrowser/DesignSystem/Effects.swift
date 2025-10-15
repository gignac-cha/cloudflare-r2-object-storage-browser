//
//  Effects.swift
//  CloudflareR2ObjectStorageBrowser
//
//  Design System - Effects
//  Liquid Glass materials, vibrancy, and visual effects
//  Follows Apple HIG 2025 - Liquid Glass design language
//

import SwiftUI

/// Visual effects system for Liquid Glass design
/// Includes materials, vibrancy, shadows, and blur effects
struct DSEffects {

    // MARK: - Liquid Glass Materials

    /// Material thickness levels
    enum MaterialThickness {
        case ultraThin
        case thin
        case regular
        case thick
        case ultraThick

        var material: Material {
            switch self {
            case .ultraThin: return .ultraThin
            case .thin: return .thin
            case .regular: return .regular
            case .thick: return .thick
            case .ultraThick: return .ultraThick
            }
        }
    }

    // MARK: - Vibrancy Levels

    /// Vibrancy enhances foreground content on glass backgrounds
    enum VibrancyLevel {
        case primary
        case secondary
        case tertiary
        case separator

        @available(macOS 14.0, *)
        var shader: Shader? {
            // Note: SwiftUI Shaders require macOS 14+
            // For production, implement custom Metal shaders
            return nil
        }
    }

    // MARK: - Shadow Styles

    /// Shadow presets for depth and elevation
    enum ShadowStyle {
        case subtle      // Minimal depth
        case medium      // Standard elevation
        case prominent   // High elevation
        case large       // Maximum depth

        var radius: CGFloat {
            switch self {
            case .subtle: return 2
            case .medium: return 8
            case .prominent: return 16
            case .large: return 24
            }
        }

        var offset: CGSize {
            switch self {
            case .subtle: return CGSize(width: 0, height: 1)
            case .medium: return CGSize(width: 0, height: 2)
            case .prominent: return CGSize(width: 0, height: 4)
            case .large: return CGSize(width: 0, height: 8)
            }
        }

        var opacity: Double {
            switch self {
            case .subtle: return 0.05
            case .medium: return 0.1
            case .prominent: return 0.15
            case .large: return 0.2
            }
        }
    }

    // MARK: - Blur Styles

    /// Blur intensity levels
    enum BlurIntensity {
        case light
        case medium
        case heavy

        var radius: CGFloat {
            switch self {
            case .light: return 8
            case .medium: return 16
            case .heavy: return 32
            }
        }
    }
}

// MARK: - Liquid Glass View Modifiers

extension View {
    /// Apply Liquid Glass effect (translucent material with blur)
    /// This is the signature effect of 2025 macOS design
    func glassEffect(
        thickness: DSEffects.MaterialThickness = .regular,
        tint: Color? = nil
    ) -> some View {
        self
            .background(thickness.material)
            .background(
                tint?.opacity(0.05) ?? Color.clear
            )
    }

    /// Apply glass effect with vibrancy for foreground content
    func glassVibrancy(level: DSEffects.VibrancyLevel = .primary) -> some View {
        switch level {
        case .primary:
            return AnyView(self.foregroundStyle(.primary))
        case .secondary:
            return AnyView(self.foregroundStyle(.secondary))
        case .tertiary:
            return AnyView(self.foregroundStyle(.tertiary))
        case .separator:
            return AnyView(self.foregroundColor(DSColors.divider))
        }
    }

    /// Apply sidebar glass effect (translucent with slight tint)
    func sidebarGlass() -> some View {
        self
            .background(.ultraThinMaterial)
            .background(DSColors.sidebarBackground.opacity(0.3))
    }

    /// Apply toolbar glass effect
    func toolbarGlass() -> some View {
        self
            .background(.regularMaterial)
            .background(DSColors.windowBackground.opacity(0.5))
    }

    /// Apply card/panel glass effect
    func cardGlass() -> some View {
        self
            .background(.regularMaterial)
            .background(DSColors.cardBackground)
            .clipShape(RoundedRectangle(cornerRadius: DSSpacing.CornerRadius.medium, style: .continuous))
    }

    /// Apply popover glass effect (more opaque)
    func popoverGlass() -> some View {
        self
            .background(.thickMaterial)
            .clipShape(RoundedRectangle(cornerRadius: DSSpacing.CornerRadius.large, style: .continuous))
    }
}

// MARK: - Shadow View Modifiers

extension View {
    /// Apply standard shadow effect
    func shadowEffect(_ style: DSEffects.ShadowStyle = .medium) -> some View {
        self.shadow(
            color: Color.black.opacity(style.opacity),
            radius: style.radius,
            x: style.offset.width,
            y: style.offset.height
        )
    }

    /// Apply inner shadow (for pressed states)
    func innerShadow() -> some View {
        self.overlay(
            RoundedRectangle(cornerRadius: DSSpacing.CornerRadius.medium, style: .continuous)
                .stroke(Color.black.opacity(0.1), lineWidth: 1)
                .blur(radius: 2)
                .offset(x: 0, y: 1)
                .mask(
                    RoundedRectangle(cornerRadius: DSSpacing.CornerRadius.medium, style: .continuous)
                        .fill(
                            LinearGradient(
                                colors: [.clear, .white],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                )
        )
    }

    /// Apply glow effect (for focus/active states)
    func glowEffect(color: Color = .accentColor, radius: CGFloat = 8) -> some View {
        self.shadow(color: color.opacity(0.5), radius: radius, x: 0, y: 0)
    }
}

// MARK: - Hover & Interaction Effects

extension View {
    /// Apply hover effect (scale + opacity)
    func hoverEffect(scale: CGFloat = 1.05) -> some View {
        self.modifier(HoverEffectModifier(scale: scale))
    }

    /// Apply press effect (scale down)
    func pressEffect() -> some View {
        self.modifier(PressEffectModifier())
    }

    /// Apply selection effect (border + background)
    func selectionEffect(isSelected: Bool) -> some View {
        self
            .background(
                isSelected ? DSColors.selectedBackground : Color.clear
            )
            .overlay(
                RoundedRectangle(cornerRadius: DSSpacing.CornerRadius.small, style: .continuous)
                    .strokeBorder(
                        isSelected ? Color.accentColor : Color.clear,
                        lineWidth: DSSpacing.Border.regular
                    )
            )
    }
}

// MARK: - Hover Effect Modifier

struct HoverEffectModifier: ViewModifier {
    let scale: CGFloat
    @State private var isHovering = false

    func body(content: Content) -> some View {
        content
            .scaleEffect(isHovering ? scale : 1.0)
            .animation(.easeInOut(duration: 0.15), value: isHovering)
            .onHover { hovering in
                isHovering = hovering
            }
    }
}

// MARK: - Press Effect Modifier

struct PressEffectModifier: ViewModifier {
    @State private var isPressed = false

    func body(content: Content) -> some View {
        content
            .scaleEffect(isPressed ? 0.95 : 1.0)
            .opacity(isPressed ? 0.8 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: isPressed)
            .simultaneousGesture(
                DragGesture(minimumDistance: 0)
                    .onChanged { _ in isPressed = true }
                    .onEnded { _ in isPressed = false }
            )
    }
}

// MARK: - Blur Background Modifier

extension View {
    /// Apply background blur effect
    func blurBackground(intensity: DSEffects.BlurIntensity = .medium) -> some View {
        self.background(
            Rectangle()
                .fill(.ultraThinMaterial)
                .blur(radius: intensity.radius)
        )
    }
}

// MARK: - Gradient Effects

struct DSGradients {
    /// Glass gradient overlay (subtle highlight)
    static let glassHighlight = LinearGradient(
        colors: [
            Color.white.opacity(0.15),
            Color.white.opacity(0.05),
            Color.clear
        ],
        startPoint: .top,
        endPoint: .bottom
    )

    /// Shimmer gradient (for loading states)
    static let shimmer = LinearGradient(
        colors: [
            Color.white.opacity(0.0),
            Color.white.opacity(0.3),
            Color.white.opacity(0.0)
        ],
        startPoint: .leading,
        endPoint: .trailing
    )

    /// Progress gradient (for transfer bars)
    static let progress = LinearGradient(
        colors: [
            DSColors.brandBlue,
            DSColors.brandBlue.opacity(0.7)
        ],
        startPoint: .leading,
        endPoint: .trailing
    )

    /// Success gradient
    static let success = LinearGradient(
        colors: [
            DSColors.success,
            DSColors.success.opacity(0.8)
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    /// Error gradient
    static let error = LinearGradient(
        colors: [
            DSColors.error,
            DSColors.error.opacity(0.8)
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
}

// MARK: - Animation Presets

struct DSAnimations {
    /// Quick spring animation (UI interactions)
    static let quick = Animation.spring(response: 0.3, dampingFraction: 0.7)

    /// Smooth ease animation (transitions)
    static let smooth = Animation.easeInOut(duration: 0.25)

    /// Bouncy spring animation (playful interactions)
    static let bouncy = Animation.spring(response: 0.5, dampingFraction: 0.6)

    /// Gentle animation (subtle changes)
    static let gentle = Animation.easeInOut(duration: 0.4)

    /// Snappy animation (button presses)
    static let snappy = Animation.easeInOut(duration: 0.15)
}

// MARK: - Transition Effects

extension AnyTransition {
    /// Slide from bottom with fade
    static var slideFromBottom: AnyTransition {
        .asymmetric(
            insertion: .move(edge: .bottom).combined(with: .opacity),
            removal: .move(edge: .bottom).combined(with: .opacity)
        )
    }

    /// Scale with fade
    static var scaleAndFade: AnyTransition {
        .scale(scale: 0.9).combined(with: .opacity)
    }

    /// Slide from trailing with fade
    static var slideFromTrailing: AnyTransition {
        .asymmetric(
            insertion: .move(edge: .trailing).combined(with: .opacity),
            removal: .move(edge: .trailing).combined(with: .opacity)
        )
    }
}

// MARK: - Preview

#if DEBUG
struct DSEffects_Previews: PreviewProvider {
    static var previews: some View {
        ScrollView {
            VStack(spacing: DSSpacing.xl) {
                // Liquid Glass Materials
                EffectSection(title: "Liquid Glass Materials") {
                    GlassCard(title: "Ultra Thin", thickness: .ultraThin)
                    GlassCard(title: "Thin", thickness: .thin)
                    GlassCard(title: "Regular", thickness: .regular)
                    GlassCard(title: "Thick", thickness: .thick)
                    GlassCard(title: "Ultra Thick", thickness: .ultraThick)
                }

                // Shadows
                EffectSection(title: "Shadow Effects") {
                    ShadowCard(title: "Subtle", style: .subtle)
                    ShadowCard(title: "Medium", style: .medium)
                    ShadowCard(title: "Prominent", style: .prominent)
                    ShadowCard(title: "Large", style: .large)
                }

                // Gradients
                EffectSection(title: "Gradients") {
                    GradientCard(title: "Glass Highlight", gradient: DSGradients.glassHighlight)
                    GradientCard(title: "Progress", gradient: DSGradients.progress)
                    GradientCard(title: "Success", gradient: DSGradients.success)
                    GradientCard(title: "Error", gradient: DSGradients.error)
                }

                // Interactive Effects
                EffectSection(title: "Interactive Effects") {
                    HStack(spacing: DSSpacing.md) {
                        InteractiveCard(title: "Hover Effect")
                            .hoverEffect()

                        InteractiveCard(title: "Press Effect")
                            .pressEffect()

                        InteractiveCard(title: "Glow Effect")
                            .glowEffect()
                    }
                }
            }
            .padding(DSSpacing.xl)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(
            Image(systemName: "cloud.fill")
                .resizable()
                .scaledToFill()
                .foregroundColor(DSColors.brandBlue.opacity(0.1))
                .blur(radius: 50)
        )
    }
}

struct EffectSection<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: DSSpacing.md) {
            Text(title)
                .font(DSTypography.headline)
                .foregroundColor(DSColors.textPrimary)

            content
        }
    }
}

struct GlassCard: View {
    let title: String
    let thickness: DSEffects.MaterialThickness

    var body: some View {
        Text(title)
            .font(DSTypography.body)
            .foregroundColor(DSColors.textPrimary)
            .padding(DSSpacing.md)
            .frame(maxWidth: .infinity)
            .glassEffect(thickness: thickness)
            .cornerRadius(.medium)
    }
}

struct GradientCard: View {
    let title: String
    let gradient: LinearGradient

    var body: some View {
        Text(title)
            .font(DSTypography.body)
            .foregroundColor(.white)
            .padding(DSSpacing.md)
            .frame(maxWidth: .infinity)
            .background(gradient)
            .cornerRadius(.medium)
    }
}

struct InteractiveCard: View {
    let title: String

    var body: some View {
        Text(title)
            .font(DSTypography.body)
            .foregroundColor(DSColors.textPrimary)
            .padding(DSSpacing.md)
            .frame(maxWidth: .infinity)
            .cardGlass()
    }
}
#endif
