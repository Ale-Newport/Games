# #168 Enhanced Brick Breaker

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

The simulation, rule sets, players and drawing live in the shared brick core `../shared/bricks/`
(`sim.ts`, `rules.ts`, `definition.ts`) on the shared arcade shell `../shared/arcade/`. This folder
binds them: `definition.ts` (strings and achievements), `Game.tsx`, `ai-adapter.ts`,
`HowToPlay.tsx`, `manifest.ts`, `assets/preview.svg`, `tests/`.
