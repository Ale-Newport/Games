# #174 Falling Blocks

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

The simulation, pieces, players and drawing live in the shared falling-blocks core
`../shared/blocks/` (`pieces.ts`, `sim.ts`, `ai.ts`, `definition.ts`) on the shared arcade shell
`../shared/arcade/`. This folder binds them: `definition.ts` (options, strings, achievements),
`Game.tsx`, `ai-adapter.ts`, `HowToPlay.tsx`, `manifest.ts`, `assets/preview.svg`, `tests/`.
