# Axium Neumorphic Design System

**Version:** 1.0
**Last Updated:** 2025-01-09

This document provides a comprehensive guide to the Axium neumorphic design system, covering all visual elements, components, typography, colors, and interaction patterns used throughout the application.

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [Neumorphic Components](#neumorphic-components)
5. [Layout & Spacing](#layout--spacing)
6. [Icons](#icons)
7. [Interactive States](#interactive-states)
8. [Responsive Design](#responsive-design)
9. [Page Patterns](#page-patterns)
10. [Component Usage Examples](#component-usage-examples)

---

## Design Philosophy

Axium uses a **minimal neumorphic design** (also called "soft UI") with the following core principles:

### Core Principles
1. **Clean & Minimal** - Reduce visual clutter, focus on essential elements
2. **Depth Through Shadows** - Use shadow-based elevation instead of borders
3. **Consistency** - Same patterns and components across all pages
4. **Dark Theme** - Primary background `#0a0a0a` with subtle highlights
5. **Functional Icons** - SVG icons only (no emojis), used to reduce comprehension time
6. **Generous Whitespace** - Ample spacing to reduce cognitive load
7. **Progressive Disclosure** - Show only what's needed, hide complexity in tooltips/modals

### Design Constraints
- **Typography:** Maximum 3 levels per page (title → section → body)
- **Actions:** Maximum 1 primary action per section
- **Colors:** Text color conveys meaning (blue = primary, green = success, yellow = warning, red = error)
- **Buttons:** Dark neumorphic base with colored text (NO colored backgrounds)
- **Form Controls:** Consistent inset appearance (neuro-input for all inputs/selects/textareas)

---

## Color Palette

### Base Colors
```css
--background: #0a0a0a         /* Primary dark background */
--foreground: #e0e0e0         /* Primary text color */

/* Shadow colors for neumorphic effects */
--shadow-light: #1a1a1a       /* Highlight shadow */
--shadow-dark: #000000        /* Dark shadow */

/* Surface colors */
--surface: #0a0a0a            /* Base surface */
--surface-raised: #0f0f0f     /* Slightly elevated */
--surface-elevated: #141414   /* More elevated */
```

### Accent Colors
```css
--accent-primary: #3b82f6     /* Blue - Primary actions */
--accent-secondary: #8b5cf6   /* Purple - Secondary actions */
--accent-success: #10b981     /* Green - Success states */
--accent-warning: #f59e0b     /* Yellow - Warning states */
--accent-error: #ef4444       /* Red - Error/destructive states */
```

### Text Colors
```css
--text-primary: #e0e0e0       /* Gray 200 - Primary text */
--text-secondary: #a0a0a0     /* Gray 400 - Secondary text */
--text-tertiary: #707070      /* Gray 500 - Tertiary text */
```

### Tailwind Color Usage
| Use Case | Tailwind Class | Hex | Purpose |
|----------|---------------|-----|---------|
| Primary text | `text-gray-200` | `#e5e7eb` | Main content |
| Secondary text | `text-gray-400` | `#9ca3af` | Labels, metadata |
| Tertiary text | `text-gray-500` | `#6b7280` | Placeholders |
| Disabled text | `text-gray-600` | `#4b5563` | Disabled states |
| Primary action | `text-blue-400` | `#60a5fa` | Primary buttons |
| Success | `text-green-400` | `#4ade80` | Success messages |
| Warning | `text-yellow-400` | `#facc15` | Warnings |
| Error | `text-red-400` | `#f87171` | Errors |
| Purple accent | `text-purple-400` | `#c084fc` | Secondary highlights |

---

## Typography

### Font Family
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
             'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
             'Helvetica Neue', sans-serif;
```

### Type Scale (3-Level Max)

#### Page Titles
```html
<h1 class="text-4xl font-bold text-blue-400">
  Axium
</h1>
```
- Size: `text-4xl` (36px)
- Weight: `font-bold` (700)
- Color: `text-blue-400` (brand color)

#### Section Headers
```html
<h2 class="text-2xl font-semibold text-gray-200">
  Your Subjects
</h2>
```
- Size: `text-2xl` (24px) or `text-xl` (20px)
- Weight: `font-semibold` (600)
- Color: `text-gray-200`

#### Body Text
```html
<p class="text-sm text-gray-500">
  Sign in to continue learning
</p>
```
- Size: `text-sm` (14px) or `text-base` (16px)
- Weight: Regular (400) or `font-medium` (500)
- Color: `text-gray-200` (primary) or `text-gray-500` (secondary)

#### Metadata
```html
<div class="text-xs text-gray-600">
  5 chapters
</div>
```
- Size: `text-xs` (12px)
- Weight: Regular (400)
- Color: `text-gray-600`

### Responsive Typography

Use responsive text sizing for better mobile experience:

```html
<!-- Mobile → Tablet → Desktop scaling -->
<h1 class="text-2xl md:text-3xl lg:text-4xl font-bold">Title</h1>
<p class="text-sm md:text-base lg:text-lg">Body</p>
```

---

## Neumorphic Components

All neumorphic components are defined in `app/globals.css` under the `@layer components` section.

### Elevation System

```css
/* Elevation levels - increasing shadow depth */
--elevation-1: 4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light);
--elevation-2: 8px 8px 16px var(--shadow-dark), -8px -8px 16px var(--shadow-light);
--elevation-3: 12px 12px 24px var(--shadow-dark), -12px -12px 24px var(--shadow-light);

/* Inset (pressed/sunken) effect */
--inset: inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light);
```

### 1. Cards & Containers

#### `.neuro-card`
Primary content container with medium elevation.

```html
<div class="neuro-card">
  <!-- Content -->
</div>
```

**Properties:**
- Background: `#0a0a0a`
- Border radius: `1rem` (16px)
- Shadow: `elevation-2`
- Padding: `1.5rem` (24px)
- Hover: Increases to `elevation-3`

**Usage:** Main content sections, question cards, stats groups

---

#### `.neuro-container`
Page-level container with larger padding.

```html
<div class="neuro-container">
  <!-- Page content -->
</div>
```

**Properties:**
- Background: `#0a0a0a`
- Border radius: `1.5rem` (24px)
- Shadow: `elevation-2`
- Padding: `2rem` (32px)

**Usage:** Headers, full-section wrappers

---

#### `.neuro-raised`
Slightly elevated surface for nested elements.

```html
<div class="neuro-raised">
  <!-- Nested content -->
</div>
```

**Properties:**
- Background: `#0f0f0f` (slightly lighter)
- Border radius: `1rem`
- Shadow: `elevation-1`
- Padding: `1rem` (16px)

**Usage:** Subject cards, nested sections, answer options

---

#### `.neuro-inset`
Sunken/pressed surface (depressed into background).

```html
<div class="neuro-inset">
  <!-- Recessed content -->
</div>
```

**Properties:**
- Background: `#0a0a0a`
- Border radius: `0.75rem` (12px)
- Shadow: `inset` (inverted shadows)
- Padding: `1rem`

**Usage:** Icon containers, progress tracks, inputs, disabled states

---

### 2. Buttons

**IMPORTANT:** All buttons use dark neumorphic background with colored TEXT. NO colored background buttons.

#### `.neuro-btn` (Base Button)
Default button with colored text.

```html
<button class="neuro-btn text-blue-400">
  Primary Action
</button>

<button class="neuro-btn text-gray-300">
  Secondary Action
</button>

<button class="neuro-btn text-green-400">
  Confirm
</button>

<button class="neuro-btn text-red-400">
  Delete
</button>
```

**Properties:**
- Background: `#0a0a0a`
- Border radius: `0.75rem` (12px)
- Shadow: `elevation-1`
- Padding: `0.75rem 1.5rem` (12px 24px)
- Hover: Elevates to `elevation-2`, translates `-2px` up
- Active: Returns to flat with `inset` shadow

**Text Colors by Meaning:**
- `text-blue-400`: Primary actions
- `text-gray-300`: Secondary/default actions
- `text-green-400`: Success/confirm actions
- `text-yellow-400`: Warning actions
- `text-red-400`: Destructive/delete actions

---

#### `.neuro-btn-primary` (Legacy Colored Button)
**DEPRECATED:** Use `neuro-btn text-blue-400` instead.

Blue gradient button (only used for special CTAs like "Sign in with Google").

```html
<button class="neuro-btn-primary">
  Sign in with Google
</button>
```

**Properties:**
- Background: `linear-gradient(145deg, #4287f5, #3670d9)`
- Color: White
- Hover: Lighter gradient + elevate

**When to Use:** Special CTAs, legacy components (prefer `neuro-btn` for new code)

---

#### `.neuro-btn-success`, `.neuro-btn-warning`, `.neuro-btn-error`
**DEPRECATED:** Use `neuro-btn text-{color}` instead.

Colored gradient buttons for specific states.

```html
<button class="neuro-btn-success">Success</button>
<button class="neuro-btn-warning">Warning</button>
<button class="neuro-btn-error">Error</button>
```

**When to Use:** Legacy components (prefer `neuro-btn` with text color for new code)

---

### 3. Form Controls

All form inputs use the **sunken/inset** style for consistency.

#### `.neuro-input`
Universal input class for all form controls.

```html
<!-- Text input -->
<input type="text" class="neuro-input w-full" />

<!-- Select dropdown -->
<select class="neuro-input w-full">
  <option>Choose...</option>
</select>

<!-- Textarea -->
<textarea class="neuro-input w-full" rows="4"></textarea>
```

**Properties:**
- Background: `#0a0a0a`
- Border radius: `0.75rem` (12px)
- Shadow: `inset` (sunken appearance)
- Padding: `0.75rem 1rem` (12px 16px)
- Focus: Adds blue ring `0 0 0 2px #3b82f6`

**Usage:** All text inputs, selects, textareas

---

#### File Inputs
Custom styled with hidden native input + button trigger.

```html
<input type="file" id="file-upload" class="hidden" />
<button
  type="button"
  onclick="document.getElementById('file-upload').click()"
  class="neuro-btn text-gray-300"
>
  Choose File
</button>
```

**Rule:** Never use default browser file input. Always hide and trigger with custom button.

---

### 4. Stats & Metrics

#### `.neuro-stat`
Stat card with hover effect.

```html
<div class="neuro-stat group">
  <div class="flex items-center justify-between mb-3">
    <div class="text-sm text-blue-400 font-medium">Label</div>
    <IconName size={20} class="text-blue-400 opacity-50 group-hover:opacity-100" />
  </div>
  <div class="text-4xl font-bold text-gray-200 group-hover:text-blue-400">
    {value}
  </div>
  <div class="text-xs text-gray-600 mt-2">
    Subtitle
  </div>
</div>
```

**Properties:**
- Background: `#0a0a0a`
- Border radius: `1rem`
- Shadow: `elevation-1`
- Padding: `1.25rem` (20px)
- Hover: Elevates and icon fades in

**Usage:** Dashboard stats, performance metrics

---

### 5. Progress Bars

#### `.neuro-progress` + `.neuro-progress-bar`

```html
<div class="neuro-progress">
  <div class="neuro-progress-bar" style="width: 75%"></div>
</div>
```

**Properties:**
- Track: Inset shadow, `0.5rem` height
- Bar: Blue-purple gradient, animated width

**Usage:** Loading indicators, mastery progress

---

### 6. Badges

#### `.neuro-badge-*`

```html
<span class="neuro-badge neuro-badge-success">Active</span>
<span class="neuro-badge neuro-badge-warning">Pending</span>
<span class="neuro-badge neuro-badge-error">Overdue</span>
<span class="neuro-badge neuro-badge-info">New</span>
```

**Properties:**
- Padding: `0.25rem 0.75rem` (4px 12px)
- Border radius: `0.5rem` (8px)
- Font size: `0.75rem` (12px)
- Weight: `font-semibold` (600)
- Colors: Gradient backgrounds (green, yellow, red, blue)

**Usage:** Status indicators, labels

---

### 7. Toggles

#### `.neuro-toggle`

```html
<div class="neuro-toggle" onclick="this.classList.toggle('active')">
  <div class="neuro-toggle-thumb"></div>
</div>
```

**Properties:**
- Width: `3rem` (48px)
- Height: `1.5rem` (24px)
- Track: Inset shadow when off, blue when active
- Thumb: Small raised circle that slides

**Usage:** Feature toggles, settings

---

## Layout & Spacing

### Spacing Scale

Axium uses Tailwind's default spacing scale with emphasis on generous whitespace:

| Class | Pixels | Usage |
|-------|--------|-------|
| `gap-2` | 8px | ❌ Too cramped, avoid |
| `gap-3` | 12px | ❌ Too cramped, avoid |
| `gap-4` | 16px | ✅ Minimum gap for grids/flexbox |
| `gap-6` | 24px | ✅ Standard gap for sections |
| `gap-8` | 32px | ✅ Large gap for major sections |
| `p-4` | 16px | ✅ Minimum padding |
| `p-6` | 24px | ✅ Standard padding |
| `p-8` | 32px | ✅ Generous padding |
| `mb-6` | 24px | ✅ Section spacing |
| `mb-8` | 32px | ✅ Major section breaks |

### Grid Layouts

```html
<!-- 1 → 2 → 3 column responsive grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <!-- Items -->
</div>
```

### Flexbox Patterns

```html
<!-- Space between with center alignment -->
<div class="flex items-center justify-between gap-3">
  <div>Left content</div>
  <div>Right content</div>
</div>

<!-- Centered content -->
<div class="flex items-center justify-center gap-3">
  <Icon />
  <span>Label</span>
</div>
```

---

## Icons

All icons are defined in `components/icons.tsx` as SVG React components.

### Icon Sizes

| Size | Pixels | Usage |
|------|--------|-------|
| 18px | Small | Button icons |
| 20px | Standard | Section headers |
| 24px | Default | General use |
| 28px | Large | Feedback icons (check/X) |
| 40px | XL | Empty states, feature icons |

### Icon Colors

Icons inherit text color via `currentColor`:

```html
<BookIcon size={20} className="text-blue-400" />
<CheckIcon size={28} className="text-green-400" />
<XIcon size={28} className="text-red-400" />
```

### Available Icons

**Navigation & Actions:**
- `MenuIcon` - Hamburger menu
- `HomeIcon` - Home/dashboard
- `ArrowLeftIcon`, `ArrowRightIcon` - Navigation
- `ChevronDownIcon` - Dropdowns

**Status & Feedback:**
- `CheckIcon`, `XIcon` - Correct/incorrect
- `CheckCircleIcon` - Completed
- `AlertTriangleIcon` - Warnings
- `InfoIcon` - Information

**Content:**
- `BookIcon` - Subjects, chapters
- `GridIcon` - Categories
- `TargetIcon` - Goals, objectives
- `TrophyIcon` - Achievements
- `AwardIcon` - Rewards
- `StarIcon` - Ratings

**Actions:**
- `PlayIcon` - Start session
- `RefreshIcon` - Reload
- `TrashIcon` - Delete
- `SettingsIcon` - Configuration
- `LockIcon`, `LockOpenIcon` - Locked/unlocked content

**Analytics:**
- `BarChartIcon` - Statistics
- `TrendingUpIcon` - Progress

**RL Phases:**
- `ColdStartIcon` - Cold start phase
- `ExplorationIcon` - Exploration phase
- `OptimizationIcon` - Optimization phase
- `StabilizationIcon` - Stabilization phase
- `AdaptationIcon` - Adaptation phase
- `MetaLearningIcon` - Meta-learning phase

**User:**
- `UserIcon` - Profile
- `LogOutIcon` - Sign out

### Icon Usage Guidelines

1. **Functional Only:** Use icons to reduce comprehension time, not for decoration
2. **Consistency:** Same icon for same meaning across all pages
3. **Max 1 Icon Per Element:** Avoid cluttering with multiple icons
4. **Pair with Text:** Always include text label for clarity (except well-known actions like X for close)

---

## Interactive States

### Hover Effects

```css
/* Standard hover: Elevate + subtle translate */
.neuro-btn:hover {
  box-shadow: var(--elevation-2);
  transform: translateY(-2px);
  transition: all 0.2s ease;
}

/* Card hover: Increase elevation */
.neuro-card:hover {
  box-shadow: var(--elevation-3);
}
```

### Active/Pressed States

```css
/* Button press: Inset shadow + return to flat */
.neuro-btn:active {
  box-shadow: var(--inset);
  transform: translateY(0);
}
```

### Focus States

```css
/* Input focus: Add blue ring */
.neuro-input:focus {
  box-shadow: var(--inset), 0 0 0 2px var(--accent-primary);
  outline: none;
}
```

### Selection States

```html
<!-- Selected answer option -->
<div class="neuro-raised ring-2 ring-blue-400">
  Selected option
</div>
```

### Disabled States

```html
<!-- Disabled button -->
<button class="neuro-btn disabled:opacity-50" disabled>
  Disabled
</button>
```

---

## Responsive Design

### Breakpoints

```css
sm:  640px   /* Mobile landscape */
md:  768px   /* Tablet */
lg:  1024px  /* Desktop */
xl:  1280px  /* Large desktop */
2xl: 1536px  /* Extra large desktop */
```

### Scaling Pattern

```
Mobile (320px):  1 column, full width
Tablet (768px):  2 columns
Desktop (1024px): 3-4 columns
4K (3840px):     Max-width centered (max-w-7xl = 1280px)
```

### Responsive Container

```html
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  <!-- Content -->
</div>
```

**Properties:**
- Max width: `1280px` (7xl)
- Centered: `mx-auto`
- Responsive padding: `px-4` → `sm:px-6` → `lg:px-8`

### Responsive Grids

```html
<!-- 1 → 2 → 3 column grid -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  <!-- Grid items -->
</div>

<!-- 1 → 2 → 4 column grid -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <!-- Stat cards -->
</div>
```

### Touch Targets

**Minimum:** 44×44px on mobile (Apple HIG guideline)

```html
<!-- Good: Large enough for touch -->
<button class="neuro-btn py-4 px-6">
  Large Button
</button>

<!-- Bad: Too small for touch -->
<button class="neuro-btn py-1 px-2">
  Tiny Button
</button>
```

---

## Page Patterns

### 1. Login Page (`/login`)

**Layout:**
```
Centered container (max-w-md)
  ↓
neuro-container
  ↓
Branding (logo + title)
  ↓
Sign In Section (heading + button + legal text)
```

**Components:**
- Icon container: `neuro-inset w-20 h-20`
- Title: `text-4xl font-bold text-blue-400`
- Subtitle: `text-sm text-gray-500`
- Button: `neuro-btn-primary w-full`

**Code:**
```html
<div class="neuro-container">
  <!-- Branding -->
  <div class="text-center mb-8">
    <div class="neuro-inset w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
      <BookIcon size={40} className="text-blue-400" />
    </div>
    <h1 class="text-4xl font-bold text-blue-400 mb-3">
      Axium
    </h1>
    <p class="text-sm text-gray-500">
      Adaptive Learning Platform
    </p>
  </div>

  <!-- Sign In -->
  <div class="space-y-6">
    <div class="text-center">
      <h2 class="text-2xl font-bold text-gray-200 mb-2">
        Welcome Back
      </h2>
      <p class="text-sm text-gray-500">
        Sign in to continue learning
      </p>
    </div>
    <GoogleSignInButton />
    <p class="text-xs text-gray-600 text-center">
      By signing in, you agree to use this platform responsibly.
    </p>
  </div>
</div>
```

---

### 2. Subjects Page (`/subjects`)

**Layout:**
```
Header (neuro-container)
  ↓
Main Content (max-w-7xl)
  ↓
neuro-card
  ↓
Section Header (icon + title)
  ↓
Grid of subject cards (3 columns)
```

**Header Pattern:**
```html
<header class="neuro-container mx-4 my-4">
  <div class="max-w-7xl mx-auto flex justify-between items-center gap-3">
    <div class="neuro-raised px-6 py-3 flex items-center gap-3">
      <BookIcon size={24} className="text-blue-400" />
      <h1 class="text-2xl font-bold text-blue-400">Axium</h1>
    </div>
    <HamburgerMenu />
  </div>
</header>
```

**Section Header Pattern:**
```html
<div class="flex items-center gap-3 mb-8">
  <div class="neuro-inset w-12 h-12 rounded-xl flex items-center justify-center">
    <BookIcon size={20} className="text-blue-400" />
  </div>
  <h2 class="text-2xl font-semibold text-gray-200">
    Your Subjects
  </h2>
</div>
```

**Subject Card:**
```html
<Link href="/subjects/math" class="neuro-raised p-6 hover:shadow-lg transition-all group">
  <!-- Icon -->
  <div class="neuro-inset w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
    <span class="text-3xl font-bold text-blue-400">M</span>
  </div>

  <!-- Name -->
  <h3 class="text-xl font-semibold text-gray-200 mb-2 group-hover:text-blue-400">
    Mathematics
  </h3>

  <!-- Description -->
  <p class="text-sm text-gray-500 mb-4 line-clamp-2">
    Algebra, geometry, calculus and more
  </p>

  <!-- Metadata -->
  <div class="text-sm text-gray-600">
    5 chapters
  </div>
</Link>
```

---

### 3. Quiz/Learning Page (`/subjects/[subject]/[chapter]/quiz`)

**Layout:**
```
Progress Header (neuro-card)
  ↓
Main Question Card (neuro-card)
  ↓
4-Step Flow:
  1. Confidence Selection
  2. Answer Options
  3. Recognition Method
  4. Feedback + Explanations
```

**Progress Header:**
```html
<div class="neuro-card mb-6">
  <div class="flex justify-between items-center gap-3">
    <div>
      <div class="text-sm text-gray-500 mb-1">
        Question 5
      </div>
      <div class="text-2xl font-bold text-gray-200">
        Score: 4/5
      </div>
    </div>
    <HamburgerMenu />
  </div>
</div>
```

**Question Card:**
```html
<div class="neuro-card">
  <!-- Question -->
  <div class="mb-8">
    <p class="text-xl text-gray-200 leading-relaxed">
      What is the capital of France?
    </p>
  </div>

  <!-- Answer Options -->
  <div class="space-y-3 mb-6">
    <button class="neuro-raised p-4 w-full text-left ring-2 ring-blue-400">
      <span class="text-lg font-bold text-blue-400 mr-3">A.</span>
      <span class="text-lg text-gray-200">Paris</span>
    </button>
    <!-- More options... -->
  </div>

  <!-- Action Button -->
  <button class="neuro-btn text-blue-400 w-full py-4 text-lg">
    Submit Answer →
  </button>
</div>
```

**Feedback Display:**
```html
<!-- Correctness Badge -->
<div class="neuro-inset p-6 rounded-lg mb-6 ring-2 ring-green-400">
  <div class="flex items-center gap-3 mb-3">
    <div class="w-12 h-12 rounded-full flex items-center justify-center bg-green-500/20">
      <CheckIcon size={28} className="text-green-400" />
    </div>
    <div class="text-3xl font-bold text-gray-200">
      Correct!
    </div>
  </div>

  <!-- Explanation -->
  <div class="neuro-raised p-6 mt-4">
    <div class="text-sm text-gray-500 mb-4">Explanation:</div>
    <div class="text-gray-200 leading-relaxed">
      Paris is the capital and largest city of France...
    </div>
  </div>
</div>
```

---

### 4. Admin Page (`/admin`)

**Layout:**
```
Header (neuro-container)
  ↓
Admin Content
  ↓
Multiple neuro-card sections
  ↓
Collapsible sections with chevron toggles
```

**Header:**
```html
<header class="neuro-container mx-4 my-4">
  <div class="max-w-7xl mx-auto">
    <div class="flex items-center justify-between gap-3 mb-4">
      <div>
        <h1 class="text-2xl font-bold text-blue-400">Admin Panel</h1>
        <div class="text-sm text-gray-500">Content Management</div>
      </div>
      <HamburgerMenu />
    </div>
  </div>
</header>
```

**Collapsible Section:**
```html
<div class="neuro-card">
  <button
    type="button"
    onClick={() => setExpanded(!expanded)}
    class="w-full flex items-center justify-between mb-4"
  >
    <h2 class="text-2xl font-semibold text-gray-200">
      Section Title
    </h2>
    <span class="text-gray-400 text-xl">
      {expanded ? '▼' : '▶'}
    </span>
  </button>

  {expanded && (
    <div>
      {/* Section content */}
    </div>
  )}
</div>
```

---

### 5. Empty States

**Pattern:**
```html
<div class="neuro-inset p-8 rounded-lg text-center">
  <!-- Icon -->
  <div class="neuro-inset w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
    <BookIcon size={40} className="text-gray-600" />
  </div>

  <!-- Message -->
  <h2 class="text-2xl font-bold text-gray-200 mb-2">
    No Subjects Yet
  </h2>
  <p class="text-sm text-gray-500 mb-8 max-w-md mx-auto">
    Create your first subject to start your adaptive learning journey.
  </p>

  <!-- CTA -->
  <Link href="/admin" class="neuro-btn-primary inline-flex items-center gap-2 px-6 py-3">
    <SettingsIcon size={18} />
    <span>Go to Admin Panel</span>
  </Link>
</div>
```

---

## Component Usage Examples

### Button Examples

```html
<!-- Primary action -->
<button class="neuro-btn text-blue-400 py-4 px-6">
  Start Learning
</button>

<!-- Secondary action -->
<button class="neuro-btn text-gray-300 py-3 px-6">
  Cancel
</button>

<!-- Success action -->
<button class="neuro-btn text-green-400 py-3 px-6">
  Save Changes
</button>

<!-- Destructive action -->
<button class="neuro-btn text-red-400 py-3 px-6">
  Delete Account
</button>

<!-- Disabled state -->
<button class="neuro-btn text-gray-300 disabled:opacity-50" disabled>
  Loading...
</button>

<!-- Full width button -->
<button class="neuro-btn text-blue-400 w-full py-4">
  Continue
</button>
```

### Form Examples

```html
<!-- Text input with label -->
<div class="space-y-2">
  <label class="text-sm text-gray-400">Subject Name</label>
  <input
    type="text"
    class="neuro-input w-full"
    placeholder="Enter subject name"
  />
</div>

<!-- Select dropdown -->
<div class="space-y-2">
  <label class="text-sm text-gray-400">Bloom Level</label>
  <select class="neuro-input w-full">
    <option>Remember (1)</option>
    <option>Understand (2)</option>
    <option>Apply (3)</option>
  </select>
</div>

<!-- Textarea -->
<div class="space-y-2">
  <label class="text-sm text-gray-400">Description</label>
  <textarea
    class="neuro-input w-full"
    rows="4"
    placeholder="Enter description"
  ></textarea>
</div>

<!-- File upload -->
<div class="space-y-2">
  <label class="text-sm text-gray-400">Upload Document</label>
  <input type="file" id="file" class="hidden" />
  <button
    type="button"
    onclick="document.getElementById('file').click()"
    class="neuro-btn text-gray-300 w-full py-3"
  >
    Choose File
  </button>
</div>
```

### Stats Grid

```html
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <!-- Stat 1 -->
  <div class="neuro-stat group">
    <div class="flex items-center justify-between mb-3">
      <div class="text-sm text-blue-400 font-medium">Total Score</div>
      <TrophyIcon size={20} class="text-blue-400 opacity-50 group-hover:opacity-100" />
    </div>
    <div class="text-4xl font-bold text-gray-200 group-hover:text-blue-400">
      1,247
    </div>
    <div class="text-xs text-gray-600 mt-2">
      Lifetime total
    </div>
  </div>

  <!-- More stats... -->
</div>
```

### Tooltip Pattern

```html
<div class="cursor-help" title="Hover text explanation">
  <div class="text-sm text-gray-400">Mastery Score:</div>
  <div class="text-2xl font-bold text-blue-400">85%</div>
</div>
```

---

## Scrollbar Styling

Axium uses custom neumorphic scrollbars throughout the application:

```css
/* Firefox */
* {
  scrollbar-width: thin;
  scrollbar-color: #2a2a2a #0f0f0f;
}

/* Webkit (Chrome, Safari, Edge) */
*::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

*::-webkit-scrollbar-track {
  background: #0f0f0f;
  border-radius: 5px;
  box-shadow: inset 2px 2px 4px #000000, inset -2px -2px 4px #1a1a1a;
}

*::-webkit-scrollbar-thumb {
  background: #2a2a2a;
  border-radius: 5px;
  box-shadow: 2px 2px 4px #000000, -2px -2px 4px #3a3a3a;
  border: 1px solid #1a1a1a;
}

*::-webkit-scrollbar-thumb:hover {
  background: #353535;
}
```

---

## Animation & Transitions

### Standard Transitions

```css
/* Button hover/active */
transition: all 0.2s ease;

/* Card hover */
transition: all 0.3s ease;

/* Smooth expand/collapse */
transition: height 0.3s ease, opacity 0.3s ease;
```

### Fade In Animation

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}
```

### Usage

```html
<!-- Fade in modal -->
<div class="animate-fade-in">
  <!-- Content -->
</div>
```

---

## Accessibility

### Focus Management

- All interactive elements have visible focus states
- Focus ring: `ring-2 ring-blue-400`
- Inputs add focus ring around inset shadow

### Keyboard Navigation

- All buttons, links, and inputs are keyboard accessible
- Modal traps focus inside
- Tab order follows visual hierarchy

### Screen Readers

- All icons paired with text labels
- ARIA labels for icon-only buttons
- Semantic HTML structure

### Color Contrast

All text meets WCAG AA standards:
- `text-gray-200` on `#0a0a0a`: 12.68:1 (AAA)
- `text-gray-400` on `#0a0a0a`: 7.57:1 (AAA)
- `text-blue-400` on `#0a0a0a`: 7.15:1 (AAA)

---

## Design System Checklist

Before committing UI changes, verify:

- [ ] NO EMOJIS - SVG icons only
- [ ] All buttons use `neuro-btn` with colored text (NO colored backgrounds)
- [ ] Max 1 primary action per section (`text-blue-400`)
- [ ] All form controls use `neuro-input`
- [ ] File inputs use custom `neuro-btn` trigger (hide default)
- [ ] Consistent header pattern (w-12 h-12 icon container)
- [ ] Empty states follow pattern (w-20 h-20 icon, centered)
- [ ] Generous spacing (gap-4/6, p-6/8, mb-6/8)
- [ ] Mobile-first responsive (grid-cols-1 sm:... lg:...)
- [ ] Max 3 typography levels per page
- [ ] Semantic colors via TEXT (blue=primary, green=success, yellow=warning, red=error)
- [ ] Minimal cognitive load (no visual clutter)
- [ ] Predictable interactions (consistent hover/active states)

---

## Design Resources

- **Figma:** (To be created)
- **Color Palette:** See [Color Palette](#color-palette) section
- **Icons:** `components/icons.tsx`
- **CSS Variables:** `app/globals.css` (lines 5-38)
- **Component Classes:** `app/globals.css` (lines 85-371)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01-09 | Initial documentation covering all pages and components |

---

## Contact & Support

For questions about the design system:
- Review `CLAUDE.md` for development best practices
- Check component examples in existing pages
- Refer to this document for comprehensive patterns

**Maintained by:** Axium Development Team
**Last Review:** 2025-01-09
