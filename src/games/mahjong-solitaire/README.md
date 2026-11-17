# #159 Mahjong Solitaire

`engine.ts` (layouts, free tiles, matching, solvable deals and shuffles, replay validation),
`ai.ts` (visible faces, the strategist), `ai-adapter.ts`, `MahjongTable.tsx` + `Mahjong.module.css`,
`../shared/mjtiles/Face.tsx` (original SVG tile faces, shared with #160), `HowToPlay.tsx`, `i18n.ts`, `sounds.ts`, `manifest.ts`,
`assets/preview.svg`, `tests/`.

## Specification

The tile-matching solitaire played with a mahjong set, on original layouts with original SVG tile
art.

### Ruleset (`mahjong-solitaire-free-pairs`)

Tiles sit on a whole-tile grid in layers; a tile covers the one directly beneath it. A tile is
**free** when nothing lies on it and its left or right neighbour in the same layer is missing. The
player removes two free matching tiles at a time: identical suit tiles (dots, bamboo, characters
1–9), identical winds or dragons; any flower matches any flower and any season any season. The deal
is won when every tile is gone. Three shuffles per deal redeal the remaining faces over the
remaining positions; undo is unlimited.

Six original layouts, all built from layer rectangles `[x0, y0, cols, rows, z]`, at most 12
columns wide (so tiles stay tappable on a 360 px screen). Each holds whole groups of four faces
(the deal keeps `n / 4` of the 36 shuffled face groups), and every raised tile rests on one
directly below:

| Layout       | Tiles | Face groups | Tiles per layer (z = 0, 1, 2, …) | Shape                                                                  |
| ------------ | ----- | ----------- | -------------------------------- | ---------------------------------------------------------------------- |
| Crossroads   | 84    | 21          | 36, 24, 20, 4                    | two crossing bars with a raised centre                                 |
| Fortress     | 80    | 20          | 52, 20, 8                        | a one-tile curtain wall, corner towers three high, a raised inner keep |
| Bridge       | 88    | 22          | 48, 32, 8                        | a two-row deck on two piers, with two towers rising above it           |
| Butterfly    | 112   | 28          | 70, 32, 10                       | broad upper wings, narrower lower wings, a raised body three layers up |
| Pyramid      | 144   | 36          | 72, 40, 16, 12, 4                | a stepped pyramid (the full set)                                       |
| Twin Pagodas | 144   | 36          | 76, 40, 20, 8                    | two four-storey towers on a shared three-row terrace (the full set)    |

Simplification, stated honestly: positions use a whole-tile grid, so there are no half-tile
offsets as in many classic layouts. None of the layouts copies a commercial or traditional
published layout.

### Solvable deals

Deals are built backwards from play: matching pairs of faces are assigned, one pair at a time, to
two positions that are both free in what is left (preferring higher layers so stacks do not strand
a lone tile), and removed; playing that order clears the board (`dealSolution`, checked by the
tests). A shuffle deals the remaining faces the same way, so it can always be finished too. Deals
take about 1 ms (Crossroads, Fortress, Bridge), 2.5 ms (Butterfly) and 4–5 ms (Pyramid, Twin
Pagodas); 200 seeds per layout were dealt and replayed to a clear with no failure.

### Computer player

The strategist sees only what a player sees — faces of tiles with nothing on top — and scores each
free pair by what it opens (3 per tile stacked beneath, plus the length of the row a tile closes
off), with a bonus when all remaining copies of a face are free (clearing them is safe). It
shuffles only when no pair is left. Measured over 200 deals each: on Crossroads it cleared 154
without a shuffle and 189 in all (a random player: 51 and 194); on Pyramid 68 without a shuffle and
192 in all (random: 31 and 191). Shuffles rescue most stuck positions, so the clearing rate with
shuffles barely separates the two; without them the strategist is three times better on
Crossroads. On the newer layouts (200 deals each, without a shuffle / in all): Fortress 144 / 190,
Bridge 155 / 182, Butterfly 115 / 182, Twin Pagodas 142 / 181.

### States and actions

`MahjongGame`: layout id, seed and generator state, the face at each position (−1 when removed),
shuffles left, phase (`play`/`won`/`stuck`), history. Actions: `pair:<i>,<j>`, `shuffle`.

### Saves and AI interface

Saves: schema 1 `{ state, undos, hints, elapsed }`, validated by replaying the history from the
seed. Env `mahjong-solitaire` v`1.1.0`: kind `turn-based`, one seat (config `{ layout }`),
observations hide covered faces (−2), deterministic transitions; the return is the share of tiles
removed.

### Achievements

| id        | Condition                                    |
| --------- | -------------------------------------------- |
| `first`   | Clear a layout.                              |
| `pyramid` | Clear the 144-tile pyramid.                  |
| `pure`    | Clear a layout without undoing or shuffling. |
| `unaided` | Clear a layout without hints.                |

### Graphics and audio

Ivory tiles with depth, lifted per layer, sized to the screen width; blocked tiles shaded, the
selected tile raised in gold, hinted pairs ringed; tiles left, moves available and a clock;
synthesized sounds for a click, a pair, a blocked tile, a shuffle, undo, a hint, the end.

### Testing criteria

Layout integrity (exact tile counts overall and per layer for all six layouts, whole groups of
four, no duplicates, no floating tiles, at most 12 columns), the free rule (corner, row interior,
covered, top), flower and season matching, every deal cleared by its construction order on all six
layouts, shuffles limited and keeping the
faces, replay validation, hidden covered faces, the strategist clearing most deals, the contract
suite (Crossroads, Pyramid, Butterfly); UI: a blocked tile refused, three hinted pairs, undo and
shuffle, every layout chosen and dealt in full, watch mode. E2E desktop + mobile (Pyramid by hint
and by hand; Fortress, Bridge, Butterfly and Twin Pagodas dealt with no horizontal overflow).
