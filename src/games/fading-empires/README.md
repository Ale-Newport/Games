# #251 Fading Empires

A conquest-and-decline game for 2–5 players (generic name; original peoples, traits, map, names
and art — the brief's “Small World” entry asks for race/power combinations, conquest and
decline). The genre's mechanics: random pairings of a people and a trait offered in a row (skipping
costs coins), conquering regions with tokens at a cost set by the defenders, a reinforcement die
for the last attempt, redeploying, putting an empire into decline to start another, coins per
region every turn, a fixed number of rounds. Ours: ten peoples, twelve traits, a 26-region valley
generated on a hex grid, our own costs and bonuses.

| File              | Role                                                                            |
| ----------------- | ------------------------------------------------------------------------------- |
| `world.ts`        | The valley (regions, terrain, features, tribes, borders), peoples, traits       |
| `engine.ts`       | Pure rules: row of pairings, conquest, die, defence, redeploy, decline, scoring |
| `ai.ts`           | Raider and warlord players                                                      |
| `ai-adapter.ts`   | `GameEnvironment`: integer action encoding, observations                        |
| `ValleyBoard.tsx` | The valley in SVG with owners, features, bands and costs                        |
| `FadingTable.tsx` | Menu, pairings, phase controls, players, log                                    |

## Specification

### The valley

26 regions (2 lakes) built like #248's map: each region is the hex cells nearest its seed;
touching cells make neighbours. Terrains: farmland, forest, hills, marsh, mountain, lake. Features:
springs, mines, caves. Eight regions start with a wild tribe (one defending band). Regions on the
grid's edge are borders. Peoples (bands): Stonefolk 5, Marshlings 6, Riverkin 5, Ashborn 6,
Wildlings 6, Hordes 9, Sky Riders 5, Delvers 5, Seers 5, Raiders 6. Traits (bands): Wealthy 4,
Fierce 4, Highland 4, Woodland 4, Farming 3, Mounted 5, Stalwart 4, Merciless 5, Numerous 6, Lucky
5, Pillaging 5, Seafaring 5. Their gifts are listed in the game (discounts on terrains or features,
coins per terrain or feature, reach, the die, losses inflicted, declining, +7 coins once).

### Ruleset (`fading-empires-26`)

- 5 coins each; 10 rounds with 2–3 players, 9 with 4, 8 with 5.
- **Pick** (no active empire): one of six pairings; skipping pairing k costs k coins, one left on
  each skipped pairing; coins on the picked one are taken. Bands = people + trait. The row refills
  from the decks.
- **Start** (active empire): march (each active region keeps 1 band, the rest come to hand;
  regions may be abandoned first) or decline.
- **Conquer**: cost = 2 + defending bands (a tribe is one) + 1 on a mountain − discounts, at least
  1. A new empire's first region must be a border region (Sky Riders anywhere); later regions must
     touch the empire (Sky Riders anywhere; Delvers between caves). Lakes and own active regions cannot
     be taken (own declined regions can). With 1 or more bands but 1–3 short, one last attempt rolls
     the die (0, 0, 0, 1, 2, 3; Lucky +1, max 3) and ends the conquest whatever happens; on success all
     bands in hand go in.
- **Defence**: an active defender loses 1 band (2 against Merciless) and its other bands move at
  once to its weakest active region (or back to its hand if it has none — a simplification of
  letting the defender place them); a declined people loses its band; a tribe vanishes. A declined
  people with no regions left leaves the board (people and trait return under their decks).
- **Redeploy**: every band in hand on the empire's regions (at least one each), then end the turn.
  Stalwart may decline then.
- **Decline**: each active region keeps one band and turns declined; the older declined people
  leaves the board; the turn scores; next turn a new pick.
- **Score** at every turn's end: 1 coin per region held (active and declined) + the active
  pairing's coin gifts (Pillaging counts held regions taken this turn; Wealthy +7 on its first
  turn). Most coins after the last round win (ties share).

### Modes, interface, controls

Menu: 2–5 players; opponents Raiders, Warlords or all human; new game; resume; watch the AI;
record. The valley shows terrain, owners (declined peoples faded with dashed badges), features,
tribes, bands; in conquest the regions you may take show their cost and are buttons; a region
too dear but within the die's reach offers a die roll. Panels: the pairings with bands, gifts,
coins and costs; your empire; phase buttons (march, decline, abandon, stop, bands per click, end
turn with the coins it will pay); players; log. On phones the map scrolls sideways at a tappable
size. Keys: M march, D decline, S stop, E end turn, H hint.

### Saves, statistics, achievements

Versioned slot with the game (validated: holdings, bands, every people and trait in one place),
the opponents' level and the record. Results against the computer record coins. Achievements:
Empire Builder, Kingmaker (beat the warlords), Sprawling (eight regions in one empire), Graceful
Decline, Roll of Fortune (a region taken with the die).

### AI interface

Integer actions (114): pick 0–5, march, decline, stop, done, then abandon / take / gamble / place
per region. Observations: everything except the generator (die, deck order — only deck sizes).

Agents:

- **Raider**: most bands for its coins; cheapest regions first; the die when one band short; even
  redeploy; declines when fewer than three spare bands remain.
- **Warlord**: pairings by expected coins over the rounds left (bands, the map's bonus regions,
  coins, Wealthy, reach); regions by worth per band (coin, bonuses, the leader's regions); the die
  when one short (two if Lucky); bands where enemy bands are strongest and on the edge; declines
  when fewer than three bands are spare or nothing is within reach (not in the last round; this
  rule was chosen by measurement over an alternative that compared a fresh pairing's worth).

Measured (seats rotated): warlord vs raider 66.5 of 80; one warlord vs two raiders 64 of 90 (30
would be even); vs three raiders about half (15 even); raider vs random 20 of 20.

### Tests

`tests/engine.test.ts`: the valley (sizes, lakes, borders, tribes, symmetric adjacency), peoples
and traits, new game; pairings (skip costs, coins taken, bands); conquest (edge first, costs,
neighbours only, people and trait discounts and reach, Sky Riders, Delvers' caves); active
defenders' losses and withdrawal (Merciless); declined peoples leaving the board; the die (win,
lose, only when short); scoring with bonuses and Wealthy; declining and the next pick; Stalwart;
the end; random games keeping every people and trait accounted for; action codes; observations;
agent strength; adapter contract. `tests/ui.test.tsx`: a whole three-player game against raiders
through the table (pick, march, take, place, decline, end turn), and costs on the map, all bands
in one click, keyboard end of turn, resume. `tests/e2e/games/fading-empires.spec.ts`: three turns
by clicking against warlords (desktop + mobile, overflow, resume) and watch mode.

### Simplifications

- A beaten active defender's surviving bands go to its weakest region automatically instead of
  being placed by its owner.
- One valley for every player count (the number of rounds changes with the players).
