# #019 Three-Check Chess

Chess where the third check wins. Full spec: [GAME_SPEC.md](GAME_SPEC.md).

A thin module on the shared chess family (`src/games/shared/chess/`, see
[`../chess/README.md`](../chess/README.md)). The `THREE_CHECK` variant counts checks in the state;
the shared search tracks them along each line and scores the third as a win; the definition builder
shows both counters in the status line.

Game-specific: `rules.ts`, `ai.ts`, `ai-adapter.ts`, `Game.tsx`, `HowToPlay.tsx`, `i18n.ts`,
`manifest.ts`, `assets/preview.svg`, `tests/`.
