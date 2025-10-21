# WinUI 3 Application Assets

This directory contains the visual assets required for the Cloudflare R2 Browser Windows application. These assets are used for the application icon, store listing, and various UI elements.

## Required Assets

### 1. AppIcon.ico
**Purpose**: Main application icon displayed in the taskbar, window title bar, and file explorer.

**Specifications**:
- **Format**: ICO (Icon file)
- **Recommended sizes**: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256
- **Source**: 512x512 PNG (for best quality)
- **Color space**: sRGB
- **Transparency**: Supported

**Design Guidelines**:
- Use the Cloudflare R2 brand colors (orange/blue)
- Include a cloud storage or bucket icon metaphor
- Ensure the icon is recognizable at small sizes (16x16)
- Use a simple, clear design that works in both light and dark themes

**Creation Tools**:
- Adobe Illustrator/Photoshop
- Figma/Sketch
- Online converters: https://convertio.co/png-ico/

---

### 2. Square150x150Logo.png
**Purpose**: Medium tile for Windows Start Menu

**Specifications**:
- **Format**: PNG
- **Size**: 150x150 pixels
- **Scale**: 100% (1.0x)
- **Color space**: sRGB
- **Background**: Can be transparent or solid color
- **Target size**: 71x71 (displayed size)

**Additional Scales** (optional but recommended):
- 200% (2.0x): 300x300 pixels
- 400% (4.0x): 600x600 pixels

**Design Guidelines**:
- Clear branding with app name or icon
- High contrast for visibility
- Consider tile background color in app manifest

---

### 3. Square44x44Logo.png
**Purpose**: App list icon in Windows Settings and small Start Menu tile

**Specifications**:
- **Format**: PNG
- **Size**: 44x44 pixels
- **Scale**: 100% (1.0x)
- **Color space**: sRGB
- **Target size**: 16x16, 24x24, 32x32 (displayed sizes)

**Additional Scales** (optional but recommended):
- 125% (1.25x): 55x55 pixels
- 150% (1.5x): 66x66 pixels
- 200% (2.0x): 88x88 pixels
- 400% (4.0x): 176x176 pixels

**Design Guidelines**:
- Simplified version of main icon
- Must be recognizable at very small sizes
- Avoid fine details that won't be visible

---

### 4. Wide310x150Logo.png
**Purpose**: Wide tile for Windows Start Menu (when user chooses wide tile)

**Specifications**:
- **Format**: PNG
- **Size**: 310x150 pixels
- **Scale**: 100% (1.0x)
- **Color space**: sRGB
- **Aspect ratio**: 2.07:1

**Additional Scales** (optional but recommended):
- 200% (2.0x): 620x300 pixels
- 400% (4.0x): 1240x600 pixels

**Design Guidelines**:
- App name/logo on left or center
- Use brand colors
- Can include tagline or app description
- Leave some padding around edges (safe area)

---

### 5. SplashScreen.png
**Purpose**: Displayed when the application is launching

**Specifications**:
- **Format**: PNG
- **Size**: 620x300 pixels
- **Scale**: 100% (1.0x)
- **Color space**: sRGB
- **Background**: Defined in Package.appxmanifest

**Additional Scales** (optional but recommended):
- 125% (1.25x): 775x375 pixels
- 150% (1.5x): 930x450 pixels
- 200% (2.0x): 1240x600 pixels
- 400% (4.0x): 2480x1200 pixels

**Design Guidelines**:
- Center your logo/branding
- Simple, clean design
- Fast loading (keep file size reasonable)
- Consider the background color setting in the manifest

---

### 6. StoreLogo.png
**Purpose**: Microsoft Store listing icon

**Specifications**:
- **Format**: PNG
- **Size**: 50x50 pixels
- **Scale**: 100% (1.0x)
- **Color space**: sRGB
- **Transparency**: Recommended

**Additional Scales** (optional but recommended):
- 125% (1.25x): 63x63 pixels
- 150% (1.5x): 75x75 pixels
- 200% (2.0x): 100x100 pixels
- 400% (4.0x): 200x200 pixels

**Design Guidelines**:
- Should match your app's branding
- Clear and recognizable
- Works well on various backgrounds

---

## Asset Creation Workflow

### Recommended Approach
1. **Create a master icon** at 512x512 or 1024x1024 in vector format (SVG/AI)
2. **Export to required sizes** using design software or automated tools
3. **Optimize PNGs** using tools like TinyPNG or ImageOptim
4. **Generate ICO file** with multiple sizes embedded

### Tools

**Design**:
- Adobe Illustrator/Photoshop
- Figma (https://figma.com)
- Sketch (macOS)
- Inkscape (Free, open-source)

**Conversion**:
- ImageMagick (Command-line)
- Online ICO Converter: https://convertio.co/png-ico/
- Real Favicon Generator: https://realfavicongenerator.net/

**Optimization**:
- TinyPNG: https://tinypng.com/
- ImageOptim (macOS): https://imageoptim.com/
- Squoosh: https://squoosh.app/

### ImageMagick Examples

Generate ICO file from PNG:
```bash
convert icon-512.png -define icon:auto-resize=256,128,64,48,32,16 AppIcon.ico
```

Resize for specific dimensions:
```bash
# Square150x150Logo
convert icon-512.png -resize 150x150 Square150x150Logo.png
convert icon-512.png -resize 300x300 Square150x150Logo.scale-200.png

# Square44x44Logo
convert icon-512.png -resize 44x44 Square44x44Logo.png
convert icon-512.png -resize 88x88 Square44x44Logo.scale-200.png

# Wide310x150Logo
convert icon-512.png -resize 310x150 -gravity center -extent 310x150 Wide310x150Logo.png

# SplashScreen
convert icon-512.png -resize 620x300 -gravity center -extent 620x300 SplashScreen.png

# StoreLogo
convert icon-512.png -resize 50x50 StoreLogo.png
```

---

## Package.appxmanifest Configuration

After creating the assets, update the `Package.appxmanifest` file:

```xml
<Applications>
  <Application Id="App" Executable="$targetnametoken$.exe" EntryPoint="$targetentrypoint$">
    <uap:VisualElements
      DisplayName="Cloudflare R2 Browser"
      Description="Browse and manage your Cloudflare R2 object storage"
      BackgroundColor="transparent"
      Square150x150Logo="Assets\Square150x150Logo.png"
      Square44x44Logo="Assets\Square44x44Logo.png">

      <uap:DefaultTile Wide310x150Logo="Assets\Wide310x150Logo.png" />
      <uap:SplashScreen Image="Assets\SplashScreen.png" />
    </uap:VisualElements>
  </Application>
</Applications>
```

---

## Branding Guidelines

### Color Palette (Cloudflare R2 Theme)
- **Primary**: `#F38020` (Orange)
- **Secondary**: `#0051C3` (Blue)
- **Accent**: `#FFB366` (Light Orange)
- **Background**: `#1F1F1F` (Dark) / `#FFFFFF` (Light)

### Icon Design Principles
1. **Simple and recognizable**: Use clear shapes and minimal details
2. **Scalable**: Design should work from 16x16 to 512x512
3. **Consistent**: All assets should use the same design language
4. **Accessible**: High contrast for visibility
5. **Platform-appropriate**: Follow Windows design guidelines

---

## Checklist

Before deploying the application, ensure:

- [ ] All PNG files are optimized (compressed)
- [ ] ICO file contains multiple sizes (16, 32, 48, 64, 128, 256)
- [ ] Assets follow Windows design guidelines
- [ ] High DPI versions (200%, 400%) are provided
- [ ] Splash screen loads quickly (< 100KB)
- [ ] Assets are referenced correctly in Package.appxmanifest
- [ ] Icons are visible in both light and dark themes
- [ ] Store logo meets Microsoft Store requirements

---

## Resources

- [Windows App Icon Guidelines](https://docs.microsoft.com/en-us/windows/apps/design/style/iconography)
- [App Icons and Logos](https://docs.microsoft.com/en-us/windows/apps/design/style/app-icons-and-logos)
- [Visual Assets for Windows Apps](https://docs.microsoft.com/en-us/windows/apps/design/style/app-icons-and-logos)
- [Microsoft Store Asset Requirements](https://docs.microsoft.com/en-us/windows/uwp/publish/app-screenshots-and-images)

---

## Contact

For questions about asset creation or branding guidelines, please refer to the project documentation or contact the design team.
