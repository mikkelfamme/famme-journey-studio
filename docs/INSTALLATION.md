# Installation and offline use

Famme Journey Studio is distributed primarily as a Progressive Web App (PWA).

## Browser use

Open the published GitHub Pages URL in a current Chromium-based browser or another browser with the required web platform support. No account is required.

## Install as an app

When the browser determines that the PWA is installable, Famme Journey Studio shows an **Install app** button in the top bar. The browser remains responsible for the actual installation and may hide or block installation according to device or organization policy.

A browser installation typically gives the app its own window and launcher/start-menu entry while continuing to use the browser's secure web runtime.

## Offline behavior

The production PWA precaches the application shell. Workspace data is stored locally in IndexedDB. An offline indicator appears in the top bar when the device loses network access.

Users should still export `.fjs` backups for important workspaces. Browser storage can be cleared by the user, the operating system or enterprise policy.
