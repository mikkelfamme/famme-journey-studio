# Release manifest — 2.0.0-rc.12.4

## Release goal
Make the desktop-shortcut flow browser-aware instead of Edge-specific while preserving the real installed PWA identity.

## Included release surfaces
- React/TypeScript application source
- browser-aware shortcut guidance for Chrome, Edge, Brave, Opera, Vivaldi and generic browsers
- universal Windows `shell:AppsFolder` shortcut fallback
- no generated `.url` / `.download` Internet Shortcut files
- generic demo only; no company-specific workspace bundled
- GitHub CI quality gate
- GitHub Pages deployment workflow
- PWA manifest and JS app icons
- public privacy/security/support documentation

## Required online gate
The current generation environment does not include this project's npm dependencies. GitHub Actions remains the release gate for dependency installation, full TypeScript typecheck, tests, Vite build and Pages deployment.
