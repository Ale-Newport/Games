# #196 Rooftop Dash

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

`sim.ts` holds the world generator (roofs, chimneys, drones, coins), the runner's movement (shared by
the game and the planner), the run and the two AI players; `definition.ts` the drawing, controls,
sounds and strings for the shared arcade shell `../shared/arcade/`. Also `Game.tsx`, `ai-adapter.ts`,
`HowToPlay.tsx`, `manifest.ts`, `assets/preview.svg`, `tests/`.
