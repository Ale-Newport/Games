# #117 No-Guess Minesweeper

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Thin module over the shared minesweeper in `../shared/minesweeper/` (the no-guess generator lives in
its `engine.ts`: layouts redrawn until the deduction solver clears them): `engine.ts` (the three
standard boards), `ai-adapter.ts`, `Game.tsx`, `HowToPlay.tsx`, `i18n.ts`, `manifest.ts`,
`assets/preview.svg`, `tests/`.
