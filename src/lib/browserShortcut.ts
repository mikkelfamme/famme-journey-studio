export type ShortcutBrowserId = 'edge' | 'chrome' | 'brave' | 'opera' | 'vivaldi' | 'chromium' | 'firefox' | 'safari' | 'other';

export interface ShortcutBrowserProfile {
  id: ShortcutBrowserId;
  name: string;
  appsUrl?: string;
}

export function browserProfileFromUserAgent(userAgent: string): ShortcutBrowserProfile {
  const ua = userAgent.toLowerCase();
  if (ua.includes('edg/')) return { id: 'edge', name: 'Microsoft Edge', appsUrl: 'edge://apps' };
  if (ua.includes('opr/') || ua.includes('opera')) return { id: 'opera', name: 'Opera', appsUrl: 'opera://apps' };
  if (ua.includes('vivaldi')) return { id: 'vivaldi', name: 'Vivaldi', appsUrl: 'vivaldi://apps' };
  if (ua.includes('firefox/')) return { id: 'firefox', name: 'Firefox' };
  if (ua.includes('safari/') && !ua.includes('chrome/') && !ua.includes('chromium/')) return { id: 'safari', name: 'Safari' };
  if (ua.includes('chrome/') || ua.includes('crios/')) return { id: 'chrome', name: 'Google Chrome', appsUrl: 'chrome://apps' };
  if (ua.includes('chromium/')) return { id: 'chromium', name: 'Chromium', appsUrl: 'chrome://apps' };
  return { id: 'other', name: 'Browser' };
}

export async function detectShortcutBrowser(): Promise<ShortcutBrowserProfile> {
  const navigatorWithBrave = navigator as Navigator & { brave?: { isBrave?: () => Promise<boolean> } };
  try {
    if (navigatorWithBrave.brave?.isBrave && await navigatorWithBrave.brave.isBrave()) {
      return { id: 'brave', name: 'Brave', appsUrl: 'brave://apps' };
    }
  } catch {
    // Fall back to the user-agent based profile.
  }
  return browserProfileFromUserAgent(navigator.userAgent || '');
}
