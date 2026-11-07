# #172 Classic Snake

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

The simulation, players and drawing live in the shared snake core `../shared/snake/` (`sim.ts`,
`definition.ts`) on the shared arcade shell `../shared/arcade/`. This folder binds them:
`definition.ts` (strings and achievements), `Game.tsx`, `ai-adapter.ts`, `HowToPlay.tsx`,
`manifest.ts`, `assets/preview.svg`, `tests/`.
