# #034 Pentago

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Self-contained module: `engine.ts` (6×6 board, quadrant twists, 32 lines of five, results),
`search.ts` (alpha-beta on raw boards with static move ordering and a beam), `ai.ts`,
`ai-adapter.ts` (`GameEnvironment` and codec), `PentagoBoard.tsx` (quadrants with twist arrows and
an animated twist), `Game.tsx`, `HowToPlay.tsx`, `i18n.ts`, `manifest.ts`, `assets/preview.svg`,
`tests/`.
