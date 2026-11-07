# #160 Riichi Mahjong

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

`tiles.ts` (kinds, dora order), `hand.ts` (winning shapes, shanten, waits), `yaku.ts` (yaku, fu,
han, limits, payments), `engine.ts` (the East-only game: walls, turns, claims, riichi, furiten,
draws, honba and sticks, replay validation, observations), `ai.ts` (efficient and careful players),
`ai-adapter.ts`, `RiichiTable.tsx` + `Riichi.module.css`, `HowToPlay.tsx`, `i18n.ts` (with yaku
names), `sounds.ts`, `manifest.ts`, `assets/preview.svg`, `tests/`. Tile faces come from
`../shared/mjtiles/Face.tsx`.
