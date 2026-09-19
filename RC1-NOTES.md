# 2.0.0-rc.1 notes

Release Candidate 1 moves Famme Journey Studio from feature hardening to public distribution readiness.

## Added
- native PWA install prompt surfaced in the application when supported
- offline-state indicator
- PNG PWA icons at 192px and 512px plus maskable icon
- privacy, security and support policies
- GitHub publication and PWA installation guides
- bug/feature issue forms and pull-request template
- tag-triggered release build artifact workflow
- public release checklist

## Changed
- GitHub Pages workflow aligned with current official Pages action versions
- product copy and About screen identify the build as Release Candidate 1
- package metadata includes author, license, description and Node engine requirement

## Validation constraint
A complete dependency-backed production build still requires an online npm environment. GitHub Actions is the release gate for RC1.
