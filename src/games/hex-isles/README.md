# #247 Hex Isles

A resource-trading settlement game for 3 or 4 players (generic name; original theme, resources,
cards, art and board generator — the brief's “Catan” entry asks for hex resource production,
building and trading). The mechanics are the genre's: dice-numbered hexes paying the buildings on
their corners, a distance rule, paths, upgrades, development-style cards, a robber-style blocker,
harbours, two 2-point awards and ten points to win. Names and presentation are our own: wood,
coral, salt, fish and iron from groves, reefs, salt pans, lagoons and iron cliffs; huts and towns;
sea charts (captain, road works, bounty, embargo, relic); the storm; the longest trail and the
grand fleet.

| File             | Role                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------ |
| `engine.ts`      | Pure rules: geometry, board generator, setup, dice, building, charts, trading, awards, win |
| `ai.ts`          | Settler and strategist players (read only public information and their own hand)           |
| `ai-adapter.ts`  | `GameEnvironment`: integer action encoding, per-seat observations                          |
| `IslesBoard.tsx` | The island in SVG: terrain glyphs, number tokens, harbours, pieces, targets                |
| `IslesTable.tsx` | Menu, turn flow, panels, dialogs, CPU scheduling, hand-off, saves                          |

## Specification

### The island

19 hexes in a radius-2 hexagon (54 corners, 72 edges, 30 coast edges), generated from the game
seed: 4 groves (wood), 3 reefs (coral), 4 salt pans (salt), 4 lagoons (fish), 3 iron cliffs
(iron), 1 dune field (nothing; the storm starts there). Number tokens 2, 3, 3, 4, 4, 5, 5, 6, 6,
8, 8, 9, 9, 10, 10, 11, 11, 12 on the producing hexes; a layout is redrawn until no 6 or 8 touches
another 6 or 8 and no number touches its twin. Nine harbours at fixed spots spread round the coast
(never two on one corner), kinds shuffled: four 3:1 and one 2:1 per resource.

### Ruleset (`hex-isles-10`)

- **Setup**: seats 0…n−1 then n−1…0 each place a hut on a free corner (distance rule: no building
  on it or on a neighbouring corner) and a path on an edge of that hut. The second hut takes one
  card from each producing hex it touches.
- **Turn**: roll two dice (a captain may be played first). A sum other than 7 pays 1 card per hut
  and 2 per town on each hex with that number, except the storm's hex; when the bank (19 of each)
  cannot pay all claims on a resource, nobody gets it unless only one player claims it (they get
  what is left). On a 7, every player with more than 7 cards discards half, rounded down (in turn,
  each choosing); the roller moves the storm to a different hex and takes a random card from a
  player of their choice with a building on it (automatic when only one has cards).
- **Build** (main phase, any order): path (wood + coral; connected through an own building or an
  own path at a corner without a rival building), hut (wood + coral + salt + fish; free corner by
  the distance rule touching an own path), town (2 fish + 3 iron; replaces an own hut), sea chart
  (salt + fish + iron). Pieces: 15 paths, 5 huts, 4 towns. Deck of 25 charts: 14 captains, 5
  relics, 2 road works, 2 bounty, 2 embargo.
- **Charts**: one per turn, not on the turn bought (relics are never played; they count as a
  hidden point at once). Captain: move the storm and steal (counts toward the fleet). Road works:
  up to two free paths. Bounty: any two cards from the bank. Embargo: every other player hands over
  all of one named resource.
- **Trade**: with the bank at 4:1, 3:1 with an own building on a 3:1 harbour, 2:1 for the
  harbour's resource. Offers to another player: any two non-empty bundles with no resource on both
  sides, from cards held; the other player accepts (only if they hold the cards asked) or refuses;
  at most 3 offers per turn.
- **Awards**: longest trail (longest simple chain of own paths, not passing through a rival's
  building; at least 5; the holder keeps it on a tie; when the holder is overtaken by one player it
  moves, when a cut leaves a tie among others it is unheld) and grand fleet (at least 3 captains
  played, moving only to someone with strictly more). 2 points each.
- **Win**: the player whose turn it is wins as soon as they have 10 points (huts 1, towns 2,
  awards 2, relics 1). Safety limit: after 250 rounds the most points win (earliest seat on a tie);
  real games end in about 20 rounds, and only random players ever come near it.

### Modes, interface, controls

Menu: 3 or 4 players; opponents Settlers, Strategists or all human (pass-and-play with a
hand-off screen that hides the next player's hand); new game; resume; watch the AI (two
strategists and two settlers); record (played, won, best points). The island is an SVG drawn
from the engine's geometry; while choosing, the legal corners, edges or hexes are highlighted and
can be clicked, tapped or reached with Tab and chosen with Enter. Side panel: players (points,
card and chart counts, trail length, captains, awards), hand, builds with costs and pieces left,
charts with play buttons, trade (bank chips with each rate; bundle steppers and an offer button per
player), discard / steal / bounty / embargo / offer dialogs, hint (the strategist's move, also
highlighted on the board), log. Keys: R roll, E end turn, H hint, Esc cancel. Computer seats act
after short pauses; dice sums glow on their hexes.

### Saves, statistics, achievements

Versioned slot holding the game in progress (resumable, validated: board, pieces, hands and the
conservation of all 95 resource cards), the opponents' level and the record. Results are recorded
for games against the computer. Achievements: Island Founder (win), Master of the Isles (beat the
strategists), Four Towns, Trailblazer (hold the longest trail), Admiral (hold the grand fleet).

### AI interface

Integer actions (335): huts 0–53, paths 54–125, towns 126–179, roll, buy, captain, road works,
end, bounty pairs, embargo, storm hexes, steal seats, one-card discards, bank give/get pairs,
one-for-one offers per seat and pair, accept, decline. (The table also allows bundle offers and
discards; the encoding keeps one-card steps so every decision has a fixed index.) Observations per
seat: the board, buildings, bank, deck size, phase, dice, awards, the seat's own hand and charts,
and for everyone only card and chart counts, captains played and visible points (others' relics
stay hidden). The game generator lives in the state, so transitions are deterministic.

Agents (both use only what their seat can see):

- **Settler**: corners by dice odds and new resources (harbours a little), path towards the best
  free corner, fixed priority town › hut › path › chart, bank trades from surplus, storm on the
  leader's best hex away from its own buildings, steals from the leader.
- **Strategist**: also weighs resources scarce on this board and harbours matching its income,
  chooses the goal with the most points per expected turn (production rates, bank conversions),
  races for the trail and the fleet, plays bounty and embargo for what it lacks, proposes
  one-for-one trades to the trailing players and refuses anyone within two points of winning.

Measured with the table's seat rotation (seeds 1–100): one strategist vs three settlers wins 64 of
100 (25 would be even); at three players 41 of 60 (20 would be even); settlers beat random players
20 of 20. `npm run evaluate -- hex-isles <a> <b> 60 7` (three seats, agents alternating A B A / B A
B): Strategist beats Settler in 46 of 60 games; Settler vs itself 35–25 (seat effect); Random vs
Settler 0–60.

### Tests

`tests/engine.test.ts`: geometry (counts, corners, coast, harbour spacing); 200 random boards
(terrain and number sets, red and twin numbers never adjacent, harbour kinds, deck); setup order,
distance rule, setup paths, second-hut cards; production for huts and towns, the storm blocking,
bank shortage; the seven (discard amounts, bundle and illegal discards, storm moves, steal);
path connectivity and cuts, hut placement; towns; longest trail (award, tie, cut); charts (wait a
turn, one a turn, relic points hidden from others, captain before the roll, road works, bounty,
embargo, grand fleet); harbour rates; offers (legality, accept, refuse, unaffordable, limit);
winning on ten; random games conserving every card and piece and ending; action codes
round-trip; observations hide others' cards; agent strength; adapter contract.
`tests/ui.test.tsx`: a whole four-player game against settlers played only through the table's
buttons and board targets; all-human hand-off screens and resume after a reload.
`tests/e2e/games/hex-isles.spec.ts`: setup and a few turns by clicking the island against
strategists (desktop + mobile), and watch mode.

### Simplifications

- Computer players trade one card for one card; human offers may be any bundles. Each turn allows
  at most three offers (to keep computer turns finite).
- One island size (3–4 players); no scenario maps or expansions.
- The 250-round safety limit (documented above) applies at the table too; no real game comes near
  it.
