# #255 Farmstead

A worker-placement farming game for 1–4 players. The name is generic; the spaces, improvements,
scoring table, names and art are all original. The catalog entry asks for worker placement,
feeding and farm scoring.

The genre mechanics used here:

- family members placed one per action space each round;
- spaces that pile up goods while nobody takes them;
- new spaces revealed stage by stage;
- a farmyard of rooms, fields, pastures and stables;
- harvests where the family must be fed or beg;
- breeding animals;
- a scoring table that rewards a balanced farm.

The content is our own:

- twelve rounds in five stages, with harvests after rounds 3, 6, 8, 10 and 12;
- our own set of 23 action spaces;
- ten improvements with our own costs and effects (hearths, kitchen ranges, a bread oven, a
  smokehouse, a weaver, a carpenter's bench, a mill, a cistern);
- our own pasture-cost rule;
- our own scoring thresholds.

| File            | Role                                                                                 |
| --------------- | ------------------------------------------------------------------------------------ |
| `world.ts`      | Spaces, stages, farmyard, building costs, improvements, cooking rates, scoring table |
| `engine.ts`     | Pure rules: rounds, placements, every step, animals, harvest, feeding, scoring       |
| `ai.ts`         | Farmhand and steward players                                                         |
| `ai-adapter.ts` | `GameEnvironment`: integer action encoding, observations                             |
| `FarmTable.tsx` | Menu, action spaces, the clickable farmyard, step panel, farms, improvements, log    |

## Specification

### Set-up

Each player has:

- a 3×5 farmyard with two wooden rooms (left column, middle and bottom);
- two family members;
- 2 food for the first player and 3 for the others.

Nine permanent spaces are open from the start, plus:

- Copse with 3 or more players;
- Traders with 4.

The twelve round spaces are shuffled within their stages and come out one per round, in stage
order:

| Stage | Rounds | Spaces                                  |
| ----- | ------ | --------------------------------------- |
| 1     | 1–3    | Sheep Fair, Fencing, Sow and Bake       |
| 2     | 4–6    | Family Growth, Stone Quarry, Renovation |
| 3     | 7–8    | Vegetable Seeds, Pig Fair               |
| 4     | 9–10   | Cattle Fair, Deep Quarry                |
| 5     | 11–12  | Hurried Growth, Field Work              |

### Spaces

Spaces that pile up goods every round until taken:

| Space        | Goods per round | In play    |
| ------------ | --------------- | ---------- |
| Forest       | 3 timber        | Always     |
| Clay Pit     | 1 clay          | Always     |
| Reed Bank    | 1 reed          | Always     |
| Fishing Pond | 1 food          | Always     |
| Copse        | 2 timber        | 3+ players |
| Sheep Fair   | 1 sheep         | Stage 1    |
| Stone Quarry | 1 stone         | Stage 2    |
| Pig Fair     | 1 pig           | Stage 3    |
| Cattle Fair  | 1 cow           | Stage 4    |
| Deep Quarry  | 1 stone         | Stage 4    |

Spaces with a fixed gain:

| Space           | Gain                   | In play   |
| --------------- | ---------------------- | --------- |
| Day Labour      | 2 food                 | Always    |
| Grain Seeds     | 1 grain                | Always    |
| Traders         | 1 clay, 1 reed, 1 food | 4 players |
| Vegetable Seeds | 1 vegetable            | Stage 3   |

Spaces with steps:

- **Ploughing:** plough 1 field.
- **Builder:** rooms (5 of the house's material plus 2 reed, next to a room) and stables (2 timber,
  at most 4).
- **Village Meeting:** become first player, then buy an improvement.
- **Fencing:** pastures. A pasture costs 4 timber, minus 1 per side shared with another pasture,
  and at least 1.
- **Sow and Bake:** sow, then bake.
- **Family Growth:** a member (needs a free room).
- **Renovation:** wood to clay, or clay to stone (1 per room plus 1 reed), then an improvement.
- **Hurried Growth:** a member, room or not.
- **Field Work:** plough, then sow.

A space can be taken only if its action can be done. One worker goes on each space per round.
Steps that cannot be done are skipped, and the open-ended ones end with “done”.

Farm rules:

- Fields must touch other fields once you have one.
- Sowing turns 1 grain into a field of 3 grain, or 1 vegetable into a field of 2.

Animals live in:

- pastures (2 each, 4 with a stable);
- unfenced stables (1);
- the house (1 pet).

Whatever does not fit is cooked if you have a hearth or range, or it runs off.

### Improvements

| Improvement       | Cost              | Points | Effect                                           |
| ----------------- | ----------------- | ------ | ------------------------------------------------ |
| Hearth (2 copies) | 2 clay / 3 clay   | 1      | Cook veg 2, sheep 2, pig 2, cow 3; bake 2        |
| Kitchen Range (2) | 4 clay / 5 clay   | 1      | Cook veg 3, sheep 2, pig 3, cow 4; bake 3        |
| Bread Oven        | 2 clay, 2 stone   | 2      | Bake up to 2 grain at 4 food                     |
| Smokehouse        | 2 timber, 1 stone | 1      | Each harvest, 1 animal into 4 food               |
| Weaver            | 2 reed, 1 timber  | 1      | Each harvest, 1 food per sheep (at most 2)       |
| Carpenter's Bench | 2 timber, 1 stone | 1      | End: 1/2/3 points for 2/4/6 timber               |
| Mill              | 2 timber, 2 stone | 2      | Each harvest, 1 grain into 3 food                |
| Cistern           | 2 stone, 1 clay   | 3      | 1 food at the start of each of the next 4 rounds |

### Rounds and harvests

Each round:

1. A space opens.
2. Accumulating spaces gain their goods.
3. A cistern pays its food.
4. From the first player, players take turns placing one member each until everyone has placed
   all their members. Newborns work from the next round.

After rounds 3, 6, 8, 10 and 12 comes the harvest:

1. Each sown field yields 1.
2. Feeding: each member eats 2, and a newborn this round eats 1. Food is used first. If it is
   short, the harvest improvements apply, then goods are converted automatically, best rate
   first:
   1. grain beyond one (baked when possible);
   2. animals beyond a breeding pair (with a hearth or range);
   3. vegetables;
   4. the last grain;
   5. the last animals.

   What is still missing is begging: −3 points each.

3. Each kind of animal with 2 or more breeds one, if it fits.

### Scoring

| Category   | −1  | 1   | 2   | 3   | 4   |
| ---------- | --- | --- | --- | --- | --- |
| Fields     | 0–1 | 2   | 3   | 4   | 5+  |
| Pastures   | 0   | 1   | 2   | 3   | 4+  |
| Grain      | 0   | 1–3 | 4–5 | 6–7 | 8+  |
| Vegetables | 0   | 1   | 2   | 3   | 4+  |
| Sheep      | 0   | 1–2 | 3–4 | 5–6 | 7+  |
| Pigs       | 0   | 1–2 | 3–4 | 5   | 6+  |
| Cows       | 0   | 1   | 2–3 | 4   | 5+  |

Grain and vegetables count those still in fields too.

Further points:

- −1 per empty square;
- +1 per fenced stable;
- clay rooms +1 each and stone rooms +2 each;
- 3 per family member;
- −3 per begging card;
- improvement points.

The highest total wins; food left over breaks ties.

### Modes, interface, controls

The menu offers 2–4 players and the opponents: farmhands, stewards, or everyone on this device. It
also has new game, resume, watch the AI (a steward and two farmhands) and your record. Everything
is public, so there is no hand-off.

The action spaces show the goods lying on them and who took them. The current player's farmyard
is a 3×5 grid of buttons; the squares where the current step can be done are highlighted. The
step panel has:

- room or stable mode while building;
- grain or vegetables while sowing;
- bake buttons with the food they give;
- done or skip.

Improvements are bought from their panel. Every farm shows its goods, animals, family, house,
begging, improvements and a small yard. The log and the final score breakdown follow. Keys: D
done, H hint. On phones the spaces stack two per row.

### Saves, statistics, achievements

The save slot is versioned and validated: spaces, farmyards, goods, animals that fit, family size
and phases. It also holds the opponents and the record. Results against the computer record your
points.

Achievements:

- Good Harvest: win.
- Master of the Land: beat the stewards.
- Full Table: a family of four.
- Menagerie: sheep, pigs and cows at once.
- Built to Last: a stone house.

### AI interface

The environment has 2–4 seats. Actions are integers:

- place on a space;
- room, stable, plough or pasture on a square;
- sow grain or vegetables on a square;
- buy an improvement;
- bake 1–40 grain;
- done.

Observations hide the generator and the order of the round spaces still to come (only how many).

Agents:

- **Farmhand** takes the choice that leaves its farm worth most. The worth is its current score,
  plus plain values for goods and food, minus the begging its stocks would cause at the next
  harvest. It finishes each space's steps the same way.
- **Steward** values a farm by the rounds left:
  - a member by the work it will still do;
  - a free room by the growth it allows;
  - progress toward the next room;
  - sown crops by what they will still yield;
  - a hearth by the food it unlocks;
  - food planned for every harvest left;
  - what a space would have been worth to a rival.

  It ranks its placements by that measure. Then it tries the best three in two imagined futures
  each, played three rounds on by farmhands. In those futures the round spaces still to come are
  reshuffled within their stages, since it cannot know them. It takes the placement that leaves it
  furthest ahead of the strongest rival.

Measured (seats rotating):

| Match-up                                  | Steward wins | Even play would win |
| ----------------------------------------- | ------------ | ------------------- |
| Steward vs farmhand, 2 players            | 18 of 20     | 10                  |
| One steward vs two farmhands, 3 players   | 12 of 12     | 4                   |
| One steward vs three farmhands, 4 players | 7 of 8       | 2                   |

The steward averages 17–22 points against the farmhands' 6–10. Farmhands beat random play 10 of
10, and average 13 points against each other.

The steward takes about 0.3 s a move with two players and 0.5 s with three.

During tuning:

- The first steward without look-ahead valued a free room almost as much as the member it would
  hold, so it never grew its family. Fixing that lifted its scores.
- On its own, the heuristic was not stronger than the farmhand with three players.
- Cheaper look-ahead policies, judging spaces without finishing their steps, were faster but too
  weak.

### Tests

`tests/engine.test.ts`:

- set-up by player count and stage order;
- accumulating spaces;
- room, field and pasture spots and pasture costs;
- the builder with its costs;
- family growth and hurried growth;
- sowing and baking with hearth, oven and range;
- fencing and housing animals;
- animals cooked or lost;
- renovation followed by an improvement;
- feeding, begging and newborns;
- a harvest round with crops and breeding;
- the scoring table and a farm's score with stone rooms and the bench;
- random games to the end;
- codes round-trip and observations;
- agent strength;
- the adapter contract.

`tests/ui.test.tsx`:

- four rounds against farmhands, played through the table past the first harvest;
- building a room and a stable by clicking the yard, with the right squares highlighted;
- resume.

`tests/e2e/games/farmstead.spec.ts`, on desktop and mobile:

- taking the forest;
- ploughing by clicking the farm;
- the computer's turns;
- round 2;
- resume;
- watch mode.

### Simplifications

- Pastures are single squares; a fence is not a separate piece.
- Feeding conversions at harvest are automatic, and cooking happens only then and when animals
  arrive with no room. There is no cooking at any time.
- No occupations or minor improvements, which are personal cards.
- Animals are housed automatically.
- Rounds 1–12 instead of a longer game, with five harvests.
