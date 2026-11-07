# #138 Number Trios

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

A threes-style sliding number puzzle under a generic name. `engine.ts` (one-step shifts, the 1+2
and equal-pair merges, the tile deck, scoring, expectimax search), `play.ts` (levels, state with
undo and replay validation), `ai.ts`, `ai-adapter.ts`, `TriosGame.tsx` + `Trios.module.css`,
`HowToPlay.tsx`, `i18n.ts`, `sounds.ts`, `manifest.ts`, `assets/preview.svg`, `tests/`.
