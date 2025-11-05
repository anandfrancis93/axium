# PWA Icons Guide

## Required Icons

For full PWA support, you need to generate the following icon sizes:

- `icon-192.png` - 192x192 pixels
- `icon-512.png` - 512x512 pixels
- `favicon.ico` - Standard favicon

## How to Generate Icons

### Option 1: Using Online Tool (Recommended)

1. Go to [https://favicon.io/favicon-converter/](https://favicon.io/favicon-converter/)
2. Upload a square image (at least 512x512)
3. Download the generated package
4. Copy the following files to the `public/` folder:
   - `android-chrome-192x192.png` → rename to `icon-192.png`
   - `android-chrome-512x512.png` → rename to `icon-512.png`
   - `favicon.ico` → keep as is

### Option 2: Using Figma/Design Tool

1. Create a 512x512px artboard
2. Design your icon with the Axium brand:
   - Background: `#0a0a0a`
   - Use gradient from `#3b82f6` to `#8b5cf6`
   - Include a geometric shape or letter "A"
3. Export as PNG at 512x512
4. Use a tool like [https://realfavicongenerator.net/](https://realfavicongenerator.net/) to generate all sizes

### Option 3: Using ImageMagick (Command Line)

If you have a source image `icon-source.png`:

```bash
# Generate 192x192
magick icon-source.png -resize 192x192 icon-192.png

# Generate 512x512
magick icon-source.png -resize 512x512 icon-512.png

# Generate favicon.ico (multiple sizes in one file)
magick icon-source.png -define icon:auto-resize=64,48,32,16 favicon.ico
```

## Current Status

✅ `favicon.svg` - SVG favicon (works in modern browsers)
⬜ `icon-192.png` - **TODO: Generate this**
⬜ `icon-512.png` - **TODO: Generate this**
⬜ `favicon.ico` - **TODO: Generate this**

## Design Guidelines

### Colors
- **Background**: `#0a0a0a` (dark neumorphic)
- **Primary**: `#3b82f6` (blue)
- **Secondary**: `#8b5cf6` (purple)
- **Accent**: Gradient from blue to purple

### Style
- Neumorphic with subtle shadows
- Minimalist and modern
- Clear at small sizes
- No complex details (keep it simple)

### Inspiration
The icon should represent:
- 🧠 Intelligence/Learning
- 📈 Growth/Progress
- ⚡ Adaptive/Smart

## Testing PWA

After adding icons, test your PWA:

1. **Desktop Chrome**:
   - Open DevTools
   - Go to Application tab
   - Check "Manifest" section
   - Verify all icons load

2. **Mobile**:
   - Open the app in mobile browser
   - Check if "Add to Home Screen" works
   - Verify the icon appears correctly

3. **Lighthouse**:
   - Run Lighthouse audit
   - Check PWA score
   - Should have all icons and manifest properly configured

## Temporary Solution

The `favicon.svg` will work for now, but for full PWA support and better compatibility, generate the PNG icons as soon as possible.
