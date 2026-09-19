# Public release checklist

## Repository
- [ ] Public repository created
- [ ] Repository description added
- [ ] License visible
- [ ] README renders correctly
- [ ] No confidential data in git history
- [ ] No company-specific production workspaces committed

## CI / build
- [ ] CI passes
- [ ] Typecheck passes
- [ ] Tests pass
- [ ] Production build passes
- [ ] Pages workflow deploys

## Product smoke test
- [ ] Blank workspace can be created
- [ ] Demo workspace opens
- [ ] Journey can be edited and autosaved
- [ ] `.fjs` export/import roundtrip works
- [ ] Performance snapshot import works
- [ ] Actual-path import works
- [ ] Recovery snapshot can be restored
- [ ] Portfolio export removes selected sensitive layers

## PWA
- [ ] Manifest loads
- [ ] 192px and 512px icons load
- [ ] Service worker registers
- [ ] Offline reload works after first successful visit
- [ ] Install prompt appears where browser policy permits

## Public safety
- [ ] Generic demo data only
- [ ] No organization credentials
- [ ] No internal campaign names
- [ ] No private analytics identifiers
- [ ] Privacy and security docs reviewed
