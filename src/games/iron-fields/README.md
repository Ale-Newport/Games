# #256 Iron Fields

An engine-building and area-control game for 1–4 players. The name is generic; the land, factions,
boards, encounters, names and art are all original. The catalog entry asks for asymmetric engine
building, mechs and stars. The genre mechanics used here:

- personal boards whose four sections pair a top action with a bottom action;
- choosing a different section from last turn;
- workers that produce on the land;
- mechs that unlock movement and combat abilities;
- structures and recruits;
- encounters;
- fights settled by secret power bids;
- stars for achievements, ending the game at a set number;
- a final count where popularity sets the rate for stars, territories and resources.

The content is our own:

- a hex land of 37 spaces dealt per seed around the Foundry;
- five invented factions with starting power and an ability;
- four boards with our own pairings, starting popularity and coins;
- our costs, upgrades, mech abilities, four structures, four recruits and eight encounter cards;
- our star thresholds and scoring tiers.

| File            | Role                                                                                                       |
| --------------- | ---------------------------------------------------------------------------------------------------------- |
| `world.ts`      | Land, terrains, factions, boards, actions and costs, mechs, structures, recruits, encounters, stars, tiers |
| `engine.ts`     | Pure rules: dealing, sections, moves, fights, encounters, production, bottom actions, stars, scoring       |
| `ai.ts`         | Recruit and marshal players; bids without seeing the rival's                                               |
| `ai-adapter.ts` | `GameEnvironment`: integer action encoding, observations hiding the deck and the attack bid                |
| `LandMap.tsx`   | The land in SVG: terrains, homes, the Foundry, encounters, structures, units                               |
| `IronTable.tsx` | Menu, board sections, step panels, the chosen space, factions, log, final count                            |

## Specification

### The land and set-up

The land has 37 hex spaces in radius 3:

- the Foundry in the middle;
- homes on corners of the outer ring (opposite corners for 2 players, every other corner for 3,
  four for 4);
- 6 farms (food), 6 forests (wood), 6 mountains (metal), 6 tundras (oil), 4 villages (which make
  workers) and 4 lakes, dealt per seed.

The deal is redrawn until every home has two different producing neighbours and reaches the
Foundry without crossing a lake. Six encounter tokens lie on producing or village spaces at least
two steps from every home.

Each player gets:

- a faction (chosen, or dealt) and a board (dealt);
- a character at home and two workers on two producing neighbours of the home;
- 1 of each resource;
- the faction's power, and the board's popularity and coins.

| Faction         | Power | Ability                                |
| --------------- | ----- | -------------------------------------- |
| Ashen League    | 3     | Deploying a mech costs 1 metal less    |
| Thornwood       | 2     | Workers on forests produce 1 more wood |
| Saltmarch Union | 3     | All its units may cross lakes          |
| Highcrown       | 5     | +2 to its total when it attacks        |
| Emberfold       | 1     | Trading gives 3 resources instead of 2 |

| Board       | Under Move / Trade / Produce / Bolster | Popularity | Coins |
| ----------- | -------------------------------------- | ---------- | ----- |
| Industrial  | Upgrade / Deploy / Build / Enlist      | 2          | 4     |
| Engineering | Deploy / Build / Enlist / Upgrade      | 3          | 3     |
| Patriotic   | Build / Enlist / Upgrade / Deploy      | 4          | 2     |
| Mechanical  | Enlist / Upgrade / Deploy / Build      | 1          | 5     |

### A turn

Pick a section other than last turn's. Take its top action, then its bottom action if you can pay
for it (you may skip it).

Top actions:

- **Move** two units (three after its upgrade) one space each, or take 1 coin instead.
  - Workers never enter spaces with enemy units.
  - The character and mechs may enter spaces with enemy units. With an enemy character or mechs
    there, a fight follows. With only workers there, those workers go home and the mover loses 1
    popularity for each.
  - No unit enters a rival's home or a lake, unless it has the Ford ability or belongs to the
    Saltmarch.
  - With the Stride ability the character and mechs move two spaces.
  - The first time a character reaches the Foundry it gains 3 coins and 2 power. A character
    ending on an encounter token draws a card and chooses one of its three options; options with
    a price can be chosen only if affordable.
- **Trade**: pay 1 coin for 2 resources of your choice (Emberfold 3), or for 1 popularity (2 after
  the upgrade).
- **Produce** on 2 spaces with your workers (3 and 4 after upgrades). Each worker gives 1 of the
  space's resource (a mill gives +1); on a village each worker brings a new worker (at most 8).
  Producing costs 1 power once you have 4 workers, plus 1 popularity at 6 and a coin at 8.
- **Bolster**: pay 1 coin for 2 power (3 and 4 after upgrades), +1 with an armory.

Bottom actions (the cost drops with upgrades down to a minimum):

| Action  | Resource | Cost (minimum) | Coins | Effect                                                   |
| ------- | -------- | -------------- | ----- | -------------------------------------------------------- |
| Upgrade | oil      | 2 (1)          | 1     | Improve a top action and cheapen a bottom one (6 in all) |
| Deploy  | metal    | 2 (1)          | 0     | A mech on a worker's space                               |
| Build   | wood     | 2 (1)          | 2     | A structure on a worker's space without one              |
| Enlist  | food     | 3 (1)          | 1     | A recruit                                                |

Mechs unlock abilities in order:

1. Stride: the character and mechs move 2.
2. Ford: the character and mechs cross lakes.
3. Bulwark: +2 when defending.
4. Strike: +2 when attacking.

Structures:

- Mill: +1 when producing there.
- Monument: +2 popularity.
- Armory: +2 power now, +1 when bolstering.
- Mine: +1 coin after each Move turn.

Recruits give one of: +2 power, +2 coins, +2 popularity, or +1 of each resource.

### Fights

The attacker bids 0–7 power, then the defender bids without seeing the attacker's bid. Each total
is the bid plus 1 per character or mech there, plus any bonuses (Strike or Highcrown when
attacking, Bulwark when defending). The higher total wins, and the attacker wins ties. Both pay
their bids. The loser's units on the space go home. The winner earns a combat star, at most two.

### Stars and the end

Stars:

- 5 upgrades;
- 4 mechs;
- 4 structures;
- 4 recruits;
- 6 workers;
- 12 power;
- 14 popularity;
- up to two fights won.

The game ends at once when someone earns a fifth star, or after 30 turns each.

The final count is coins, plus amounts paid at your popularity tier:

| Popularity | Per star | Per territory | Per 2 resources |
| ---------- | -------- | ------------- | --------------- |
| 0–6        | 3        | 2             | 1               |
| 7–12       | 4        | 3             | 2               |
| 13–18      | 5        | 4             | 3               |

A territory is a space other than a home or a lake with your units or structure and no enemy
units. The Foundry counts as 3. The most coins win.

### Modes, interface, controls

The menu offers 2–4 players, a faction, and the opponents: recruits, marshals, or everyone on this
device. It also has new game, resume, watch the AI (a marshal and two recruits) and your record.
Bids are never displayed, so hot-seat play stays fair.

The table shows the four sections of your board, each with:

- its top action and what it does now;
- its bottom action, cost and reward;
- a mark on last turn's section.

To move, click one of your units' spaces. Clicks cycle through your units there, or use the unit
buttons. Then click a highlighted destination. Producing, deploying and building are also done by
clicking highlighted spaces; for building, pick the structure first. Trades, upgrades, recruits,
bids and encounter options are buttons.

Panels show:

- the chosen space with its units and structure;
- every faction's coins, power, popularity, resources, development, stars, ability and mech
  abilities;
- the log;
- the final count.

Keys: D done, H hint. On phones the map scrolls sideways.

### Saves, statistics, achievements

The save slot is versioned and validated: land, units, boards, ranges and phases. It also holds
the opponents and the record. Results against the computer record your coins.

Achievements:

- Iron Will: win.
- Outmarshalled: beat the marshals.
- Victor: win a fight.
- At the Foundry: reach it.
- Full Hangar: four mechs.

### AI interface

The environment has 2–4 seats. Actions are integers:

- section;
- coin;
- move a unit to a space;
- trade a pair;
- produce, deploy or build on a space;
- upgrade a top/bottom pair;
- enlist a recruit;
- bid 0–7;
- an encounter option;
- done.

Observations hide the generator, the encounter deck order and, from the defender, the attacker's
bid.

Agents:

- **Recruit** plays each section out step by step, taking the best-looking choice at every step,
  and keeps the turn that leaves its position worth most. A position is worth:
  - its count at the end-of-game rates now;
  - plus values for stars, upgrades, mechs, structures, recruits, workers, power, popularity and
    resources toward its next bottom actions, weighted down as anyone nears five stars.

  A finished game is worth its count plus a bonus if won.

  Bids: it bids just enough to be sure to win, judged from the rival's units and power, never
  from its bid, or nothing if it cannot be sure.

- **Marshal** ranks sections like the recruit. It then plays each of its best three out to the end
  of the game, in a world where the encounter deck is reshuffled and everyone plays as a recruit.
  It takes the section that ends furthest ahead of its strongest rival in the final count. It takes
  about a second a move.

Measured (seats rotating):

| Match-up                               | Marshal wins | Even play would win |
| -------------------------------------- | ------------ | ------------------- |
| Marshal vs recruit, 2 players          | 13 of 16     | 8                   |
| One marshal vs two recruits, 3 players | 4 of 6       | 2                   |

The marshal averages 91 coins against the recruits' 75. Recruits beat random play 10 of 10.

During tuning:

- The first rules had bottom costs of 2–4, six stars to end, and stars for 6 upgrades, 8 workers,
  16 power and 18 popularity. With them the AIs never ended a game by stars. The costs, the stars
  needed and the thresholds were lowered, and everyone starts with one of each resource.
- Shorter look-aheads, of 4–12 turns judged by the heuristic, gave only small or no gains and
  were dropped.

### Tests

`tests/engine.test.ts`:

- set-up for 2–4 players: homes, units, encounters, factions, boards;
- starting values;
- sections, trading, Emberfold;
- producing with Rootbound and a village, and its costs;
- movement with Stride, Ford and lakes, and enemy homes;
- workers sent home;
- a fight with secret bids, Highcrown, ties and stars;
- the Foundry and an encounter;
- upgrades, deploying and building;
- five stars ending the game, and the tiers;
- random games to the end;
- codes round-trip and hidden observations;
- agent strength;
- the adapter contract.

`tests/ui.test.tsx`:

- six turns against recruits, played through the table;
- moving by clicking the map, the bottom step and resume.

`tests/e2e/games/iron-fields.spec.ts`, on desktop and mobile:

- choosing Move;
- walking the character by clicking the map;
- the computer's turn;
- producing on a highlighted space;
- resume;
- watch mode.

### Simplifications

- Resources go straight to the player's supply instead of lying on the land. Mechs do not carry
  workers.
- Combat uses power bids only (no combat cards). Only the attacker's units move into a fight, and
  only the attacker initiates.
- Recruits give one-time bonuses, with no ongoing bonus when neighbours act.
- Structures have simple fixed effects, and there are no special objective cards.
- The game also ends after 30 turns each.
