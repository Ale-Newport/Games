# #051 Sprouts

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Self-contained module: `engine.ts` (grid geometry: curves as cell paths, reserved room around living
spots, regions, joinable pairs, new-spot placement), `route.ts` (Dijkstra routing with random costs),
`ai.ts` (Monte Carlo agents), `ai-adapter.ts`, `SproutsBoard.tsx` (freehand drawing and tap-to-connect),
`Game.tsx`, `HowToPlay.tsx`, `i18n.ts`, `manifest.ts`, `assets/preview.svg`, `tests/`.
