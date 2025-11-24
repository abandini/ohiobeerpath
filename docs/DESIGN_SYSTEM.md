# Ohio Beer Path Design System

**Version:** 1.0 (Phase 1 Complete)
**Date:** 2025-11-24
**Status:** Production Ready

---

## Color Palette

### Primary Colors (Ohio Theme)
- **Primary (Amber):** `#d97706` - Main brand color, buttons, links
- **Primary Light (Gold):** `#fbbf24` - Highlights, hover states
- **Primary Dark:** `#b45309` - Pressed states, dark variants
- **Accent (Hops Green):** `#16a34a` - Secondary actions, success states

### Neutral Colors
- **Background:** `#ffffff` - Page background
- **Surface:** `#f9fafb` - Card backgrounds
- **Text Primary:** `#1f2937` - Main text
- **Text Secondary:** `#6b7280` - Secondary text
- **Border:** `#e5e7eb` - Default borders

### Semantic Colors
- **Success:** `#10b981` - Confirmations, open status
- **Warning:** `#f59e0b` - Alerts, cautions
- **Error:** `#ef4444` - Errors, closed status
- **Info:** `#3b82f6` - Informational messages

---

## Typography

### Fonts
- **Headings:** Outfit (500, 600, 700, 800) - Modern, bold
- **Body:** Inter (400, 500, 600, 700) - Highly readable
- **Mono:** JetBrains Mono - Addresses, technical info

### Scale (Fluid)
- **4xl:** 2.5rem → 3.5rem (Main headlines)
- **3xl:** 2rem → 2.5rem (Section headers)
- **2xl:** 1.5rem → 2rem (Card titles)
- **xl:** 1.25rem → 1.5rem (Subheadings)
- **lg:** 1.125rem → 1.25rem (Large body)
- **base:** 1rem → 1.125rem (Body text)
- **sm:** 0.875rem → 1rem (Small text)
- **xs:** 0.75rem → 0.875rem (Captions)

---

## Components

### Buttons
- **Primary:** Amber gradient, white text
- **Secondary:** Outlined, amber border
- **Accent:** Green gradient, white text
- **Ghost:** Subtle surface color

**Sizes:** sm (38px), base (44px), lg (52px)

### Cards
- **Border radius:** 16px (xl)
- **Shadow:** Medium (hover: large)
- **Hover:** Lift 6px + border color shift
- **Image:** 220px height, zoom on hover

### Navigation
- **Top Nav:** Frosted glass, sticky
- **Bottom Nav (Mobile):** Fixed, 56px height
- **Active State:** Amber background

### Search
- **Shape:** Pill (border-radius: 9999px)
- **Height:** 52px (60px in hero)
- **Focus:** Amber border + glow

---

## Spacing Scale
- **xs:** 4px
- **sm:** 8px
- **md:** 16px
- **lg:** 24px
- **xl:** 32px
- **2xl:** 48px
- **3xl:** 64px

---

## Accessibility

### Touch Targets
- Minimum: 44px × 44px
- Recommended: 48px × 48px
- Navigation: 56px height (mobile)

### Color Contrast
- Text on white: 4.5:1 minimum (WCAG AA)
- Amber on white: Passes at all sizes
- Green on white: Passes at all sizes

### Focus States
- 2px outline, primary color
- 2px offset for visibility

---

## Usage Examples

### Using CSS Variables

```css
.custom-component {
  color: var(--color-primary);
  background: var(--color-surface);
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  font-family: var(--font-body);
  font-size: var(--text-base);
  transition: all var(--transition-base);
}
```

### Button Example

```html
<button class="btn btn-primary btn-lg">
  <i class="bi bi-plus-circle"></i>
  Add to Tour
</button>
```

### Card Example

```html
<div class="brewery-card grain-texture">
  <img src="brewery.jpg" class="card-img-top" alt="Brewery">
  <div class="card-body">
    <h3 class="card-title">Brewery Name</h3>
    <p class="card-text">Description...</p>
    <div class="amenity-tags">
      <span class="amenity-tag">
        <i class="bi bi-wifi"></i> WiFi
      </span>
    </div>
  </div>
</div>
```

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- iOS Safari 14+
- Chrome Android 90+

**Key Features:**
- CSS Custom Properties ✓
- Backdrop Filter ✓
- CSS Grid ✓
- Flexbox ✓
- clamp() ✓

---

## Performance

- **CSS Size:** ~45KB (unminified)
- **Font Load:** ~120KB (Outfit + Inter)
- **Load Time:** <1s on 3G
- **Lighthouse Score:** 85+ (target)

---

## Future Phases

**Phase 2-5:** Multi-tenant architecture (see `docs/plans/2025-11-24-multi-tenant-design.md`)

- Database-driven theming
- State-specific colors
- Path-based routing
- Dynamic hero images
