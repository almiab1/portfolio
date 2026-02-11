# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-02-11

### Added

- Astro View Transitions for smooth SPA-like navigation between pages
- Shared element morph animation on project titles (card grid → detail page)
- Header persistence across navigations via `transition:persist`
- Custom 250ms fade transition timing
- Vercel Analytics integration for traffic and performance insights
- Unit test infrastructure with Vitest + Testing Library (22 tests)
- ARIA attributes on mobile menu hamburger button (`aria-expanded`, `aria-controls`, `aria-label`)
- Claude Code GitHub Action CI workflow

### Fixed

- Header anchor links on non-home pages now navigate back to home sections (`/#about`, `/#contact` for Spanish; `/en#about`, `/en#contact` for English)
- Mobile menu now has opaque background (`bg-background`) and shadow (`shadow-lg`) so content no longer bleeds through
- Header becomes opaque when mobile menu is open regardless of scroll position
- LanguageSwitcher now syncs path on `astro:after-swap` events to avoid stale links after view transitions

### Changed

- Project descriptions rewritten for SEO and readability
- Header component syncs locale/path from `window.location` on `astro:after-swap` to handle stale props when persisted across view transitions

## [1.0.2] - 2026-02-10

### Security

- Removed `.mcp.json` from git tracking to prevent API key exposure
- Added `.mcp.json` to `.gitignore` to prevent future commits of sensitive data
- Created `.mcp.json.example` template for safe configuration sharing

### Note

This release addresses a security issue where a Context7 API key was exposed in the public repository. The exposed key has been rotated.

## [1.0.1] - 2026-02-10

### Fixed

- Removed non-existent Skills navigation link from header (fixes broken anchor)
- Updated contact email from `hello@alejandromira.com` to `miraabad.alejandro@gmail.com`

### Changed

- Removed `nav.skills` translation keys from Spanish and English i18n files

## [1.0.0] - 2026-02-10

### Added

- Initial production release of portfolio website
- Astro 5 framework with islands architecture
- React 19 for interactive components
- Tailwind CSS v4 with shadcn/ui components
- MDX content with Astro Content Collections
- Internationalization (i18n) support for Spanish (default) and English
- SEO optimization with sitemap and JSON-LD schemas
- Project showcase with filtering and search functionality
- Responsive design with mobile-first approach
- Neural network background animation
- Dark mode support

### Features

- **Home Page**: Hero section with animated background, About section, Featured projects
- **Projects Page**: Full project listing with filtering by type, tags, and search
- **Project Detail Pages**: Individual project case studies with gallery support
- **Navigation**: Multi-language header with CV download
- **Contact Section**: Email and social media links

### Technical

- TypeScript with strict mode
- ESLint and Prettier configuration
- Vercel deployment setup
- Git worktree workflow support

[Unreleased]: https://github.com/almiab1/personalWeb/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/almiab1/personalWeb/compare/v1.0.2...v1.1.0
[1.0.2]: https://github.com/almiab1/personalWeb/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/almiab1/personalWeb/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/almiab1/personalWeb/releases/tag/v1.0.0
