# Release manifest — 2.0.0-rc.12.6

## Release goal
Provide a real Windows desktop-shortcut action from Journey Studio without relying on Chrome/Edge app-manager instructions or fake Internet Shortcut files.

## Included release surfaces
- React/TypeScript application source
- optional per-user Windows helper installer
- custom protocol `journeystudio-helper://create-shortcut`
- real `.lnk` shortcut creation by cloning the installed PWA Start-menu shortcut
- JS desktop icon override
- no `.url` / `.download` Internet Shortcut generation
- no administrator rights or PowerShell requirement
- generic demo only; no company-specific workspace bundled
- GitHub CI quality gate
- GitHub Pages deployment workflow
- PWA manifest and JS app icons
- public privacy/security/support documentation

## Required online gate
The current generation environment does not include this project's npm dependencies. GitHub Actions remains the release gate for dependency installation, full TypeScript typecheck, tests, Vite build and Pages deployment.

## Platform limitation
The helper uses Windows Script Host. Managed Windows environments that disable `.vbs` execution will require a future compiled native helper instead.
