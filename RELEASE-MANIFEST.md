# Release manifest — 2.0.0-rc.12.7

## Release goal
Make node/component types easier to understand and add the missing structural types needed for real customer-journey modelling without changing existing workspace schemas or database keys.

## Included release surfaces
- React/TypeScript application source
- grouped Component type selector with contextual explanations
- new Audience / segment, Shop / checkout and Physical visit node types
- updated node icons, palette, print styling and legacy normalization
- existing Windows desktop-shortcut helper from RC12.6
- generic public core only; ZOO-specific journey files are distributed separately as portable `.jsjourney` imports
- GitHub CI quality gate
- GitHub Pages deployment workflow
- PWA manifest and JS app icons

## Compatibility
- Existing `.fjs`, `.jstemplate` and `.jsjourney` schemas are unchanged.
- Existing IndexedDB/database keys are unchanged.
- Existing node types are not renamed internally.

## Required online gate
The current generation environment could not install the project's npm dependencies before timeout, so full TypeScript typecheck/tests/Vite build could not be completed locally. GitHub Actions remains the final release gate. JSON syntax and all generated `.jsjourney` payloads were validated locally.
