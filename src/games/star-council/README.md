# #253 Star Council

A galactic strategy game for 1–4 players. The name is generic, and the galaxy, factions, cards,
technologies, objectives, agendas, names and art are all original. The catalog entry asks for a
galactic 4X with politics and objectives. The genre's mechanics used here:

- strategy cards picked each round, whose primary and secondary abilities set the turn order;
- command tokens that activate systems;
- moving fleets with carried fighters and infantry;
- dice space battles, then invasion and production at docks;
- planets that are exhausted for resources and influence;
- public objectives and a central throne-world;
- a council voting on agendas.

The content is our own: the Nexus with its world Concord, six invented factions (each with a home
and one ability), 24 planet systems with 32 named planets, six strategy cards, eight
technologies, eighteen objectives and twelve agendas.

| File            | Role                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------- |
| `world.ts`      | The hex galaxy, factions, system pool, units, cards, technologies, objectives, agendas              |
| `engine.ts`     | Pure rules: dealing the galaxy, every phase, movement, combat, invasion, production, paying, voting |
| `ai.ts`         | Envoy and regent players; space-battle odds                                                         |
| `ai-adapter.ts` | `GameEnvironment`: integer action encoding, observations                                            |
| `GalaxyMap.tsx` | The galaxy in SVG: systems, anomalies, planets with holders and docks, fleets, command tokens       |
| `StarTable.tsx` | Menu, the panels of every phase, players, the chosen system, objectives, laws, log                  |

## Specification

### The galaxy

The galaxy has 37 hex positions of radius 3. The Nexus sits in the middle, holding Concord
(1 resource, 4 influence), which two neutral wardens guard. Home systems sit on corners of the
outer ring: two opposite corners for 2 players, every other corner for 3, and four corners for 4.

The other positions are dealt per seed from 36 tiles:

- 24 planet systems (one to three planets, each with resources and influence);
- 6 empty systems;
- 2 nebulae (ships must stop there);
- 2 rifts (entering one costs no movement);
- 2 asteroid fields (impassable).

The deal is redrawn until no anomaly touches a home, every home has at least two planet systems
beside it, no two fields touch, and every home reaches the Nexus and every other home.

### Factions

| Faction         | Home planets                       | Ability                                                               |
| --------------- | ---------------------------------- | --------------------------------------------------------------------- |
| Vey Collective  | Vey Prime (4/2), Vey Minor (1/1)   | Starts with Ion Drives; following Research costs 2 resources, not 4   |
| Oru Syndicate   | Orumar (5/3)                       | Starts with 3 trade goods; +1 trade good whenever Commerce gives some |
| Hesh Ascendancy | Hesh Anvil (3/1), Hesh Spire (2/2) | Ships hit on 1 less in the first round of every space battle          |
| Lumen Choir     | Lumenar (3/4)                      | 3 extra votes on every agenda                                         |
| Tal Wardens     | Talgard (4/2), Talrest (1/1)       | Infantry hit on 1 less when defending; starts with 2 more infantry    |
| Ixa Drift       | Ixa Wake (3/2), Ixa Shoal (2/1)    | Carriers move 1 more; its ships ignore nebulae                        |

Every faction starts with a carrier, a cruiser, a dreadnought, 2 fighters, 3 infantry and a dock on
its first home planet, plus 4 command tokens. The player chooses a faction in the menu, or gets a
random one; the others are dealt at random.

### Units

A unit hits when its d10 roll is at least its combat value.

| Unit        | Cost | Combat | Move | Capacity | Notes                                     |
| ----------- | ---- | ------ | ---- | -------- | ----------------------------------------- |
| Infantry    | 1    | 8      | —    | —        | Ground forces                             |
| Fighter     | 1    | 9      | —    | —        | Needs capacity in space                   |
| Cruiser     | 2    | 7      | 2    | —        |                                           |
| Carrier     | 3    | 9      | 1    | 4        |                                           |
| Dreadnought | 4    | 5      | 1    | 1        | Sustains one hit; bombards (one die on 5) |

Limits:

- Fleet limit: 4 cruisers, carriers and dreadnoughts per player per system.
- Supply: 14 infantry, 10 fighters, 6 cruisers, 4 carriers, 4 dreadnoughts and 3 docks.

### Ruleset (`star-council-1`)

Each round:

1. **Strategy.** Starting from the speaker, each player takes one card; with two players, each
   takes two. A card nobody takes gains a trade good for whoever takes it later. The lowest card
   number held sets the turn order. The cards:

   | #   | Card     | Primary                                                       | Secondary (others)                             |
   | --- | -------- | ------------------------------------------------------------- | ---------------------------------------------- |
   | 1   | Command  | +2 command tokens; become the speaker                         | Pay 3 influence for a token (costs no token)   |
   | 2   | Accord   | Ready all your exhausted planets                              | A token: ready your two best exhausted planets |
   | 3   | Commerce | +3 trade goods                                                | A token: +1 trade good                         |
   | 4   | Industry | A free dock on one of your planets (one per system, 3 in all) | A token and 4 resources: a dock                |
   | 5   | Research | A technology                                                  | A token and 4 resources: a technology          |
   | 6   | Dominion | Score a public objective you meet now; +1 if you hold Concord | A token and 3 influence: score one             |

2. **Actions.** In turn order, each player takes one action at a time until everyone has passed.
   - **Tactical action:** spend a command token to activate a system that has none of your tokens.
     1. **Move.** Ships come in from systems in range that hold none of your tokens. Paths cannot
        pass through enemy fleets or (unless your ships ignore them) nebulae, and cannot cross
        fields; rifts cost nothing. Carriers and dreadnoughts bring fighters and infantry from
        the system they left (from space or from your planets there), within capacity. Fighters
        and infantry left without room travel along automatically.
     2. **Space battle**, if enemy ships are there. Every ship rolls each round. Hits are taken
        automatically: an unhurt dreadnought absorbs one, then fighters, cruisers, carriers and
        dreadnoughts go. After any round the attacker may retreat to a neighbouring system that
        holds its planets or ships and no enemy ships.
     3. **Invasion.** Land infantry on the system's planets. Landing on your own planet garrisons
        it, and an unguarded planet is claimed. A defended planet is bombarded first, once per
        action, by your dreadnoughts there; then the ground combat runs to the end. The defenders
        hit on 8, Tal defenders on 7 and the wardens on 7. A planet you take comes exhausted and
        loses its dock. The first player to take Concord scores 1 point.
     4. **Production**, if you have a dock there and no enemy ships. Build units up to the dock
        planet's resources + 2, paying resources. The units go into the system: infantry onto the
        dock planet, the rest into space within the fleet limit and capacity.
   - **Strategic action:** play one of your cards. The others are then asked in seat order whether
     to follow its secondary.
   - **Pass**, once all your cards have been played.

   Paying exhausts your ready planets, covering the cost with as little waste as possible, and
   trade goods make up the rest. Resources are paid first, then influence.

3. **Status.** In turn order, each player may score one revealed public objective they meet.
   “Spend” objectives are paid when scored, and each objective is scored at most once per player.
   Then:
   - whoever holds Concord gains 1 point;
   - after the last round the game ends here;
   - otherwise a new objective is revealed (stage I in rounds 1–2, stage II after that);
   - every player gains 2 command tokens (up to 12) and readies all planets;
   - damaged dreadnoughts are repaired;
   - the board's command tokens and the strategy cards return.

4. **Council**, once anyone has taken Concord. One agenda is revealed and players vote in seat
   order from the speaker's left. Voting casts all the influence of your ready planets, plus your
   faction and technology bonuses; those planets stay exhausted into the next round. You may
   abstain. The most votes win, and the speaker's choice breaks a tie. If nobody votes, nothing
   happens. The agendas are listed below.

Objectives:

- Stage I, 1 point: 6 planets; 9 resources; 9 influence; 2 technologies; ships in 4 systems;
  2 docks; spend 5 resources; spend 5 influence; a planet next to another player's home;
  spend 4 trade goods.
- Stage II, 2 points: 10 planets; 5 technologies; Concord; ships in 6 systems; spend 10
  resources; spend 10 influence; 3 dreadnoughts; a planet in another player's home.

Two stage-I objectives are revealed at the start.

Technologies (tier 2 needs two technologies already owned):

| Technology     | Tier | Effect                                              |
| -------------- | ---- | --------------------------------------------------- |
| Ion Drives     | 1    | Cruisers and carriers move 1 more                   |
| Hull Plating   | 1    | Cruisers and dreadnoughts hit on 1 less             |
| Orbital Drills | 1    | Planets with resources give 1 more when spent       |
| Envoy Network  | 1    | 1 more vote per planet you control                  |
| Warp Lattice   | 2    | Dreadnoughts move 1 more; your ships ignore nebulae |
| Fighter Wings  | 2    | Fighters hit on 8; carriers hold 6                  |
| Assault Corps  | 2    | Your infantry hit on 7                              |
| Logistics Core | 2    | Docks produce 2 more; fleet limit 5                 |

Agendas:

- Free Lanes (law): ships move 1 more.
- Shipwright Compact (law): docks produce 1 more.
- Council Laureate (elect a player): +1 point.
- Tribute of the Core (elect a player): +4 trade goods.
- Censure (elect a player): −1 point.
- Fleet Grant: for, a cruiser at every home; against, +1 trade good each.
- Mining Charter: for, a trade good per planet with 3+ resources; against, per planet with 3+
  influence.
- Disarmament: for, players with 2+ dreadnoughts scrap one; against, +1 token each.
- Open Archives: for, the players with the fewest technologies gain one.
- Nexus Mandate (elect a player): +2 tokens.
- Shared Watch: for, an infantry at every home; against, a fighter there.
- Speaker's Charter (elect a player): they become the speaker and gain +1 trade good.

**Victory.** Reaching the target score (7 or 10, chosen in the menu) wins at once. Otherwise,
after round 8 the most points win, then the most planets; a tie is shared.

### Modes, interface, controls

The menu offers 2–4 players, a faction, and opponents (envoys, regents, or everyone on this
device). It also sets the points to win and offers a new game, resume, watching the AI (regents
against envoys) and your record.

The galaxy map shows:

- each system's kind;
- planets tinted by their holder, with resources/influence, a yellow square for a dock and a
  yellow number for infantry; exhausted planets are dimmed;
- a badge per player with ships there (+ carried infantry);
- command tokens.

Click a system to see it in the system panel. In the action phase you can activate the selected
system or play a card, with buttons for each choice. Each later step has its own panel:

- the ships that can come in, one at a time or all;
- the battle, with fleets, the last dice and roll/retreat;
- landing on each planet;
- production, with + / − per unit, the queue and its cost;
- following a secondary;
- the status phase, listing the objectives as scored, ready or not met;
- the council, with the agenda, the votes cast and the options.

The side panels list the strategy cards (picking, trade goods, holders, played), the players
(points, tokens, trade goods, planets, technologies, cards, passed, speaker, ability), the public
objectives with who scored them, the laws in force and the log. Keys: D done, R roll, P pass,
H hint, Esc clears the selection. On phones the map scrolls sideways at a usable size.

### Saves, statistics, achievements

The save slot is versioned and holds the game, validated for places, fleets, planets, decks and
phases, along with the opponents and the record. Results against the computer record your points.

Achievements:

- First Among Stars: win.
- Regent Slayer: beat the regents.
- Seat of Power: hold the Nexus.
- Scholar: own four technologies.
- Voice of the Council: be elected.

### AI interface

The environment has 2–4 seats (`{ players, target }`). Actions are integers:

- pick a card;
- activate a system;
- build or unbuild a kind;
- play a card with a choice;
- follow with a choice;
- score an objective;
- vote for an option;
- land n on a planet;
- move n of a kind from a system;
- done, roll, retreat, decline, pass, skip and abstain.

Observations are the whole board without the generator or the order of the objective and agenda
decks; only their sizes are shown.

Agents (stateless: each action is recomputed from the board):

- **Envoy**:
  - values each system by the planets its carriers can claim there;
  - attacks fleets it outguns by half again;
  - builds carriers, infantry and cruisers when it has resources;
  - plays its cards early and votes for what helps it.
- **Regent**: the same as the envoy, plus:
  - simulates space battles with the real dice rules (40 runs): it attacks at 70 % and retreats
    under 25 %;
  - works toward the objectives it does not meet yet: Research or Industry when they would
    complete one, dreadnoughts, ship presence, and planets beside or inside enemy homes;
  - values Concord highly;
  - holds Dominion until it can score twice in a round;
  - holds back far attacks when an enemy fleet threatens its home;
  - follows secondaries only when they pay;
  - abstains on votes that matter little to it.

Measured (seats rotating):

| Match-up                              | Regent wins                                     | Even play would win |
| ------------------------------------- | ----------------------------------------------- | ------------------- |
| Regent vs envoy, 2 players            | 20 of 30 (seeds 1–30); 23 of 30 (seeds 301–330) | 15 of 30            |
| One regent vs two envoys, 3 players   | 17 of 30 and 18.5 of 30                         | 10 of 30            |
| One regent vs three envoys, 4 players | 10 of 20 and 9.5 of 20                          | 5 of 20             |

Envoys beat random play (unit test).

During tuning, a garrison kept at home and a separate Dominion pick rule were measured and
dropped because they made no difference or hurt. A resource reserve for “spend” objectives made
no difference and was dropped too. Rushing the Nexus harder and attacking at lower odds changed
nothing.

### Tests

`tests/engine.test.ts`:

- the galaxy: positions, neighbours, corners, pool sizes, unique names; deals over 30 seeds with
  every constraint checked;
- the opening;
- the strategy phase: double picks, trade goods on cards, initiative;
- movement: rifts, nebulae, fields, enemy fleets, tokens, fleet limit, capacity and units
  carried along;
- space combat: hit order, battles over 20 seeds, retreat, odds;
- invasion: claims, ground combat over 40 seeds, docks lost, the Nexus first-seat point;
- production and payment;
- every strategy card and passing;
- objectives, the status phase, council votes and ties, agenda effects;
- instant and end-of-rounds victory;
- random games to the end; codes round-trip; agent strength (regent vs envoy over 30 games,
  envoys vs random); the adapter contract.

`tests/ui.test.tsx`: two rounds of a three-player game against envoys, played through the table
(picking, the map, moves, landing, cards, passing), plus the council vote, its log and resume.

`tests/e2e/games/star-council.spec.ts`, on desktop and mobile:

- picking cards;
- activating a system by clicking the map;
- moving a carrier and all infantry;
- landing on two planets;
- the computer's turn;
- playing Command;
- resume;
- watch mode.

### Simplifications

- Hits are assigned in a fixed order (dreadnought sustain first, then cheapest), not chosen by
  the owner. Only the attacker may retreat.
- Carriers and dreadnoughts pick up fighters and infantry only in the system they leave, not on
  the way.
- Planets to exhaust are chosen automatically (least waste); resources are paid before influence.
- No secret objectives, action cards, promissory notes, trading between players, units beyond
  the five types, structures other than docks, or technology colours (tier 2 needs any two).
- One agenda per council; votes commit all your ready influence or none.
