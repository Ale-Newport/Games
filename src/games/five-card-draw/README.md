# #088 Five Card Draw Poker

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Thin module over the shared poker family in `src/games/shared/poker/` (see the Texas Hold'em
README for the files): the engine's `DRAW` variant adds the discard round and fixed-limit betting,
`draw-ai.ts` holds the discard rules and the draw-aware equity, and `PokerTable.tsx` shows five
cards, lets the player pick discards and shows how many cards each player took. This folder holds
`rules.ts`, `ai.ts`, `ai-adapter.ts`, `Game.tsx`, `HowToPlay.tsx`, `manifest.ts`,
`assets/preview.svg` and `tests/`.
