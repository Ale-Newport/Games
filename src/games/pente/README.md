# #009 Pente

Five in a row plus pair captures on 19×19. Full spec: [GAME_SPEC.md](GAME_SPEC.md).

| File                                                            | Role                                                                                       |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `engine.ts`, `rules-meta.ts`                                    | Pure rules (captures, two win conditions, opening + tournament rule, replay validation)    |
| `rules.ts`                                                      | `TwoPlayerRules` binding and achievement predicates                                        |
| `heuristic.ts`                                                  | Evaluation (tempo-weighted windows, threat detection, capture terms) and candidate pruning |
| `ai.ts`, `ai-adapter.ts`                                        | Levels on the generic `AlphaBetaAgent`; `GameEnvironment`                                  |
| `Game.tsx`                                                      | Board (shared `GoBoard`), capture marks, live counters, sounds, achievements               |
| `HowToPlay.tsx`, `i18n.ts`, `manifest.ts`, `assets/preview.svg` | Rules, strings, metadata, art                                                              |
