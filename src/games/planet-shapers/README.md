# #254 Planet Shapers

An engine-building game for 1–4 players about shaping a planet. The name is generic; the planet,
map, corporations, cards, names and art are all original. The catalog entry asks for global
parameters, projects and a production engine. The genre mechanics used here:

- shared global parameters that players raise;
- a rating that is both income and points;
- six resources with production tracks, two of which pay for tagged cards;
- project cards bought each round, with tags, requirements, immediate effects, actions and
  ongoing effects;
- standard projects and conversions;
- seas, groves and settlements placed on a map, with adjacency rules;
- milestones and awards.

The content is our own:

- the planet Kepra, a 37-space hex map with a rift valley of ten basins and our own bonuses;
- heat, air and seas tracks of our own lengths and with our own bonuses;
- six corporations;
- 57 project cards;
- five milestones and five awards.

| File               | Role                                                                                     |
| ------------------ | ---------------------------------------------------------------------------------------- |
| `world.ts`         | Map, parameters, resources, corporations, cards, standard projects, milestones, awards   |
| `engine.ts`        | Pure rules: set-up, research, every action, tiles, parameters, production, scoring       |
| `ai.ts`            | Cadet and architect players                                                              |
| `ai-adapter.ts`    | `GameEnvironment`: integer action encoding, observations with hidden hands               |
| `PlanetMap.tsx`    | Kepra in SVG: basins, bonuses, seas, groves, settlements                                 |
| `ShapersTable.tsx` | Menu, parameter tracks, hand-off screen, the panels of every step, players, goals, score |

## Specification

### Kepra

The map has 37 hex spaces in radius 3. Ten basins run across it as a rift valley, and only seas
may go there. Land spaces print bonuses: 1–2 ore, 1–2 crystal, 1–2 flora, or a card.

Placing a tile gives:

- the printed bonus;
- 2 credits for each sea next to it.

Where each tile may go:

- Seas go in basins.
- Groves go on land next to your own tiles when such a space exists, otherwise anywhere on land.
- Settlements go on land not touching another settlement.

Placing a grove raises air.

### Parameters and rating

There are three parameters:

- Heat: 10 steps. Steps 3 and 6 give the raiser +1 heat production, and step 8 brings a sea.
- Air: 8 steps. Step 5 raises heat.
- Seas: 7 tiles.

Each step raised gives +1 shaping rating (TR). TR starts at 20.

### Resources

Each player has six resources, each with a production track:

- Credits. Credit production may go down to −5.
- Ore. It pays 2 per unit on Build cards (3 for Forgeline).
- Crystal. It pays 3 per unit on Space cards (4 for Skyreach).
- Flora. 8 flora makes a grove.
- Power. All of it turns into heat at production.
- Heat. 8 heat raises heat one step.

### Corporations

| Corporation        | Start                       | Ability                                                  |
| ------------------ | --------------------------- | -------------------------------------------------------- |
| Verdance           | 38 credits, +1 flora prod   | Grove from 7 flora                                       |
| Forgeline          | 40 credits, +1 ore prod     | Ore worth 3                                              |
| Skyreach           | 38 credits, +1 crystal prod | Crystal worth 4                                          |
| Thermos Collective | 40 credits, +2 heat prod    | Heat step from 7 heat                                    |
| Meridian Union     | 46 credits, +1 credit prod  | 4 credits back on a card or standard project costing 20+ |
| Archive Institute  | 40 credits                  | Research shows 5 cards and they cost 2                   |

Corporations are offered two at a time, in seat order. Each player sees ones nobody was offered
before while enough remain, and never one already taken.

### Cards

There are 57 cards. Each has a cost and tags (Build, Space, Science, Plant, Power, City, Event).
Some also have a requirement: a parameter at least or at most a value, or a number of tags.

Effects:

- production changes;
- resources gained;
- parameter steps (seas are placed);
- groves and settlements;
- TR;
- cards drawn;
- points.

Card kinds:

- 6 action cards: once per generation, pay something for something.
- 5 effect cards: discounts for a tag or for every card, or a gain whenever you play a tag.
- 9 events: their tags do not count afterwards.

Payment is automatic:

1. crystal on Space cards and ore on Build cards, as far as they go without overpaying;
2. then credits;
3. one more unit of ore or crystal, overpaying, if credits run short.

You cannot play a card if a production loss would take you below zero (credits below −5).

### A game

**Set-up.** In seat order, each player chooses one of two corporations and sees 10 cards. Buying a
card costs 3 (Archive 2).

**Each generation:**

1. **Research** (from generation 2). In order from the first player, each sees 4 cards (Archive 5) and buys any of them. Unbought cards are discarded, and the discard is reshuffled when the
   deck runs out.
2. **Actions.** From the first player, one action per turn until everyone has passed. The actions:
   - play a card;
   - a standard project:

     | Project     | Cost | Effect                                |
     | ----------- | ---- | ------------------------------------- |
     | Power plant | 11   | +1 power production                   |
     | Heater      | 14   | Heat +1                               |
     | Aquifer     | 18   | A sea                                 |
     | Grove       | 23   | A grove                               |
     | Settlement  | 25   | A settlement and +1 credit production |

   - turn flora into a grove;
   - turn heat into a heat step;
   - use a card action;
   - sell a card for 1 credit;
   - claim a milestone: 8 credits, 3 claimed at most, worth 5 points;
   - fund an award: 8, then 14, then 20 credits, 3 funded at most;
   - pass.

   Tiles waiting to be placed are placed (a choice of space) before the turn moves on. A placement
   with nowhere to go is dropped.

3. **Production.** Power turns into heat. Everyone gains their production, plus credits equal to
   TR plus credit production. The first player moves on one seat.

**End.** The game ends after the production of the generation in which all three parameters are
complete, or after generation 14.

**Scoring:**

- TR;
- 5 per milestone;
- awards: 5 for first place; 2 for second with 3+ players and no tie for first. Ties share the
  place.
- 1 per grove;
- 1 per grove next to each of your settlements;
- card points.

Ties are broken by credits.

Milestones:

| Milestone | Condition      |
| --------- | -------------- |
| Shaper    | TR 30          |
| Mayor     | 3 settlements  |
| Planter   | 3 groves       |
| Builder   | 6 Build tags   |
| Scholar   | 4 Science tags |

Awards:

| Award      | Winner                 |
| ---------- | ---------------------- |
| Landlord   | Most tiles             |
| Banker     | Most credit production |
| Scientist  | Most Science tags      |
| Thermalist | Most heat              |
| Miner      | Most ore and crystal   |

### Modes, interface, controls

The menu offers 2–4 players and the opponents: cadets, architects, or everyone on this device. It
also has new game, resume, watch the AI (an architect and two cadets) and your record. With
everyone on one device, a hand-off screen hides the hands and offers between players.

The table shows:

- the three parameter tracks and the map, where spaces you may place on are highlighted;
- the panel of the current step:
  - corporations, with the 10 cards to preview;
  - the offer with toggles and a buy button;
  - the hand with play and sell, card actions, standard projects with their effects,
    conversions and pass;
- players, with TR, the six resources with production, cards in hand and cards played;
- milestones and awards, with claim and fund buttons;
- the log and the final score breakdown.

Card text is generated from the card data in both languages. Keys: P pass, H hint.

### Saves, statistics, achievements

The save slot is versioned and validated: parameters, tiles in fitting spaces, every card in
exactly one place, resources and production in range. It also holds the opponents and the
record. Results against the computer record your points.

Achievements:

- Planet Shaper: win.
- Master Plan: beat the architects.
- Milestone: claim one.
- Green Thumb: three groves.
- Well-Oiled Engine: twelve cards in play.

### AI interface

The environment has 2–4 seats. Actions are integers:

- pass;
- the two conversions;
- the corporation choice;
- the standard projects;
- milestones and awards;
- a tile space;
- play, use or sell a card;
- a buy mask over the offer (up to 10 cards).

Observations hide the deck, the generator and the other players' hands and offers (only hand
sizes). The game is not zero-sum.

Agents:

- **Cadet** values every action in credits:
  - production for five generations;
  - 5 credits per point;
  - a parameter step as a point plus income;
  - money it is hoarding counted at less.

  It takes the best action it can afford, converts flora and heat, claims milestones, and buys the
  cards it values above their price.

- **Architect** works in two stages:
  1. It estimates the generations left from the pace of shaping and ranks its actions with that.
     Production counts less late and points more; it funds awards it leads late in the game.
  2. It plays out its four best actions and passing, in three imagined games each, to the end
     with cadets everywhere. In those games the deck and the other players' hands and offers are
     reshuffled, since it cannot know them. It takes the action with the best final margin over
     the strongest rival. It buys cards like the cadet.

Measured (seats rotating):

| Match-up                                 | Architect wins                        | Even play would win |
| ---------------------------------------- | ------------------------------------- | ------------------- |
| Architect vs cadet, 2 players            | 15 of 20, and 18 of 20 on other seeds | 10 of 20            |
| One architect vs two cadets, 3 players   | 14 of 24                              | 8 of 24             |
| One architect vs three cadets, 4 players | 7 of 16                               | 4 of 16             |
| Unit test (2 players)                    | 13 of 16                              | 8 of 16             |

Cadets beat random play 10 of 10.

A game takes about 9 generations with two architects, 7 with three players and 6 with four.

During tuning:

- With TR 14 and longer tracks (heat 12, air 10, seas 8), games ran to the generation limit.
  The tracks were shortened and TR raised to 20.
- A heuristic-only architect (budgets, a bigger value for steps, stricter buying) was no better
  than the cadet with three or four players. It was replaced by the look-ahead.
- Buying like the cadet beat its own stricter buying.

### Tests

`tests/engine.test.ts`:

- content: map, basins, bonuses, 57 unique cards, corporations, events;
- set-up for 2–4 players, with corporations never repeated;
- buying prices;
- requirements, discounts, payment with ore and crystal, overpaying, refusal;
- tags, triggers and events;
- production limits;
- Meridian's rebate;
- heat bonuses;
- seas, groves next to your tiles, settlements apart, credits from adjacent seas;
- conversions, and seas running out;
- card actions once per generation;
- milestones and awards limits and costs;
- a generation's production and research;
- the end and scoring, including ties for an award;
- random games to the end;
- codes round-trip and hidden observations;
- agent strength;
- the adapter contract.

`tests/ui.test.tsx`:

- two generations against cadets, played through the table (corporation, buying with toggles,
  cards, projects, tiles, passing);
- the hand-off for everyone on one device: hidden offers, buying, resuming, a standard project.

`tests/e2e/games/planet-shapers.spec.ts`, on desktop and mobile:

- choosing a corporation;
- buying two cards;
- playing a card;
- a settlement placed by clicking the map;
- resume;
- watch mode.

### Simplifications

- One action per turn, not one or two.
- Payment is automatic, with no choice of how much ore or crystal to use.
- No drafting.
- No cards that attack other players.
- No special tiles.
- No final flora conversion after the last production.
- The map and its bonuses are fixed.
- The game ends at generation 14 even if the planet is unfinished. This was not reached in AI
  games except with random players.
