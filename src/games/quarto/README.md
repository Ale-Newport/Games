# #033 Quarto

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Self-contained module: `engine.ts` (pieces as 4-bit trait masks, lines, place-and-give turns),
`search.ts` (turn-level alpha-beta that never gives away a win when it can avoid it),
`ai.ts`, `ai-adapter.ts` (`GameEnvironment` and codec), `QuartoPiece.tsx` (original top-view piece
art), `QuartoBoard.tsx` (board, piece in hand, pool), `Game.tsx` (shell definition),
`HowToPlay.tsx`, `i18n.ts`, `manifest.ts`, `assets/preview.svg`, `tests/`.
