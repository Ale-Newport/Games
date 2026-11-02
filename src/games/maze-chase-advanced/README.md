# #177 Shifting Mazes

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

The maze generator, simulation, players and drawing live in the shared maze core `../shared/maze/`
(`layout.ts`, `sim.ts`, `definition.ts`) on the shared arcade shell `../shared/arcade/`. This folder
binds them: `definition.ts` (strings and achievements), `Game.tsx`, `ai-adapter.ts`,
`HowToPlay.tsx`, `manifest.ts`, `assets/preview.svg`, `tests/`.
