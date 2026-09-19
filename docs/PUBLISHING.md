# Publishing Famme Journey Studio on GitHub Pages

The repository is prepared for GitHub Pages through `.github/workflows/pages.yml`.

## First publication

1. Create a new GitHub repository, for example `famme-journey-studio`.
2. Put the contents of this source package at the repository root.
3. Push to the `main` branch.
4. Open **Settings → Pages** in GitHub.
5. Under **Build and deployment**, choose **GitHub Actions** as the source.
6. Open **Actions** and confirm that `CI` and `Deploy PWA to GitHub Pages` pass.
7. Open the deployment URL shown by the Pages workflow.

The application uses relative Vite asset paths, so it can be hosted under a repository path such as `/<repository-name>/` without hardcoding a GitHub username.

## Release gate

Do not call a commit a public release until all of these pass in GitHub Actions:

- TypeScript typecheck
- Vitest test suite
- Vite production build
- GitHub Pages artifact upload
- GitHub Pages deploy
- Browser smoke test of the published URL
- PWA installability check in a supported browser

## Updating the public application

A push to `main` triggers a fresh Pages build and deployment. Tagged versions beginning with `v` also trigger `release-build.yml`, which packages the production `dist/` folder as a downloadable Actions artifact.
