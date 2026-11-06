# #028 Hex 7×7

Hex on the 7×7 board with the swap rule. Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Built on `src/games/shared/hex/` (shared by #028–#029): `engine.ts` (rules, swap, winning chain),
`mcts.ts` (UCT + RAVE over random fills), `environment.ts`, `HexBoard.tsx` (SVG hex grid),
`definition.ts`, `HowToPlay.tsx`, `i18n.ts`, `HexSeatIcon.tsx`.

Game-specific: `rules.ts`, `ai.ts`, `ai-adapter.ts`, `Game.tsx`, `HowToPlay.tsx`, `i18n.ts`,
`manifest.ts`, `assets/preview.svg`, `tests/`.
