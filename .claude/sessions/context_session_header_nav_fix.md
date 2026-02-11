# Context Session: Header Navigation Fix (Issue #13)

## Issue

[Bug] Header navigation anchor links broken on non-home pages + mobile menu missing background

## Three Bugs to Fix

### Bug 1: Anchor links broken on Spanish non-home pages

- On `/work` or `/work/[slug]`, "Sobre mí" and "Contacto" navigate to `#about`/`#contact` (current page anchors that don't exist)
- Should navigate to `/#about`/`/#contact` (home page + scroll to section)
- English locale works correctly already
- **Root cause**: `anchorPrefix` returns `''` for Spanish non-home pages instead of `'/'`
- **Fix**: Change `const anchorPrefix = isHome ? '' : locale === 'es' ? '' : '/en';` to `const anchorPrefix = isHome ? '' : locale === 'es' ? '/' : '/en';`

### Bug 2: Mobile menu has no background

- Hamburger dropdown has no solid background — page content bleeds through
- **Fix**: Add `bg-background shadow-lg` to mobile menu container
- Make header opaque when mobile menu is open (regardless of scroll state)

### Bug 3: LanguageSwitcher stale path after view transitions

- Only reads `window.location.pathname` on mount
- With `transition:persist`, component doesn't re-mount on navigation
- **Fix**: Add `astro:after-swap` listener to update `currentPath`

### Additional: ARIA attributes

- Add `aria-expanded`, `aria-controls`, `aria-label` to hamburger button

## Files Changed

- `src/components/core/Header.tsx` — Bugs 1, 2, ARIA
- `src/components/core/Header.test.tsx` — 7 new test cases
- `src/components/LanguageSwitcher.tsx` — Bug 3 + ABOUTME comments
- `src/components/LanguageSwitcher.test.tsx` — New file, 6 tests

## Branch

`feature/fix-header-nav-mobile-menu` from `develop`

## Status

- [x] Analysis complete
- [ ] Implementation
- [ ] Tests written
- [ ] Lint + build pass
- [ ] PR created
