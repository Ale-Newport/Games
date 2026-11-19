# Contributing to Arcade AI Lab

Thanks for your interest! Bug reports, translations, accessibility fixes, new puzzle content,
stronger AI agents and documentation improvements are all welcome.

- **Questions?** Ask in [Discussions → Q&A](https://github.com/Ale-Newport/Games/discussions/categories/q-a).
- **First contribution?** Look for issues labeled
  [`good first issue`](https://github.com/Ale-Newport/Games/labels/good%20first%20issue) or
  [`help wanted`](https://github.com/Ale-Newport/Games/labels/help%20wanted).
- **Security problem?** Do not open an issue — see [SECURITY.md](SECURITY.md).

By participating you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## How changes get in

`main` and every other branch are protected. Outside contributors cannot push to this
repository; every change arrives as a pull request from a fork and is merged only after the
maintainer ([@Ale-Newport](https://github.com/Ale-Newport), the code owner of every file) has
reviewed and approved it. New pushes to a pull request dismiss earlier approvals, and all review
threads must be resolved. CI runs on every pull request; for first-time contributors the
maintainer approves the workflow run first.

1. For anything larger than a small fix, open or comment on an issue first so we can agree on
   the approach.
2. Fork the repository and create a branch: `git checkout -b fix/sokoban-undo`.
3. Make your change, with tests (see below).
4. Run the checks locally (`npm run verify`, or at least lint, typecheck and the affected tests).
5. Open a pull request and fill in the template. Keep pull requests focused: one fix or feature
   per pull request.

## Development setup

Requirements: Node.js 22.18+ (CI uses Node 24) and npm 10+.

```bash
git clone https://github.com/<you>/Games.git && cd Games
npm ci
npm run dev                          # http://localhost:5173
npx playwright install chromium      # once, for browser tests
```

| Command                     | What it does                                          |
| --------------------------- | ----------------------------------------------------- |
| `npm run lint`              | ESLint (zero warnings allowed)                        |
| `npm run format`            | Prettier (CI runs `npm run format:check`)             |
| `npm run typecheck`         | TypeScript strict project check                       |
| `npm test`                  | All Vitest suites (unit, AI contract, roadmap)        |
| `npm run test:game -- <id>` | One game's tests, e.g. `npm run test:game -- sokoban` |
| `npm run test:e2e`          | Playwright, desktop + mobile (builds first)           |
| `npm run verify`            | Everything CI runs, in order                          |

## Project conventions

These keep 230 games consistent and testable. Reviews check them.

- **Pure rules engines.** Each game's `rules.ts` / `engine.ts` is independent of React and the
  DOM. Randomness uses the seeded RNG in `src/core/game-engine/random.ts` with its state stored
  in the game state — never `Math.random()` in rules.
- **AI adapters wrap the same engine.** `ai-adapter.ts` implements the `GameEnvironment` contract
  (see [docs/ai-integration.md](docs/ai-integration.md)) and must pass the shared contract suite.
  Hidden information must never leak into another player's observation.
- **TypeScript strict** with `noUncheckedIndexedAccess`; type-only imports use `import type`.
- **Localization.** Every user-facing string exists in English and Spanish, in the game module.
- **Accessibility.** Keyboard, mouse and touch for every game; visible focus; dark and light
  themes via the CSS tokens in `src/styles/tokens.css`; honor reduced motion and colorblind mode.
- **Saves** go through `services.saveSlot({ schema, validate, migrations })`, versioned and
  validated.
- **Clean up** listeners, timers and animation frames on unmount.
- **Original assets only.** No sprites, music, logos, level layouts or names taken from
  commercial games. Generic names for trademarked games (e.g. "Four in a Row"). Any third-party
  data must have a compatible license and be listed in
  [docs/asset-licenses.md](docs/asset-licenses.md).
- **No fakes.** No placeholder mechanics, hardcoded wins or decorative-only buttons. If something
  is simplified, the game's `README.md` says so.

## Tests

- Rules changes need unit tests next to the engine (`src/games/<id>/tests/`).
- UI flows are covered by `tests/e2e/games/<id>.spec.ts` (Playwright, desktop and mobile).
- Bug fixes should come with a test that fails without the fix.

## Adding or changing a game

Each game lives in `src/games/<id>/` with a `README.md` that specifies its exact ruleset, modes,
controls, save format, tests and AI interface. The catalog and statuses live in
`src/data/roadmap.ts`; run `npm run roadmap` to regenerate [docs/ROADMAP.md](docs/ROADMAP.md).
The full definition of done is in [docs/game-standards.md](docs/game-standards.md) and the module
layout in [docs/architecture.md](docs/architecture.md). Please discuss new games in an issue
before starting: they are large, and they must meet every item of the definition of done.

## Commit messages

Conventional style: `fix(sokoban): keep undo history after restart`,
`feat(ai): add expectimax agent`, `docs: clarify training bridge setup`. Add an entry under
**Unreleased** in [CHANGELOG.md](CHANGELOG.md) for user-visible changes.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
