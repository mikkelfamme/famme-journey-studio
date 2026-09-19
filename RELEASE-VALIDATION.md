# Release validation — 2.0.0-rc.1

Checks completed in the generation environment:

- TypeScript/TSX syntax transpilation across the source/test tree
- relative-import integrity scan
- public-core company-term safety scan
- legacy migration exercised against a real previous-prototype backup
- demo workspace engine executed with synthetic intelligence data
- portfolio transformation executed without mutating source data
- PWA icon files generated at 192px and 512px
- GitHub Pages workflow aligned with current official Pages action pattern

Not completed in this environment:

- dependency-backed `npm install`, `npm test` and `npm run build` because external npm registry access timed out
- live GitHub Pages deployment
- browser PWA installation against the final hosted origin

GitHub Actions is the required clean online gate before RC1 becomes `v2.0.0`.

## RC1 publication checks

- [ ] `npm run check:release` passes on GitHub Actions
- [ ] Pages source is configured to GitHub Actions
- [ ] Pages workflow publishes the `dist/` artifact
- [ ] Blank workspace can be created on the hosted app
- [ ] Demo workspace opens with synthetic data only
- [ ] Autosave and recovery work after a page reload
- [ ] `.fjs` export/import roundtrip works
- [ ] PWA manifest and icons load without 404s
- [ ] Service worker registers after a production visit
- [ ] Offline reload works after the app has been cached
- [ ] Install prompt or browser install option appears where policy permits
- [ ] Portfolio export removes selected sensitive layers
- [ ] Public repository history contains no private workspace or snapshot data
