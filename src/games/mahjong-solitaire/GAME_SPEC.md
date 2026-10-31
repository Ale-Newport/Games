# #159 Mahjong Solitaire — Game Specification

The tile-matching solitaire played with a mahjong set, on original layouts with original SVG tile
art.

## Ruleset (`mahjong-solitaire-free-pairs`)

Tiles sit on a whole-tile grid in layers; a tile covers the one directly beneath it. A tile is
**free** when nothing lies on it and its left or right neighbour in the same layer is missing. The
player removes two free matching tiles at a time: identical suit tiles (dots, bamboo, characters
1–9), identical winds or dragons; any flower matches any flower and any season any season. The deal
is won when every tile is gone. Three shuffles per deal redeal the remaining faces over the
remaining positions; undo is unlimited.

Layouts (original): **Crossroads**, 84 tiles (two crossing bars with a raised centre, 21 face
groups), and **Pyramid**, 144 tiles (layers of 72, 40, 16, 12 and 4: the full set). Simplification,
stated honestly: positions use a whole-tile grid, so there are no half-tile offsets as in many
classic layouts.

## Solvable deals

Deals are built backwards from play: matching pairs of faces are assigned, one pair at a time, to
two positions that are both free in what is left (preferring higher layers so stacks do not strand
a lone tile), and removed; playing that order clears the board (`dealSolution`, checked by the
tests). A shuffle deals the remaining faces the same way, so it can always be finished too. Deals
take about 1 ms (Crossroads) and 4 ms (Pyramid).

## Computer player

The strategist sees only what a player sees — faces of tiles with nothing on top — and scores each
free pair by what it opens (3 per tile stacked beneath, plus the length of the row a tile closes
off), with a bonus when all remaining copies of a face are free (clearing them is safe). It
shuffles only when no pair is left. Measured over 200 deals each: on Crossroads it cleared 154
without a shuffle and 189 in all (a random player: 51 and 194); on Pyramid 68 without a shuffle and
192 in all (random: 31 and 191). Shuffles rescue most stuck positions, so the clearing rate with
shuffles barely separates the two; without them the strategist is three times better on
Crossroads.

## States and actions

`MahjongGame`: layout id, seed and generator state, the face at each position (−1 when removed),
shuffles left, phase (`play`/`won`/`stuck`), history. Actions: `pair:<i>,<j>`, `shuffle`.

## Saves and AI interface

Saves: schema 1 `{ state, undos, hints, elapsed }`, validated by replaying the history from the
seed. Env `mahjong-solitaire` v`1.0.0`: kind `turn-based`, one seat (config `{ layout }`),
observations hide covered faces (−2), deterministic transitions; the return is the share of tiles
removed.

## Achievements

| id        | Condition                                    |
| --------- | -------------------------------------------- |
| `first`   | Clear a layout.                              |
| `pyramid` | Clear the 144-tile pyramid.                  |
| `pure`    | Clear a layout without undoing or shuffling. |
| `unaided` | Clear a layout without hints.                |

## Graphics and audio

Ivory tiles with depth, lifted per layer, sized to the screen width; blocked tiles shaded, the
selected tile raised in gold, hinted pairs ringed; tiles left, moves available and a clock;
synthesized sounds for a click, a pair, a blocked tile, a shuffle, undo, a hint, the end.

## Testing criteria

Layout integrity, the free rule (corner, row interior, covered, top), flower and season matching,
every deal cleared by its construction order on both layouts, shuffles limited and keeping the
faces, replay validation, hidden covered faces, the strategist clearing most deals, the contract
suite; UI: a blocked tile refused, three hinted pairs, undo and shuffle, watch mode. E2E desktop +
mobile.
