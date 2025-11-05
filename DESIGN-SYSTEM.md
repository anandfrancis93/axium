# Neumorphic Design System

This document describes the neumorphic (soft UI) design system implemented for Axium.

## Background Color

The entire app uses a **#0a0a0a** background - a very dark, nearly black color that serves as the base for the neumorphic effect.

## Design Philosophy

Neumorphism creates a soft, extruded plastic look using subtle shadows and highlights. Elements appear to either:
- **Rise** from the surface (raised/elevated)
- **Sink** into the surface (inset/pressed)

This creates depth and tactile feedback without harsh borders or high contrast.

## Color Palette

### Base Colors
```css
--background: #0a0a0a         /* Main background */
--foreground: #e0e0e0         /* Primary text */
--surface: #0a0a0a            /* Card/component surface */
--surface-raised: #0f0f0f     /* Slightly elevated surface */
--surface-elevated: #141414   /* More elevated surface */
```

### Shadow Colors
```css
--shadow-light: #1a1a1a       /* Highlight shadow (lighter) */
--shadow-dark: #000000        /* Dark shadow (darker) */
```

### Text Colors
```css
--text-primary: #e0e0e0       /* Main text */
--text-secondary: #a0a0a0     /* Secondary text */
--text-tertiary: #707070      /* Tertiary/muted text */
```

### Accent Colors
```css
--accent-primary: #3b82f6     /* Blue - primary actions */
--accent-secondary: #8b5cf6   /* Purple - secondary actions */
--accent-success: #10b981     /* Green - success states */
--accent-warning: #f59e0b     /* Amber - warnings */
--accent-error: #ef4444       /* Red - errors */
```

## Elevation Levels

Three levels of elevation for different UI elements:

```css
--elevation-1: 4px 4px 8px #000, -4px -4px 8px #1a1a1a
/* Usage: Buttons, small cards */

--elevation-2: 8px 8px 16px #000, -8px -8px 16px #1a1a1a
/* Usage: Cards, containers */

--elevation-3: 12px 12px 24px #000, -12px -12px 24px #1a1a1a
/* Usage: Modals, emphasized elements */
```

## Inset Effect

For pressed/sunken elements:

```css
--inset: inset 4px 4px 8px #000, inset -4px -4px 8px #1a1a1a
/* Usage: Input fields, pressed buttons */
```

## Component Classes

### Cards

**.neuro-card**
- Background: `#0a0a0a`
- Border radius: `1rem`
- Shadow: `elevation-2`
- Padding: `1.5rem`
- Hover: Elevates to `elevation-3`

```html
<div class="neuro-card">
  <!-- Content -->
</div>
```

### Buttons

**.neuro-btn** (Default)
- Background: `#0a0a0a`
- Shadow: `elevation-1`
- Hover: Elevates and moves up slightly
- Active: Becomes inset (pressed effect)

```html
<button class="neuro-btn">Click Me</button>
```

**.neuro-btn-primary** (Primary Action)
- Gradient background: Blue to darker blue
- White text
- Elevated shadow

```html
<button class="neuro-btn-primary">Primary Action</button>
```

**.neuro-btn-secondary** (Secondary Action)
- Gradient background: Purple
- White text

```html
<button class="neuro-btn-secondary">Secondary</button>
```

### Input Fields

**.neuro-input**
- Background: `#0a0a0a`
- Inset shadow (sunken appearance)
- Focus: Blue ring around inset

```html
<input type="text" class="neuro-input" placeholder="Enter text..." />
```

### Containers

**.neuro-container**
- Large container with padding
- Border radius: `1.5rem`
- Shadow: `elevation-2`

```html
<div class="neuro-container">
  <!-- Main content area -->
</div>
```

### Surfaces

**.neuro-raised**
- Slightly elevated surface
- Border radius: `1rem`
- Shadow: `elevation-1`

```html
<div class="neuro-raised">
  <!-- Raised content -->
</div>
```

**.neuro-inset**
- Sunken/pressed surface
- Inset shadow
- Border radius: `0.75rem`

```html
<div class="neuro-inset">
  <!-- Inset content -->
</div>
```

### Stats Cards

**.neuro-stat**
- Centered text
- Shadow: `elevation-1`
- Hover: Elevates and moves up
- Perfect for dashboard statistics

```html
<div class="neuro-stat">
  <div class="text-sm text-blue-400">Statistic Label</div>
  <div class="text-4xl font-bold">42</div>
</div>
```

### Progress Bars

**.neuro-progress** + **.neuro-progress-bar**

```html
<div class="neuro-progress">
  <div class="neuro-progress-bar" style="width: 75%"></div>
</div>
```

### Toggle Switch

**.neuro-toggle** + **.neuro-toggle-thumb**

```html
<div class="neuro-toggle active">
  <div class="neuro-toggle-thumb"></div>
</div>
```

## Utility Classes

### Glow Effects

Add subtle glow to elements:

```html
<div class="glow-primary">Blue glow</div>
<div class="glow-secondary">Purple glow</div>
<div class="glow-success">Green glow</div>
```

## PWA Configuration

### Manifest
Located at `public/manifest.json`:
- App name: "Axium - Intelligent Learning Platform"
- Theme color: `#0a0a0a`
- Background color: `#0a0a0a`
- Display: standalone
- Shortcuts to Dashboard and Learning

### Meta Tags
In `app/layout.tsx`:
- Viewport configuration
- Theme color meta tag
- Apple web app capable
- Mobile web app capable

### Icons
See `public/ICONS.md` for icon generation guide.

Current status:
- ✅ favicon.svg (temporary)
- ⬜ icon-192.png (needs generation)
- ⬜ icon-512.png (needs generation)

## Usage Examples

### Login Page Pattern
```tsx
<div className="min-h-screen flex items-center justify-center"
     style={{ background: '#0a0a0a' }}>
  <div className="neuro-container">
    <div className="neuro-raised inline-block px-8 py-4">
      <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
        Axium
      </h1>
    </div>
    <button className="neuro-btn">Sign In</button>
  </div>
</div>
```

### Dashboard Card Pattern
```tsx
<div className="neuro-card">
  <h2 className="text-2xl text-gray-200 mb-4">Section Title</h2>

  <div className="grid grid-cols-3 gap-4">
    <div className="neuro-stat group">
      <div className="text-sm text-blue-400">Questions</div>
      <div className="text-4xl text-gray-200 group-hover:text-blue-400">42</div>
    </div>
    {/* More stats */}
  </div>

  <div className="neuro-inset p-4 mt-4">
    <p className="text-gray-400">Inset information</p>
  </div>
</div>
```

### Form Pattern
```tsx
<div className="neuro-card">
  <input
    type="text"
    className="neuro-input w-full mb-4"
    placeholder="Your name"
  />
  <button className="neuro-btn-primary w-full">
    Submit
  </button>
</div>
```

## Accessibility Considerations

1. **Contrast**: While neumorphism is subtle, ensure text has sufficient contrast
   - Primary text (`#e0e0e0`) on `#0a0a0a` = ~14:1 ratio ✅

2. **Focus States**: All interactive elements have clear focus indicators
   - Buttons: Elevation change + slight movement
   - Inputs: Blue ring on focus

3. **Touch Targets**: Minimum 44x44px for buttons
   - All `.neuro-btn` classes have adequate padding

4. **Keyboard Navigation**: All interactive elements are keyboard accessible

## Best Practices

### Do's ✅
- Use neumorphic effects for primary UI elements
- Combine with gradients for accent elements
- Keep shadows subtle and consistent
- Use hover states for interactive feedback
- Maintain consistent border radius (0.75rem - 1.5rem)

### Don'ts ❌
- Don't use neumorphism on top of neumorphism (no nested effects)
- Don't make shadows too harsh or high-contrast
- Don't use on small elements (< 32px) - won't be visible
- Don't forget hover/active states
- Don't mix multiple shadow styles on same element

## Performance

All neumorphic effects use:
- CSS `box-shadow` (hardware accelerated)
- `transition` for smooth animations
- No JavaScript required for visual effects

## Browser Support

Neumorphic design works in all modern browsers:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

Graceful degradation: Older browsers will show flat elements without shadows.

## Future Enhancements

- [ ] Generate proper PWA icons (192px, 512px)
- [ ] Add dark/light mode toggle (optional)
- [ ] Create more component variations (tabs, dropdowns, etc.)
- [ ] Add animation presets for micro-interactions
- [ ] Document color customization for different subjects

---

**Last Updated**: 2025-11-05
**Design System Version**: 1.0
