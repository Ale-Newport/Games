# #067 Game of the Amazons

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Self-contained module: `engine.ts` (queen moves, arrow shots, the last-to-move rule, replay
validation), `ai.ts` (queen-distance territory evaluation, full-width and selective two-ply agents),
`ai-adapter.ts`, `AmazonsBoard.tsx` (three-tap turns: amazon, square, arrow), `Game.tsx`,
`HowToPlay.tsx`, `i18n.ts`, `manifest.ts`, `assets/preview.svg`, `tests/`.
