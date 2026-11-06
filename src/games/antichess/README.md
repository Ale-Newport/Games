# #017 Antichess

Losing chess (international antichess rules). Full spec: [GAME_SPEC.md](GAME_SPEC.md).

A thin module on the shared chess family (`src/games/shared/chess/`, see
[`../chess/README.md`](../chess/README.md)). The `ANTICHESS` variant turns on compulsory captures,
a non-royal king (no check, capturable, no castling), promotion to king, "no pieces or no moves
wins", and the opposite-colored-bishops dead draw; the shared search negates material so the
computer tries to give pieces away. The status line shows the pieces left and when a capture is
compulsory.

Game-specific: `rules.ts` (variant + achievement predicates), `ai.ts`, `ai-adapter.ts`, `Game.tsx`,
`HowToPlay.tsx`, `i18n.ts`, `manifest.ts`, `assets/preview.svg`, `tests/`.
