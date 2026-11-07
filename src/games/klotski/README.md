# #140 Sliding Blocks

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

The klotski-style sliding-block tray under a generic name. `board.ts` (position keys, blocks,
free-path moves), `engine.ts` (state, move counting, undo, breadth-first solver, replay
validation), `puzzles.ts` (the bank from `tools/generate-klotski.ts`), `ai.ts`, `ai-adapter.ts`,
`KlotskiGame.tsx` + `Klotski.module.css`, `HowToPlay.tsx`, `i18n.ts`, `sounds.ts`, `manifest.ts`,
`assets/preview.svg`, `tests/`.
