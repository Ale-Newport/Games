# #066 Chinese Checkers

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Thin module on the shared jump-race family `src/games/shared/jump-race/` (graph geometry, step and
jump-chain moves, camp rules, race evaluation, environment factory, SVG board, definition), shared
with #065 Halma. Here: `rules.ts` (121-hole star variant), `ai.ts` (levels), `ai-adapter.ts`,
`Game.tsx`, `HowToPlay.tsx`, `i18n.ts`, `manifest.ts`, `assets/preview.svg`, `tests/`.
