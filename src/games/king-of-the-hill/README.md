# #018 King of the Hill Chess

Chess with a central goal. Full spec: [GAME_SPEC.md](GAME_SPEC.md).

A thin module on the shared chess family (`src/games/shared/chess/`, see
[`../chess/README.md`](../chess/README.md)). The `KING_OF_THE_HILL` variant adds the hill win
(d4/e4/d5/e5) to checkmate; the board marks the hill squares; the shared search scores a hill
arrival as a mate and adds a king-centralization term; a bare king is never a dead draw here.

Game-specific: `rules.ts`, `ai.ts`, `ai-adapter.ts`, `Game.tsx`, `HowToPlay.tsx`, `i18n.ts`,
`manifest.ts`, `assets/preview.svg`, `tests/`.
