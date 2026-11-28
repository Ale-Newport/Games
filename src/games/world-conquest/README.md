# #248 World Conquest

A territory-conquest strategy game for 2–5 players (generic name; original world, names, map
art and card art — the brief's “Risk” entry asks for territory conquest with dice combat). The
mechanics are the genre's classic ones: a random deal of territories, reinforcements from
territory count, landmass bonuses and card sets, up to three attacking dice against two
defending, occupation, one fortifying move, a card per turn with a conquest, escalating sets and
taking a knocked-out player's cards. The world is invented: six landmasses (Frostmark, Iron
Steppes, Verdant Coast, Sunken Kingdoms, Ashen Waste, Coral Isles) and 36 territories, drawn on a
hex grid; no real-world or commercial map is used.

| File             | Role                                                                      |
| ---------------- | ------------------------------------------------------------------------- |
| `map.ts`         | The world: landmass shapes, territory seeds, sea lanes → cells, adjacency |
| `engine.ts`      | Pure rules: deal, setup, reinforcements, cards, battles, advance, fortify |
| `ai.ts`          | General and marshal players; exact battle odds                            |
| `ai-adapter.ts`  | `GameEnvironment`: integer action encoding, per-seat observations         |
| `WorldBoard.tsx` | The map in SVG from the same grid: owners, borders, lanes, army badges    |
| `WorldTable.tsx` | Menu, phases, controls, CPU scheduling, hand-off, saves                   |

## Specification

### The world (`map.ts`)

A 28 × 18 hex grid. Each landmass is a union of ellipses; every land cell belongs to the nearest
seed point of its landmass's territories, so each territory is a connected patch of cells (a test
checks every territory is in one piece). Cells of different territories that touch make them
adjacent; 18 listed sea lanes (dashed on the map) join territories across water. The whole world
is connected. Landmasses and bonuses: Frostmark 6 territories +3, Iron Steppes 7 +5, Verdant
Coast 5 +3, Sunken Kingdoms 6 +4, Ashen Waste 6 +3, Coral Isles 6 +3.

### Ruleset (`world-conquest-36`)

- **Deal**: territories shuffled and dealt round the table (seeded), one army on each. Starting
  armies 40 / 35 / 30 / 25 for 2 / 3 / 4 / 5 players; the rest are placed in turns, three at a
  time (the classic one-at-a-time rhythm, in batches of three).
- **Reinforce**: max(3, ⌊territories / 3⌋) plus the bonus of each landmass held whole. Sets of
  three cards (three alike, one of each, or two plus a wild) trade for 4, 6, 8, 10, 12, 15, then
  +5 armies, counted across the whole game; one territory shown on the set that the player holds
  gets 2 extra armies. A hand of five or more must trade first.
- **Attack** (any number): from an own territory with at least 2 armies to an adjacent enemy;
  attacker rolls 1–3 dice (at most armies − 1), the defender rolls 2 if it has 2 or more armies,
  else 1 (the defender always rolls the most it can); dice are sorted and compared pairwise, ties
  to the defender, each lost pair costs one army. Emptying the territory takes it: the attacker
  moves in at least the number of dice rolled (any number up to all but one). Knocking a player
  out takes their cards; holding six or more then forces trading down to four at once (the armies
  are placed straight away).
- **Fortify**: one move of any number of armies between two adjacent own territories, leaving at
  least one; this ends the turn (or end without moving).
- **Cards**: 38 — one per territory (shield, horse or cannon by index), plus two wilds. A turn
  with at least one conquest draws one at its end; traded sets go to a discard pile reshuffled
  when the deck runs out.
- **Win**: holding every territory. Safety limit: after 300 rounds the most territories (then
  armies) win; real games end in about 12 rounds with computer players.

### Modes, interface, controls

Menu: 2–5 players; opponents Generals, Marshals or all human (pass-and-play with a hand-off
screen hiding cards); new game; resume; watch the AI (two marshals, two generals); record
(played, won, best territories). The map is clickable (highlighted territories; Tab and Enter
from the keyboard); on phones it keeps a tappable size and scrolls sideways in its frame. Controls
per phase: armies per click (1, 5, all) and “place for me” in setup; card sets with their value;
dice count, a click on an enemy for one battle or “attack until it falls” per neighbour; a
slider for the advance and the fortifying move; end attacks / end turn; hints (the marshal's
move, ringed on the map). Side panels: empires (territories, armies, cards, income), the seat's
cards, landmasses with bonuses and holders, the battle log with every die. Keys: E end attacks /
end turn, H hint, Esc cancel.

### Saves, statistics, achievements

Versioned slot holding the game (validated: owners, armies, every card in exactly one place), the
opponents' level and the record. Results recorded against the computer (score = territories).
Achievements: World Conqueror, Outgeneralled (beat the marshals), Crowded World (win with 4–5
players), Continental (hold a landmass), Knockout.

### AI interface

Integer actions: placements (36), card sets by hand position (the first ten), attacks per
directed border and dice count, advances and fortifications as fifths of the allowed range,
end attacks, end turn. Observations per seat: the whole board, phase, trade count, the seat's
own cards and everyone's card counts. The generator lives in the state.

Agents (both see only their own cards):

- **General**: targets the landmass with the most of it held, piles reinforcements on one front
  facing it, attacks at ≥ 65 % odds of taking the territory, advances everything when enemies are
  near, moves idle stacks to the front.
- **Marshal**: exact conquest odds (a recursion over every dice outcome, checked against 3,000
  simulated battles), a value for each territory (completing or breaking a landmass bonus, the
  turn's card, knocking a player out and taking their cards), attacks when the expected gain
  beats the expected losses, reinforces where it unlocks the most valuable attack.

Measured (seats rotated): marshal vs two generals 67 of 120 (40 would be even); vs one general
41 of 60; vs four generals 18 of 50 (10 even). `npm run evaluate -- world-conquest <a> <b> 100 7`
(two seats, swapped): Marshal 79–21 General; General vs itself 48–52; Random 0–100 General.

### Tests

`tests/engine.test.ts`: the map (sizes, bonuses, every territory one piece, symmetric
adjacency, connected world); cards and sets (every five cards hold a set; values); the deal,
starting armies, batches of three; reinforcement income; dice rules over 200 battles; conquest,
the advance range and the card at the end of the turn (none without a conquest); exact odds
against simulation; forced trades and the territory bonus; knocking out (cards taken, forced
trade, turns skip the player); fortify rules; winning and the round limit; random play keeping
the state valid; every listed action code legal, agent moves encodable; observations; agent
strength; adapter contract (random playouts truncated at 3,000 steps). `tests/ui.test.tsx`: a
whole three-player game against generals played through the table's controls; armies-per-click,
hotseat hand-off and resume. `tests/e2e/games/world-conquest.spec.ts`: setup and two turns
against marshals by clicking the map (desktop + mobile, overflow checks, resume), and watch mode.

### Simplifications

- The defender always rolls as many dice as it may (two with two or more armies) instead of
  choosing (rolling two is the usual best choice for a defender).
- Setup placements come in batches of three rather than one at a time.
- In the AI encoding, advances and fortifications are limited to five amounts each (the table
  allows any amount), and sets beyond the tenth card in hand are not encodable (any five cards
  already hold a set, so a trade is always available).
