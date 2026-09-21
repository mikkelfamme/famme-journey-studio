export const WINDOWS_HELPER_PROTOCOL = 'journeystudio-helper://create-shortcut';
export const WINDOWS_HELPER_INSTALLER = './windows-helper/Install-Journey-Studio-Helper.vbs';
export const WINDOWS_HELPER_ZIP = './windows-helper/Journey-Studio-Windows-Helper.zip';

export function isWindowsDesktop(userAgent = navigator.userAgent, platform = navigator.platform): boolean {
  return /Windows/i.test(userAgent) || /Win/i.test(platform);
}

export function launchWindowsShortcutHelper(): void {
  window.location.href = WINDOWS_HELPER_PROTOCOL;
}
