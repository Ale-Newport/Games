# #250 Tile Realm

A tile-laying game for 2–5 players (generic name; original tile set, counts, names and art — the
brief's “Carcassonne” entry asks for tile laying, followers and feature scoring). The mechanics
are the genre's: draw a square tile, place it so every touching side matches, optionally put a
follower on one of its features if nobody holds the feature it joins, score finished features at
once by majority, score the rest at the end, with meadows paying for finished towns. Ours: towns,
roads, meadows and shrines; seven **wardens** each; our own 22 tile types (including a shrine on a
straight road and a town gate with a crossroads) in our own numbers — 69 tiles; art drawn in code.

| File             | Role                                                                      |
| ---------------- | ------------------------------------------------------------------------- |
| `tiles.ts`       | Tile types: features by side segments (12 ports), anchors, counts, sides  |
| `engine.ts`      | Pure rules: bag, placement, feature analysis (union-find), scoring, end   |
| `ai.ts`          | Apprentice and master players                                             |
| `ai-adapter.ts`  | `GameEnvironment`: integer action encoding, observations                  |
| `TileBoard.tsx`  | Tile art from features, the realm, fitting squares, the tile being placed |
| `RealmTable.tsx` | Menu, hand with rotation, confirm / no warden, players, log, zoom         |

## Specification

### Tiles (`tiles.ts`)

Each side has three segments (“ports”, clockwise from the north-west: north 0–2, east 3–5, south
6–8, west 9–11); every feature owns some ports (shrines none). A side is a town side when its
ports are a town's, a road side when its middle port is a road's, else a meadow side. Meadows list
the towns of their tile they border. Rotation moves port p to p + 3r. Touching sides connect port
by port (a's 3s + i to b's 3(s+2) + 2 − i). The start tile (a town cap with a straight road) is
down at the beginning; the other 68 are shuffled into the bag (seeded).

### Ruleset (`tile-realm-69`)

- **Turn**: the tile in hand must go on an empty square next to the realm with every touching side
  matching; any rotation. A drawn tile that fits nowhere is set aside (logged) and another drawn.
- **Wardens**: after placing, the player may stand one of their wardens (7 each) on a feature of
  that tile, unless the feature it joins (through the placement) already holds any warden. Two held
  features may still join later; then every holder counts.
- **Scoring at once**: a finished road (no open end: every end at a junction, a town, a shrine or
  a loop) 1 a tile; a finished town (no open wall) 2 a tile and 2 a banner; a shrine with all eight
  neighbours 9. The player(s) with most wardens on it score (ties all score in full), and its
  wardens return.
- **End** (bag empty): unfinished roads 1 a tile, towns 1 a tile and banner, shrines 1 plus
  neighbours; each meadow pays 3 per finished town it borders, to its majority. Highest score wins
  (ties share the win).

### Modes, interface, controls

Menu: 2–5 players; opponents Apprentices, Masters or all human; new game; resume; watch the AI;
record (played, won, best score). The realm is SVG in a scrollable frame with zoom (four sizes;
phones start one step smaller); squares where the tile fits (in any rotation) are dashed buttons;
choosing one puts the tile there in the current rotation or the next that fits, with circles on
the features a warden may take; then confirm, place without a warden, or cancel. Rotate with the
buttons or R / Shift+R (the tile turns in place to the next fitting rotation). The last placed
tile is outlined; meadow wardens lie down. Hints show the master's choice. Keys: R / Shift+R,
Enter (confirm; on a chosen circle too), N no warden, H hint, Esc cancel, + / − zoom.

### Saves, statistics, achievements

Versioned slot holding the game (validated: tiles, unique squares, wardens within supply), the
opponents' level and the record. Results against the computer record the score. Achievements:
Realm Builder, Grand Master (beat the masters), Walled City (finish a town of 4+ tiles), Pilgrim
(finish a shrine), Hundred Points.

### AI interface

Action code = (((x + 70) · 141 + (y + 70)) · 4 + rotation) · 9 + (warden feature + 1, or 0);
every legal placement and warden choice is listed. Observations: board, wardens, scores, turn,
tile in hand and how many tiles of each type are left — not the bag order. The bag lives in the
state, so transitions are deterministic.

Agents:

- **Apprentice**: the placement that scores most for it now; a warden on the new tile's biggest
  unclaimed town, road or shrine while it has three or more left.
- **Master**: every placement and warden choice, judged by the board it leaves: each held
  feature's expected worth (finished points weighted by the chance its open sides close with the
  tiles left, else its unfinished value; shrines by neighbours; meadows by bordering towns, more
  late in the game) for its holders, plus scores and wardens in hand (worth more early), minus the
  best rival's total.

Measured (seats rotated): master vs apprentice 10 of 10 (84 to 44 points on average); one master
vs two apprentices 25 of 30 (10 would be even); vs three apprentices 12 of 20 (5 even); apprentice
vs random 10 of 10.

### Tests

`tests/engine.test.ts`: tile set (count, ports partitioned, towns own whole sides, meadow
touches); rotation; new game; placement rules (matching, touching, occupied; where a crossroads
fits); a town closed and scored with the warden returned; a road between junctions and wardens
barred from a held road; ties paying everyone; a shrine surrounded; a tile that fits nowhere set
aside; final scoring (unfinished road, meadow beside a finished town, winner); random games to the
end; codes round-trip and observations; agent strength; the master taking a free town; adapter
contract. `tests/ui.test.tsx`: a whole game against an apprentice played through the table
(rotate, square, circle, confirm or no warden), and hint, cancel, keyboard placement and resume.
`tests/e2e/games/tile-realm.spec.ts`: six tiles placed by clicking against masters (with and
without wardens), zoom, resume (desktop + mobile), and watch mode.

### Simplifications

None of the rules above are simplified. The tile set is our own and smaller than some published
sets (69 tiles).
