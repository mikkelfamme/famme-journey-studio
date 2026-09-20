export const APP_NAME = 'Famme Journey Studio';
export const APP_VERSION = '2.0.0-rc.7';
export const APP_AUTHOR = 'Mikkel Famme';
export const APP_BRAND = 'FAMME · DIGITAL';
export const APP_RELEASE_DATE = '2026-09-20';

export const APP_RELEASE_NOTES = [
  {
    version: '2.0.0-rc.7',
    title: 'Locked read-only viewer',
    items: [
      'View mode now has a fixed viewport: nodes, connections and the journey canvas cannot be dragged or repositioned.',
      'Stage zones stay visually aligned with their nodes because panning and zoom gestures are disabled in View mode.',
      'Connection handles remain available to the renderer but are visually hidden, restoring arrows without exposing edit affordances.',
      'The details inspector opens as an overlay so selecting a node no longer resizes or shifts the journey.'
    ]
  },
  {
    version: '2.0.0-rc.6',
    title: 'Presentation & read-only view',
    items: [
      'View mode is now strictly read-only: nodes cannot be moved, connected or edited.',
      'Journey connections use stronger arrows and optional edge labels in View mode.',
      'Print / Save PDF now uses a dedicated page-optimized journey rendering instead of the live editor viewport.',
      'Printed output includes journey details, URLs, tracking definitions and creative references.'
    ]
  },
  {
    version: '2.0.0-rc.5',
    title: 'View mode, media & localization',
    items: [
      'Canvas drag now pans by default instead of moving multi-selected journey nodes.',
      'Dedicated View mode with clickable URLs, creative thumbnails and Print / Save as PDF.',
      'Journey cards now support View, Edit, Rename and real status controls.',
      'English/Danish UI language switch backed by editable locale JSON files.'
    ]
  },
  {
    version: '2.0.0-rc.4',
    title: 'Editor UX & compact flow',
    items: [
      'Compact stage-aware layout and one-click Fit/Tidy controls.',
      'Subtle funnel stage zones that make the journey easier to scan.',
      'Automatic path highlighting from the selected node and quieter unrelated branches.',
      'Auto-collapsing inspector, simplified Review menu and faster node quick actions.'
    ]
  },
  {
    version: '2.0.0-rc.3',
    title: 'Journey Editor polish',
    items: [
      'Redesigned journey nodes with stronger hierarchy, type icons and quieter connection handles.',
      'Searchable, grouped component palette for faster journey construction.',
      'Collapsible palette and inspector to create more canvas space when needed.',
      'Refined node inspector, toolbar, selection states and editor ergonomics.'
    ]
  },
  {
    version: '2.0.0-rc.2',
    title: 'Polish & updates',
    items: [
      'Premium visual refresh across navigation, cards, editor and onboarding.',
      'In-app update prompt for new PWA versions.',
      'Offline-ready confirmation and clearer local-first status.',
      'Release/update documentation and safer production workflow.'
    ]
  },
  {
    version: '2.0.0-rc.1',
    title: 'Public release candidate',
    items: [
      'Installable PWA and GitHub Pages distribution.',
      'Recovery, import preview, command palette and release hardening.',
      'Public-safe core with no company-specific data bundled.'
    ]
  }
] as const;
