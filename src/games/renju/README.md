# #008 Renju

Five in a row with RIF restrictions on Black. Full spec: [GAME_SPEC.md](GAME_SPEC.md).

| File                                                            | Role                                                                                                                                                |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `forbidden.ts`                                                  | RIF forbidden-move detector for Black: exact five, overline, fours (incl. same-line 4-4 and straight four), recursive "real three" (3-3), fast path |
| `rules.ts`, `rules-meta.ts`                                     | Renju legality and play on the m,n,k engine (center opening, forbidden points, exact-five line) + `TwoPlayerRules`                                  |
| `ai.ts`, `ai-adapter.ts`                                        | Four levels of the shared five-in-a-row agent with forbidden-point awareness; environment overriding legality                                       |
| `Game.tsx`                                                      | `createStoneGame` definition with forbidden-point marks and achievements                                                                            |
| `HowToPlay.tsx`, `i18n.ts`, `manifest.ts`, `assets/preview.svg` | Rules, strings, metadata, art                                                                                                                       |

Documented simplification: the tournament opening protocol (swap + two fifth-move proposals) is not
implemented; only the RIF first-stone-in-the-center rule is enforced.
