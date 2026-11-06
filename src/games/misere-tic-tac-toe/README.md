# #004 Misère Tic-Tac-Toe

Tic-Tac-Toe where completing a line loses. Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Built entirely on the shared m,n,k family (`src/games/shared/mnk/`), which supports misère in the
engine (`misere: true` → completing a line records `reason: 'misere-line'` and awards the win to the
opponent), the exact solver, the heuristic (sign flipped) and the board (the line is drawn in the
loser's color). Game-specific files: `rules.ts` (`lostByForcedMove` for the Squeeze achievement),
`ai.ts`, `ai-adapter.ts`, `match.ts`, `Game.tsx` (result explanation + achievements),
`HowToPlay.tsx`, `i18n.ts`, `manifest.ts`, `assets/preview.svg`, `tests/`.
