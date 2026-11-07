# #178 Hedgehog Crossing

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

The lanes, simulation, players and drawing live in the shared crossing core `../shared/crossing/`
(`sim.ts`, `definition.ts`) on the shared arcade shell `../shared/arcade/`. This folder binds them:
`definition.ts` (strings and achievements), `Game.tsx`, `ai-adapter.ts`, `HowToPlay.tsx`,
`manifest.ts`, `assets/preview.svg`, `tests/`.
