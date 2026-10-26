# #090 Seven Card Stud

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Thin module over the shared poker family in `src/games/shared/poker/` (see the Texas Hold'em
README for the files): the engine's `STUD` variant adds antes, the bring-in, up and down cards,
the best-showing-hand order and fixed limits that double from fifth street; `stud-ai.ts` estimates
equity over the cards everyone can see; `PokerTable.tsx` shows seven cards per seat with only the
down cards hidden. This folder holds `rules.ts`, `ai.ts`, `ai-adapter.ts`, `Game.tsx`,
`HowToPlay.tsx`, `manifest.ts`, `assets/preview.svg` and `tests/`.
