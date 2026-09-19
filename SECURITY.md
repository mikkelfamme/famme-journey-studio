# Security policy

## Supported version

Security fixes are targeted at the latest public release of Famme Journey Studio.

## Reporting a vulnerability

Do not publish security-sensitive details, credentials, private workspace data or exploit instructions in a public issue. Contact the project maintainer privately through the contact method published on the repository owner profile.

## Security model

Famme Journey Studio is local-first and intentionally does not include a backend, login system or remote workspace sync in the public core. This reduces server-side attack surface but does not make exported `.fjs` or snapshot files non-sensitive. Users remain responsible for where those files are stored and shared.
