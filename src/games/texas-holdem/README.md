# #087 Texas Hold'em Poker

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Thin module over the shared community-card poker family in `src/games/shared/poker/`:
`hands.ts` (five-card scores, best of seven, Omaha two-plus-three), `engine.ts` (sit-and-go
tournament: blinds and levels, no-limit / pot-limit betting, short all-ins, side pots, eliminations,
replay validation), `ai.ts` (Monte Carlo equity with range reading, three styles), `environment.ts`
(one hand per episode, masked observations), `PokerTable.tsx` (menu, table, betting controls,
coach, Watch AI, saves, statistics, achievements), `HowToPlay.tsx`, `i18n.ts`, `sounds.ts`. This
folder holds `rules.ts` (the no-limit variant), `ai.ts`, `ai-adapter.ts`, `Game.tsx`,
`HowToPlay.tsx`, `manifest.ts`, `assets/preview.svg` and `tests/`.
