Journey Studio Windows Helper
=============================

Purpose
-------
Creates a real Windows .lnk desktop shortcut for an already installed Journey Studio PWA.

Install (one time)
------------------
1. Install Journey Studio as a PWA/app in your browser first.
2. Double-click Install-Journey-Studio-Helper.vbs.
3. The helper copies itself to:
   %LOCALAPPDATA%\JourneyStudioHelper
4. It registers the custom protocol journeystudio-helper:// under HKCU only.
5. It copies the installed Journey Studio Start-menu shortcut to the desktop and applies the JS icon.

No administrator rights are requested.
No PowerShell is used.
No files are written outside your own Windows profile except the desktop shortcut.

After installation
------------------
Settings > Create desktop shortcut in Journey Studio can call:
journeystudio-helper://create-shortcut

The helper then recreates Journey Studio.lnk on the current user's desktop.
