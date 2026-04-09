# Favicon Guide

This document explains what a favicon is, why it matters, which formats to use, and how favicon setup works in this project.

## What is a favicon

A favicon is the small icon shown for your site in places like:

- Browser tabs
- Bookmarks
- Browser history
- Mobile home screen shortcuts (with related icons)
- Search result/site cards in some contexts

It is part of your brand identity and helps users quickly recognize your app.

## Why we use a favicon

- Improves brand recall in crowded tab bars.
- Makes bookmarks and saved links easier to identify.
- Adds polish and trust to production websites.
- Supports installable app experiences (PWA + mobile home screen icons).

## Common favicon formats

### SVG favicon

- Best for modern browsers.
- Crisp at any scale.
- Smaller and easier to maintain than many bitmap variants.

Example:

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

### ICO fallback (optional)

- Legacy browser compatibility.
- Can contain multiple bitmap sizes in one file.

Example:

```html
<link rel="icon" href="/favicon.ico" sizes="any" />
```

### PNG touch icons

- Used by mobile platforms and some pinned shortcuts.
- Typical file: `apple-touch-icon.png`.

Example:

```html
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

## Recommended favicon sizes

- 16x16 (tab icon baseline)
- 32x32 (higher-density tab/bookmark views)
- 48x48 (some desktop contexts)
- 180x180 (Apple touch icon)
- 192x192 and 512x512 (PWA icons, from manifest)

For this project, `favicon.svg` is primary, while touch/PWA icons are handled via files in `frontend/public`.

## How favicon works in this project

### Files

- Primary favicon: `frontend/public/favicon.svg`
- Apple touch icon: `frontend/public/apple-touch-icon.png`
- PWA icons: `frontend/public/pwa-192x192.png`, `frontend/public/pwa-512x512.png`
- Web app manifest: `frontend/public/manifest.webmanifest`

### HTML wiring

Configured in `frontend/index.html`:

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.webmanifest" />
```

### Alternate design files

During design exploration, these variants were created:

- `frontend/public/favicon-alt-1.svg`
- `frontend/public/favicon-alt-2.svg`
- `frontend/public/favicon-alt-3.svg`
- `frontend/public/favicon-alt-3-v2.svg`

Only `favicon.svg` is currently active.

## How to update favicon safely

1. Replace contents of `frontend/public/favicon.svg` (or swap `href` temporarily to a variant file).
2. Keep the design simple and high-contrast for 16x16 readability.
3. Run a production build:

```bash
cd frontend
npm run build
```

4. Deploy.
5. Hard refresh in browser (favicons are aggressively cached).

## Browser caching notes

Favicons are often cached longer than regular assets.

If users still see old favicon:

- Hard refresh (`Cmd+Shift+R` on macOS)
- Open in private/incognito window
- Rename favicon file and update HTML reference (cache-busting method)

## Design guidelines for tiny icons

- Prefer one clear shape over detailed marks.
- Avoid thin strokes and small decorative elements.
- Use strong contrast (light icon on dark background, or vice versa).
- Test visually at 16x16 and 32x32 equivalents.

## Accessibility and brand consistency

- Keep icon style aligned with your logo system.
- Use consistent colors across favicon, touch icon, and PWA icons.
- Include descriptive `aria-label` in inline SVG where practical.

## Quick checklist

- `favicon.svg` exists and is valid SVG.
- `index.html` points to `/favicon.svg`.
- `apple-touch-icon.png` exists.
- `manifest.webmanifest` exists and references app icons.
- Frontend build passes.
- New favicon visible after cache refresh.
