export const APP_NAME = 'Famme Journey Studio';
export const APP_VERSION = '2.0.0-rc.2';
export const APP_AUTHOR = 'Mikkel Famme';
export const APP_BRAND = 'FAMME · DIGITAL';
export const APP_RELEASE_DATE = '2026-09-20';

export const APP_RELEASE_NOTES = [
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
