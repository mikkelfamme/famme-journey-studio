import { describe, expect, it } from 'vitest';
import { isWindowsDesktop, WINDOWS_HELPER_PROTOCOL } from './windowsHelper';

describe('windows helper', () => {
  it('recognizes Windows desktop browsers', () => {
    expect(isWindowsDesktop('Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Win32')).toBe(true);
  });

  it('does not mark macOS as Windows', () => {
    expect(isWindowsDesktop('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'MacIntel')).toBe(false);
  });

  it('uses a dedicated custom protocol', () => {
    expect(WINDOWS_HELPER_PROTOCOL).toBe('journeystudio-helper://create-shortcut');
  });
});
