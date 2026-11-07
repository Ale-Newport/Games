# #116 Classic Minesweeper

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Thin module over the shared minesweeper in `../shared/minesweeper/` (engine with first-click-safe
placement, chords, deductions and no-guess generation; agents and environment; `MinesGame.tsx`
table; rules): `engine.ts` (the three standard boards), `ai-adapter.ts`, `Game.tsx`,
`HowToPlay.tsx`, `i18n.ts`, `manifest.ts`, `assets/preview.svg`, `tests/`.
