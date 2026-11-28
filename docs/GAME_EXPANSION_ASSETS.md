# Game Expansion Assets

All visuals and sounds of the expansion games are original to this project: SVG drawn in code,
CSS over the platform tokens, and Web Audio synthesized effects. No artwork, card text, logo,
map layout or faction design of a commercial game is used; board games get original themes.

| Game | Asset                                        | Location                                       | Provenance                                                                                                    |
| ---- | -------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| #231 | Preview illustration                         | `src/games/graph-forecast/assets/preview.svg`  | Hand-authored SVG                                                                                             |
| #231 | Chart, reveal, legend                        | `src/games/graph-forecast/ForecastChart.tsx`   | Drawn in code (SVG)                                                                                           |
| #231 | Sounds (pen, good/great/poor)                | `src/games/graph-forecast/sounds.ts`           | Synthesized (Web Audio parameters)                                                                            |
| #231 | Flags                                        | `flag-icons` package (already bundled)         | MIT; flags are public symbols                                                                                 |
| #231 | Icons                                        | `lucide-react` (already bundled)               | ISC                                                                                                           |
| #232 | Preview illustration                         | `src/games/size-sense/assets/preview.svg`      | Hand-authored SVG                                                                                             |
| #232 | 25 object silhouettes                        | `src/games/size-sense/Silhouettes.tsx`         | Original SVG paths drawn for this project                                                                     |
| #232 | Sounds                                       | `src/games/size-sense/sounds.ts`               | Synthesized (Web Audio parameters)                                                                            |
| #233 | Preview, ruler, dials                        | `src/games/order-of-magnitude/`                | Hand-authored SVG / CSS                                                                                       |
| #233 | Sounds                                       | `src/games/order-of-magnitude/sounds.ts`       | Synthesized (Web Audio parameters)                                                                            |
| #234 | Preview, range scale                         | `src/games/rough-guess/`                       | Hand-authored SVG / CSS                                                                                       |
| #234 | Sounds                                       | `src/games/rough-guess/sounds.ts`              | Synthesized (Web Audio parameters)                                                                            |
| #235 | Preview, target, scoreboard                  | `src/games/closest-call/`                      | Hand-authored SVG / CSS                                                                                       |
| #235 | Sounds                                       | `src/games/closest-call/sounds.ts`             | Synthesized (Web Audio parameters)                                                                            |
| #236 | Preview, scatter chart                       | `src/games/plot-the-point/`                    | Hand-authored SVG / CSS                                                                                       |
| #236 | Sounds                                       | `src/games/plot-the-point/sounds.ts`           | Synthesized (Web Audio parameters)                                                                            |
| #237 | 8 category illustrations                     | `src/games/price-check/CategoryArt.tsx`        | Original SVG                                                                                                  |
| #237 | 277 product photos                           | `src/games/price-check/images/`                | Wikimedia Commons (free licences), credited per photo                                                         |
| #238 | Ladder, preview, sounds                      | `src/games/clue-ladder/`                       | Hand-authored SVG / CSS, synthesized sounds                                                                   |
| #239 | Timeline, recap, preview                     | `src/games/year-guess/Timeline.tsx`, `assets/` | Drawn in code (SVG), hand-authored SVG                                                                        |
| #239 | Sounds                                       | `src/games/year-guess/sounds.ts`               | Synthesized (Web Audio parameters)                                                                            |
| #240 | 137 reviews (EN + ES)                        | `src/games/one-star-landmarks/reviews.ts`      | Written for this game (original text)                                                                         |
| #240 | Review card, map pins, preview, sounds       | `src/games/one-star-landmarks/`                | CSS, drawn in code (SVG), Natural Earth shapes (public domain), synthesized sounds                            |
| #241 | Board, tray, preview, sounds                 | `src/games/fact-match/`                        | CSS, hand-authored SVG, synthesized sounds                                                                    |
| #242 | 365 aerial photographs                       | `src/games/aerial-eye/images/`, `credits.json` | Wikimedia Commons (free licences), credited per photo                                                         |
| #242 | Photo frame, options, preview, sounds        | `src/games/aerial-eye/`                        | CSS, hand-authored SVG, synthesized sounds                                                                    |
| #243 | Line, pins, preview, sounds                  | `src/games/number-line/`                       | Drawn in code (SVG), hand-authored SVG, synthesized sounds                                                    |
| #244 | Preview, world guide, sounds                 | `src/games/trend-draw/`                        | Hand-authored SVG, drawn in code (#231's chart), synthesized sounds                                           |
| #245 | Chart, gap handles, preview, sounds          | `src/games/gap-graph/`                         | Drawn in code (SVG), hand-authored SVG, synthesized sounds                                                    |
| #246 | Tiles, keypad, preview, sounds               | `src/games/equation-guess/`                    | CSS, hand-authored SVG, synthesized sounds                                                                    |
| #247 | Island, glyphs, pieces, preview, sounds      | `src/games/hex-isles/`                         | Drawn in code (SVG from the engine geometry), generated SVG, synthesized sounds                               |
| #248 | World map, badges, cards, preview, sounds    | `src/games/world-conquest/`                    | Generated in code (hex-grid map from `map.ts`), generated SVG, synthesized sounds                             |
| #249 | Board, tokens, cards, preview, sounds        | `src/games/land-baron/`                        | CSS grid and text drawn in code, generated SVG, synthesized sounds                                            |
| #250 | Tiles, wardens, preview, sounds              | `src/games/tile-realm/`                        | Drawn in code (SVG from the tile features), hand-authored SVG, synthesized sounds                             |
| #251 | Valley map, badges, preview, sounds          | `src/games/fading-empires/`                    | Generated in code (hex-grid valley from `world.ts`), generated SVG, synthesized sounds                        |
| #252 | World map, stacks, preview, sounds           | `src/games/global-front/`                      | Generated in code (hex-grid world from `world.ts`), generated SVG, synthesized sounds                         |
| #253 | Galaxy map, planets, fleets, preview, sounds | `src/games/star-council/`                      | Generated in code (hex galaxy dealt by `engine.ts`), generated SVG, synthesized sounds                        |
| #254 | Planet map, tiles, tracks, preview, sounds   | `src/games/planet-shapers/`                    | Generated in code (hex map from `world.ts`), card text generated from data, generated SVG, synthesized sounds |
| #255 | Farmyard, action spaces, preview, sounds     | `src/games/farmstead/`                         | Generated in code (CSS grid farmyard), generated SVG, synthesized sounds                                      |
| #256 | Land map, units, preview, sounds             | `src/games/iron-fields/`                       | Generated in code (hex land dealt by `engine.ts`), generated SVG, synthesized sounds                          |

Third-party data: see `docs/GAME_EXPANSION_DATA.md`.
