# #100 Go Fish

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Self-contained module: `engine.ts` (2–4 players, asks, go fish with the lucky draw, books, empty
hands drawing, the end when all thirteen books are down, replay validation), `ai.ts` (public
knowledge from the asks, Easy, Medium and Hard), `ai-adapter.ts` (one game per episode, 2–4
seats), `FishGame.tsx` and `FishGame.module.css` (menu with the number of opponents, opponents'
plates with books, the pond, the ask log, rank and target picking, hints, watch mode, saves,
statistics, achievements), `Game.tsx`, `HowToPlay.tsx`, `i18n.ts`, `manifest.ts`,
`assets/preview.svg`, `tests/`.
