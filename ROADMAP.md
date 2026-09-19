# Product roadmap

## Product principle
A customer journey is data. Business, marketing, tracking, performance and presentation are views over the same underlying journey model.

## 2.0 Alpha 1 — foundation ✅
- clean public codebase
- PWA foundation
- IndexedDB
- XYFlow editor
- generic templates
- portable workspaces

## 2.0 Alpha 2 — authoring depth ✅
- Component Library with sync
- tracking and creative definitions
- reconnectable annotated edges
- cross-journey links
- versioning and diff
- annotations / TODOs / hypotheses / decisions
- Journey Health
- multi-select and keyboard productivity

## 2.0 Alpha 3 — intelligence layer ✅
- KPI Dictionary
- performance snapshots
- metric overlays
- mapping governance and overrides
- data freshness
- opportunity / gap detection
- observed paths
- Planned vs Actual
- stable mapping exports

## 2.0 Beta 1 — public-product layer ✅
- legacy migration
- synthetic demo workspace
- onboarding tour
- Share & Portfolio exports
- accessibility and responsive polish
- automated tests and CI foundation

## 2.0 Beta 2 — release hardening ✅
- autosave and recovery snapshots
- crash recovery mode
- import preview and migration reports
- command palette and contextual help
- undo/redo and unsaved-change warning
- deeper integration tests

## 2.0 RC1 — public distribution package ✅
- GitHub Pages production workflow
- installable PWA UX and icons
- offline indicator
- public privacy/security/support policies
- publication/install documentation
- issue/PR templates
- tag-based release build artifact
- public release checklist

## 2.0.0 — release gate next
- push RC1 source to a public GitHub repository
- enable GitHub Pages with GitHub Actions
- obtain the first clean online dependency/type/test/build run
- fix any errors exposed by the clean CI environment
- smoke-test the live Pages URL
- verify PWA install and offline reload
- capture public screenshots
- tag `v2.0.0` only after all gates pass

## Desktop — later
- Tauri build pipeline
- Windows portable release
- Windows installer
- macOS build
- code signing when distribution justifies it
