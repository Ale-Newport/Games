# #006 Connect Five Gravity

9×7 gravity board, five in a row wins. Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Entirely built on the shared gravity family (`src/games/shared/gravity/`, see #005's README).
Game-specific files: `rules.ts` (board size, achievement predicates), `ai.ts` (levels tuned for the
larger board), `ai-adapter.ts`, `Game.tsx`, `HowToPlay.tsx`, `i18n.ts`, `manifest.ts`,
`assets/preview.svg` (generated original art), `tests/`.
