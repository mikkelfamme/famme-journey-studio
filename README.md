# Journey Studio RC12.4 update

Upload the contents of this folder to the root of the existing GitHub repository and commit to `main`.

This update makes Settings → Create desktop shortcut browser-aware. It detects Chrome, Edge, Brave, Opera, Vivaldi/Chromium where possible and provides a universal Windows `shell:AppsFolder` fallback. It never creates `.url` or `.download` Internet Shortcut files.
