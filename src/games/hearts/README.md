# #093 Hearts

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Self-contained module: `engine.ts` (deal, passing, tricks, points, the moon, the game to 100,
replay validation), `ai.ts` (Easy and Medium rules, Hard's sampled-deal search), `ai-adapter.ts`
(four seats, one hand per episode), `HeartsGame.tsx` (menu, passing, play, hints, watch mode,
saves, statistics, achievements), `Game.tsx`, `HowToPlay.tsx`, `i18n.ts`, `manifest.ts`,
`assets/preview.svg`, `tests/`. The table and the trick helpers live in
`src/games/shared/tricks/` (shared with the other trick-taking games).
