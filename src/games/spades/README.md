# #094 Spades

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Self-contained module: `engine.ts` (deal, bidding with nil, tricks with spades trump, contract,
bag and nil scoring, the game to 500, replay validation), `ai.ts` (trick estimates, partnership
play, Hard's sampled-deal bidding and play), `ai-adapter.ts` (four seats, one hand per episode),
`SpadesGame.tsx` (menu, bidding grid, play, hints, watch mode, saves, statistics, achievements),
`Game.tsx`, `HowToPlay.tsx`, `i18n.ts`, `manifest.ts`, `assets/preview.svg`, `tests/`. Table and
trick helpers: `src/games/shared/tricks/`.
