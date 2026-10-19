# Architecture

## Overview

Arcade AI Lab is a static single-page application (React 19 + TypeScript + Vite) deployed to
GitHub Pages. There is no server: games, saves, statistics and AI evaluation all run in the
browser. Optional Python training (future) talks to the same TypeScript rules engines through a
Node bridge (`tools/env-server.ts`).

```
index.html ─► src/main.tsx ─► PlatformProvider (settings, profiles, audio, toasts, kv store)
                               └─► App (hash router) ─► AppShell ─► pages
                                                          └─► GamePage ─► lazy GameModule.Game
src/games/registry.ts   eager manifests (tiny) + lazy loaders (code-split per game)
src/ai/adapters/registry.ts   lazy AI bundles (env + agents), no React/CSS
```

## Routing

Hash routes (`#/`, `#/library?category=board`, `#/game/<id>?mode=watch`, `#/ai-lab`,
`#/profile`, `#/settings`, `#/roadmap`). The hash never reaches the server, so direct links and
refreshes work on GitHub Pages without rewrite rules. Vite uses `base: './'`, so the same build
works at `https://<user>.github.io/` and `https://<user>.github.io/<repo>/` (override with
`BASE_PATH`).

## Code splitting

- `src/games/registry.ts` imports each game's `manifest.ts` eagerly (metadata + preview URL) and
  its `index.ts` lazily via `import()`. Each game is its own chunk; nothing loads until opened.
- `src/ai/adapters/registry.ts` lazily imports each game's `ai-adapter.ts`. Adapters must import
  only rules code so they run in Web Workers and Node.
- Shared family engines (`src/games/shared/*`) are chunked automatically by Vite.

## Platform services

`GamePage` builds a `GameServices` object for the running game (`src/core/game-engine/types.ts`):
locale, reduced motion, colorblind flag, `playSound`, `recordResult`, `getStats`,
`unlockAchievement`, versioned `saveSlot`, the profile name and URL launch parameters. Games never
touch storage or the DOM outside their own subtree directly.

## Persistence

- **Settings** (theme, language, sound, volume, motion, colorblind) → LocalStorage
  (`aal.settings`), versioned envelope.
- **Profiles** (favorites, recents, per-game and per-mode statistics, achievements, save index) →
  IndexedDB key `profile:<id>`, index at `profiles`. Loaded into memory at boot, written through.
- **Game saves** → IndexedDB `save:<profileId>:<gameId>`, versioned envelopes from
  `src/core/persistence/versioned.ts` with per-game schema, migrations and validators. Corrupt or
  future-schema saves are discarded with a console warning, never crash the UI.
- **AI evaluation history** → IndexedDB `ai-eval:<iso-date>`.
- If IndexedDB is unavailable (private mode), an in-memory store is used for the session.

## Determinism

- `src/core/game-engine/random.ts`: xoshiro128** seeded via SplitMix32. States carry their RNG
  state (4 uint32) so they clone/serialize exactly.
- Turn-based games never depend on frame timing. Real-time games use
  `src/core/rendering/fixed-step-loop.ts` (fixed `hz`, render interpolation only).
- `src/core/replay/replay.ts`: `{seed, config, actions}` records replay through the adapter.

## Game module layout

```
src/games/<id>/
  GAME_SPEC.md   ruleset & design (written first)
  README.md      implementation notes
  manifest.ts    GameManifest (eager)
  index.ts       exports { Game, Rules } (lazy)
  rules.ts       pure rules engine (or engine.ts / state.ts / actions.ts for bigger games)
  ai.ts          computer-opponent configuration (uses src/ai/agents)
  ai-adapter.ts  AiBundle: GameEnvironment + agent presets
  Game.tsx       UI component; Board/renderer components; *.module.css
  HowToPlay.tsx  exports `Rules` (rules dialog content; never name it Rules.tsx — clashes with rules.ts on case-insensitive filesystems)
  audio.ts       SoundSpec definitions
  i18n.ts        game strings (en/es)
  assets/        preview.svg and other original assets
  tests/         Vitest suites (rules, adapter contract, UI)
```

## Styling

Design tokens in `src/styles/tokens.css` (dark default, light theme, colorblind player palette),
global primitives in `src/styles/global.css` (`.btn`, `.chip`, `.panel`, `.page`), and CSS Modules
per component. Fonts (Inter, Outfit) are bundled from `@fontsource-variable` (OFL).

## AI subsystem

See `docs/ai-integration.md`.

## Testing

- Vitest (node environment by default; per-file `// @vitest-environment jsdom` for UI tests).
  `tests/setup.ts` installs `fake-indexeddb`.
- `src/ai/protocols/contract-suite.ts` — every game runs the adapter contract suite.
- `tests/platform/roadmap.test.ts` — roadmap/registry/docs consistency, ROADMAP.md sync.
- Playwright (`tests/e2e/`) against the production build (`vite preview`), desktop and mobile
  (Pixel 7) projects; includes layout-overflow checks and screenshots.
