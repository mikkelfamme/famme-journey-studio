export const APP_NAME = 'Journey Studio by Famme';
export const APP_SHORT_NAME = 'Journey Studio';
export const APP_VERSION = '2.0.0-rc.11';
export const APP_AUTHOR = 'Mikkel Famme';
export const APP_BRAND = 'BY FAMME';
export const APP_RELEASE_DATE = '2026-09-20';

export const APP_RELEASE_NOTES = [
  {
    version: '2.0.0-rc.11',
    title: 'Brand identity & portable templates',
    items: [
      'Product identity is now Journey Studio by Famme with JS app iconography and Journey Studio as the installed shortcut name.',
      'Custom templates can be created directly from an existing journey.',
      'Any template can be exported individually as a portable .jstemplate file and imported into another workspace.',
      'Template sharing stays separate from workspace sharing, so reusable architecture can move without exposing unrelated work.'
    ]
  },
  {
    version: '2.0.0-rc.10',
    title: 'Zoom-aligned stage backdrop',
    items: [
      'Funnel stage backgrounds track the same horizontal viewport transform as journey nodes, so zooming and panning no longer misaligns Top, Middle, Bottom and Lifecycle.',
      'Stage separators and labels remain readable while following the journey coordinate system.',
      'Creative and TODO signal badges use darker text and stronger contrast for easier scanning.'
    ]
  },
  {
    version: '2.0.0-rc.8',
    title: 'Print fidelity',
    items: [
      "Print / PDF preserves the journey's saved node positions instead of recalculating a separate layout.",
      'Printed connections use orthogonal routing based on the same source/target handle direction used by the editor.',
      'Stage bands remain visible while the journey is scaled as one diagram to fit the printed page.',
      'Selection toolbars, handles and editor state remain excluded from the exported presentation.'
    ]
  },
  {
    version: '2.0.0-rc.7',
    title: 'Locked read-only viewer',
    items: [
      'View mode has a fixed viewport: nodes, connections and the journey canvas cannot be dragged or repositioned.',
      'Stage zones stay visually aligned with their nodes because panning and zoom gestures are disabled in View mode.',
      'Connection handles remain available to the renderer but are visually hidden, restoring arrows without exposing edit affordances.',
      'The details inspector opens as an overlay so selecting a node no longer resizes or shifts the journey.'
    ]
  },
  {
    version: '2.0.0-rc.6',
    title: 'Presentation & read-only view',
    items: [
      'View mode is strictly read-only: nodes cannot be moved, connected or edited.',
      'Journey connections use stronger arrows and optional edge labels in View mode.',
      'Print / Save PDF uses a dedicated page-optimized journey rendering instead of the live editor viewport.',
      'Printed output includes journey details, URLs, tracking definitions and creative references.'
    ]
  },
  {
    version: '2.0.0-rc.5',
    title: 'View mode, media & localization',
    items: [
      'Canvas drag pans by default instead of moving multi-selected journey nodes.',
      'Dedicated View mode with clickable URLs, creative thumbnails and Print / Save as PDF.',
      'Journey cards support View, Edit, Rename and real status controls.',
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
