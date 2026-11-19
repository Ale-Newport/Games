# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-11-19

First stable release: the complete catalog of 230 games, playable at
<https://ale-newport.github.io/Games/>.

### Added

- **230 complete browser games** in seven families: classic board and abstract strategy (chess
  and its variants, shogi, xiangqi, janggi, go, draughts, m,n,k games, mancala, tafl…),
  mathematical and historical strategy, card games and solitaires, puzzles and logic, dice,
  dominoes and social games, arcade, platformers and physics, and viral web, word and party
  games. Every game has its full ruleset, all of its modes and levels, computer opponents,
  original art and synthesized sound. See [docs/ROADMAP.md](docs/ROADMAP.md).
- **AI research core:** every game exposes the same `GameEnvironment` contract over its real
  rules engine, with random, MCTS, alpha-beta and CFR baseline agents, a shared contract test
  suite, an in-browser AI Lab for agent-vs-agent evaluation in a Web Worker, a reproducible
  evaluation CLI (`npm run evaluate`) and a JSON-lines environment server for Python training.
- **Platform:** game library grouped by family with search and filters, profiles with
  statistics, achievements and saves (IndexedDB, versioned and validated), English and Spanish,
  dark and light themes, colorblind palette, reduced motion, keyboard, mouse and touch.
- Contributor documentation: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, issue and
  pull request templates, and an MIT `LICENSE`.
- `BASE_PATH` can be set in a `.env` file (see `.env.example`).
- Release workflow: pushing a `vX.Y.Z` tag publishes a GitHub Release with these notes and the
  static build attached.

### Changed

- CI split into parallel jobs (lint/format/typecheck, sharded unit tests, build, sharded
  Playwright tests) with a single required `CI passed` check; deployment to GitHub Pages runs
  only after every job succeeds.
- Development dependencies updated within their semver ranges.

### Fixed

- Games that load data files on demand (word vectors, doodle model and drawings, the Syllable
  Bomb dictionary) no longer parse HTTP error pages as data, and a failed download is retried
  the next time the game opens instead of being cached for the rest of the session.

### Security

- Production builds ship a strict Content-Security-Policy (same-origin scripts only, no
  `eval`, no plugins).
- Branch and tag rulesets: changes from anyone but the maintainer need a pull request approved
  by the code owner; force pushes and deletions are blocked.
- Secret scanning with push protection, Dependabot alerts and security updates, private
  vulnerability reporting, CodeQL, `npm audit` and dependency review in CI. GitHub Actions use
  read-only tokens by default and SHA-pinned actions.

[Unreleased]: https://github.com/Ale-Newport/Games/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Ale-Newport/Games/releases/tag/v1.0.0
