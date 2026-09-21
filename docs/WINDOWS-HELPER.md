# Windows desktop helper

Journey Studio is a PWA. Browser JavaScript cannot directly write a Windows `.lnk` file to the desktop. RC12.6 adds an optional per-user Windows helper for users who want a real one-click desktop-shortcut action from Settings.

## Security model
The helper:
- requires no administrator rights;
- uses no PowerShell;
- copies itself to `%LOCALAPPDATA%\JourneyStudioHelper`;
- writes protocol registration only under `HKCU\Software\Classes\journeystudio-helper`;
- creates or replaces `%USERPROFILE%\Desktop\Journey Studio.lnk`;
- searches only the current/common Windows Start-menu Programs folders for an existing Journey Studio PWA shortcut;
- downloads only the published Journey Studio `.ico` asset from the app's GitHub Pages origin.

## Protocol
`journeystudio-helper://create-shortcut`

The registered handler calls the helper through Windows Script Host. The helper copies the installed PWA Start-menu shortcut rather than creating an Internet Shortcut, preserving the browser/PWA launch target.

## Managed Windows environments
If Windows Script Host is disabled by organizational policy, the VBS helper cannot run. In that case a compiled native per-user helper is the next implementation path.
