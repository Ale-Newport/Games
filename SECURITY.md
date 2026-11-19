# Security Policy

## Supported versions

| Version                                                                    | Supported |
| -------------------------------------------------------------------------- | --------- |
| `main` (deployed to [the live site](https://ale-newport.github.io/Games/)) | Yes       |
| Latest [release](https://github.com/Ale-Newport/Games/releases/latest)     | Yes       |
| Older releases                                                             | No        |

## Reporting a vulnerability

**Please do not open a public issue.** Report privately through GitHub:
[Security → Report a vulnerability](https://github.com/Ale-Newport/Games/security/advisories/new).

Include the affected page or game, steps to reproduce, and the impact you expect. You will get an
acknowledgement within 7 days and a status update at least every 14 days until the report is
resolved. Fixed issues are credited in the advisory unless you prefer to stay anonymous.

## Scope and threat model

Arcade AI Lab is a static site: there is no backend, no account system, no analytics and no
third-party requests. Relevant reports include, for example:

- Script injection (XSS) through game input, saved data, URL parameters or imported files.
- Bypasses of the Content-Security-Policy shipped in the production build.
- Corrupt or malicious save data in `localStorage` / IndexedDB that crashes or takes over the app.
- Vulnerable dependencies that are actually reachable from the shipped bundle.
- Weaknesses in this repository's GitHub Actions workflows (for example script injection or
  over-broad token permissions).

Out of scope: denial of service of GitHub Pages itself, social engineering, and issues that need
a compromised browser or device.

## How the project is protected

- Secret scanning and push protection are enabled; the full Git history has been scanned.
- Dependabot alerts, security updates and weekly version updates; `npm audit` and dependency
  review run in CI.
- CodeQL (`security-extended`) analyses the TypeScript, Python and workflow code on every change.
- GitHub Actions run with read-only tokens by default and actions are pinned to commit SHAs.
- Every change from outside contributors needs the maintainer's review (CODEOWNERS + rulesets),
  and workflows from first-time contributors need approval before they run.
