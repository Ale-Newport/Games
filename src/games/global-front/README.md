# #252 Global Front

A grand-strategy war game for 1–2 players (generic name; original world, powers, names and art —
the brief's “Axis & Allies” entry asks for grand strategy with production and land, sea and air
combat). The genre's mechanics: powers in two alliances taking turns, buying units with income,
combat movement, dice battles by attack and defence values, non-combat movement, placing at
factories, collecting income, capturing capitals and victory cities. Ours: the invented world of
Meridian (26 territories, 7 seas) and four invented powers — the Northern Pact (Varn Dominion,
Ossian League) and the Southern Accord (Kelt Union, Tamaran Republic) — with our own values and
opening forces.

| File             | Role                                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| `world.ts`       | The map (hex grid), powers, sides, unit types, cities, factories, set-up                              |
| `engine.ts`      | Pure rules: buying, moving (land, air, sea, by transport), battles, capture, placing, income, victory |
| `ai.ts`          | Colonel and general players; battle simulation                                                        |
| `ai-adapter.ts`  | `GameEnvironment`: integer action encoding, observations                                              |
| `WorldMap.tsx`   | The world in SVG: holders, coasts, cities, capitals, factories, stacks                                |
| `FrontTable.tsx` | Menu, phases, buying, place panel with moves, battle panel, status, log                               |

## Specification

### The world

26 territories and 7 seas generated on a hex grid like #248 (each place is the cells nearest its
seed; touching cells make neighbours). Each territory has a holder, a value (income) 1–6, maybe a
victory city (12 in all, six a side), a capital (one per power, with a factory) or a factory. Two
isthmuses join the continents; the western waters are cut off from the middle sea by one of them.
Opening forces by value (capitals: 4 infantry, 2 artillery, 2 armour, 2 fighters, 1 bomber;
value 3: 3 infantry, artillery, armour; value 2: 2 infantry; value 1: 1 infantry; other factories
+1 armour, +1 fighter) and a fleet per power in its home waters (2 transports, a cruiser, a
battleship). Each power starts with its income in its treasury.

Units (cost · attack · defence · move): infantry 3·1·2·1, artillery 4·2·2·1, armour 6·3·3·2,
fighter 10·3·4·4, bomber 12·4·1·6, transport 7·0·0·2 (carries 2 land units), cruiser 10·3·3·2,
battleship 20·4·4·2 (two hits, repaired at the end of its owner's turn).

### Ruleset (`global-front-33`)

Turn order Varn, Kelt, Ossia, Tamar; each power's turn:

1. **Buy** with its treasury (not while its capital is in enemy hands); paid on moving on.
2. **Combat moves** (every move must end in a fight): land units through friendly, enemy-free
   land, the last step into an enemy territory (armour 2 steps); air units anywhere within range
   if friendly land held since the turn began is still within their remaining range; warships
   through open water (not past enemy warships) into enemy units; transports never attack but
   carry 1–2 fresh land units from a coast next to their water, through up to 2 water steps free of
   enemies, onto another coast (not out of water held by enemy warships).
3. **Battles**, one place at a time. Empty enemy territory with arriving land units is taken at
   once. Each round every unit with a positive value rolls a die and hits on its value or less;
   each artillery lifts one infantry's attack to 2. Hits are taken cheapest first; an unhurt
   battleship absorbs a hit; transports go last and are lost when undefended. The attacker may
   retreat after any round (units go back where they came from). Land units that win take the
   territory; a territory of an ally goes back to it (while its capital stands). Taking a capital
   takes its power's treasury. Then aircraft fly to the nearest friendly land in range, or are lost.
4. **Other moves** through friendly ground and water (land 1, armour 2; air to friendly land held
   since the turn began; ships through clear water; transports carrying troops between own coasts).
5. **Place** the units bought on own factories held since the turn began, up to each territory's
   value; ships into clear water next to them. Units left unplaced at the end of the turn go to the
   first open factory, or are refunded.
6. **Income**: the value of its territories, nothing while its capital is in enemy hands.

At the end of each round an alliance holding 9 of the 12 victory cities wins; after 15 rounds the
side with more cities (then more income) wins.

### Modes, interface, controls

Menu: your alliance, opponents (Colonels, Generals) or two players on one device, new game,
resume, watch the AI (generals vs colonels), record. The map shows holders, coasts, cities,
capitals, factories and a unit count per power on each place. Click a place to see its units; for
the moving power, pick a unit kind and how many, then a highlighted destination, or “By sea” with a
load. The battle panel lists attackers and defenders, the last dice and hits, with roll and
retreat. Buying and placing have their own panels. Status: round, cities per side, each power's
treasury and income. Keys: N next phase, R roll, H hint, Esc cancel. On phones the map scrolls
sideways at a usable size.

### Saves, statistics, achievements

Versioned slot with the war (validated: places, units on fitting terrain, treasuries), the side,
the opponents and the record. Results against the computer record the side's cities.
Achievements: Victory, Field Marshal (beat the generals), Breakthrough (take an enemy territory),
Fall of a Capital.

### AI interface

Two seats (the two alliances). Integer actions: buy / unbuy per kind, move one unit (kind, from,
to), sail (coast, water, coast, one of six loads), roll, retreat, place (kind, place), next.
Observations: the whole board (public) without the generator.

Agents (stateless: every decision is recomputed from the board, one action at a time):

- **Colonel**: infantry with armour every third purchase; attacks a neighbour when its strength
  (attack sum, artillery support counted) is at least 1.6 times the defence, committing units until
  it is; retreats below 0.6; moves spare units to the front; places at the first factory.
- **General**: the same purchases; simulates each possible battle with the real combat rules (60
  runs) and attacks where it wins at least 70 % of the time, ordered by the place's worth,
  committing until 70 %; lands two troops by sea on weak enemy coasts; retreats under 30 %; sends
  spare units to the front under most threat; places new units at the factory nearest the most
  threat. (A version that also bought transports and fighters and kept a capital garrison sized to
  the enemy's reach was measured and lost more games — the threat estimate is too cautious.)

Measured (sides alternating): general vs colonel 27 of 30; colonel vs random 2 of 2 (unit test).

### Tests

`tests/engine.test.ts`: the world (sizes, symmetric links, cities 6–6, capitals with factories,
sides, fleets at sea); the opening (treasuries, capital forces); buying (limits, changes, payment,
none without a capital); placing (factories held since the turn began, value limits, ships
beside); moving (land steps and armour, enemy territory ends a move, combat vs other moves; air
range and landing; ships, blocking warships, transports not attacking, the western waters cut
off); transports (two units, landing, blocked by enemy warships); battles (empty land taken; dice,
artillery and casualty order over 30 seeds; battleship and undefended transports; retreat;
capitals plundered; allies' land returned; aircraft landing); turn end and income; victory;
random games to the end; codes round-trip; battle odds; agent strength; adapter contract.
`tests/ui.test.tsx`: two full rounds of the Pact against colonels played through the table (buy,
map moves, battles, placing, next), and buying, the place panel, a battle and resume.
`tests/e2e/games/global-front.spec.ts`: a turn for Varn by clicking (buy, attack, fight, place,
end), the computer's Kelt turn, resume (desktop + mobile), and watch mode.

### Simplifications

- Casualties are taken in a fixed order (cheapest first, battleships absorbing, transports last)
  rather than chosen by their owner.
- No submarines, carriers or anti-aircraft guns; transports land troops directly (no naval battle
  on the way: they cannot pass enemy ships at all).
- Aircraft return home automatically after the battles to the nearest friendly land in range.
- Armour does not blitz through empty enemy territory.
