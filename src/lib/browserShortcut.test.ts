import { describe, expect, it } from 'vitest';
import { browserProfileFromUserAgent } from './browserShortcut';

describe('browserProfileFromUserAgent', () => {
  it('detects Chrome before generic Chromium handling', () => {
    expect(browserProfileFromUserAgent('Mozilla/5.0 Chrome/140.0.0.0 Safari/537.36')).toMatchObject({ id: 'chrome', appsUrl: 'chrome://apps' });
  });

  it('detects Edge separately from Chrome', () => {
    expect(browserProfileFromUserAgent('Mozilla/5.0 Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0')).toMatchObject({ id: 'edge', appsUrl: 'edge://apps' });
  });

  it('detects Opera and Vivaldi separately', () => {
    expect(browserProfileFromUserAgent('Mozilla/5.0 Chrome/140.0.0.0 Safari/537.36 OPR/120.0.0.0')).toMatchObject({ id: 'opera', appsUrl: 'opera://apps' });
    expect(browserProfileFromUserAgent('Mozilla/5.0 Chrome/140.0.0.0 Safari/537.36 Vivaldi/7.0')).toMatchObject({ id: 'vivaldi', appsUrl: 'vivaldi://apps' });
  });

  it('uses a generic profile for Firefox', () => {
    expect(browserProfileFromUserAgent('Mozilla/5.0 Firefox/143.0')).toMatchObject({ id: 'firefox', name: 'Firefox' });
  });
});
