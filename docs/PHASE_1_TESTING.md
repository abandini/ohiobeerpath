# Phase 1: Visual Design System Testing Checklist

## Colors
- [ ] Primary color is amber (#d97706) throughout
- [ ] Accent color is green (#16a34a) for secondary actions
- [ ] No remnants of Bootstrap blue (#007bff)
- [ ] Text contrast passes WCAG AA

## Typography
- [ ] Outfit loads for all headings
- [ ] Inter loads for body text
- [ ] Font sizes are fluid (clamp working)
- [ ] Line heights are comfortable (1.6 body, 1.2 headings)

## Components

### Buttons
- [ ] Primary buttons are amber gradient
- [ ] Hover effects work (lift + shadow)
- [ ] Active state scales down (0.98)
- [ ] Touch targets ≥44px

### Cards
- [ ] Border radius is 16px
- [ ] Hover lifts 6px with enhanced shadow
- [ ] Images zoom on hover
- [ ] Region badges display correctly

### Navigation
- [ ] Top nav has frosted glass effect
- [ ] Sticky positioning works
- [ ] Active link is amber
- [ ] Mobile hamburger works

### Hero
- [ ] Animated gradient background
- [ ] Glass-morphism stat badges
- [ ] Text is readable (shadows applied)
- [ ] Height adjusts responsively

### Search
- [ ] Pill shape (full border radius)
- [ ] Focus shows amber border
- [ ] Clear button appears when typing
- [ ] Icon changes color on focus

### Mobile Bottom Nav
- [ ] Appears on mobile only (<768px)
- [ ] Fixed to bottom
- [ ] Active state indicator (top bar)
- [ ] Badge shows on "My Tour"

## Responsive
- [ ] Mobile (375px): All elements visible, no overflow
- [ ] Mobile (390px): Bottom nav functional
- [ ] Tablet (768px): Layout adapts, cards in grid
- [ ] Desktop (1024px): Full layout, no bottom nav
- [ ] Desktop (1440px): Content well-spaced
- [ ] Desktop (1920px): Max-width container works

## Cross-Browser
- [ ] Chrome: All features work
- [ ] Firefox: Backdrop blur works (or fallback)
- [ ] Safari: CSS variables work
- [ ] iOS Safari: Touch targets comfortable

## Performance
- [ ] Lighthouse Performance: ≥85
- [ ] Lighthouse Accessibility: ≥90
- [ ] First Contentful Paint: <1.8s
- [ ] No layout shifts (CLS <0.1)

## Accessibility
- [ ] Focus indicators visible
- [ ] Keyboard navigation works
- [ ] Color contrast WCAG AA
- [ ] Touch targets ≥44px
- [ ] Alt text on images

## Pages Tested
- [ ] index.php (Homepage)
- [ ] breweries.php (Brewery listing)
- [ ] regions.php (Regions page)
- [ ] nearby.php (Nearby page)
- [ ] itinerary.php (Tour planning)

## Final Checks
- [ ] All pages load without errors
- [ ] No console errors
- [ ] All URLs work (no routing changes yet)
- [ ] Site feels cohesive and "craft beer"
- [ ] User feedback positive
