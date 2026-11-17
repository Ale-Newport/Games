# #228 Idle Bakery

The incremental cookie clicker (generic name, original art, building and upgrade names, and news
headlines), with the genre's classic economy.

| File             | Role                                                                 |
| ---------------- | -------------------------------------------------------------------- |
| `engine.ts`      | Pure economy: clicks, buildings, upgrades, golden pastries, prestige |
| `BakeryGame.tsx` | The big cookie, store, upgrades, stats, ascension, news, saves       |
| `ai-adapter.ts`  | One-hour environment and the payback agent                           |

## Specification

### Ruleset (`idle-bakery-classic`)

- A click bakes `2^(rolling pins) × (1 + prestige %)` cookies, plus 1 % of production per second
  for each whisk bought, ×777 during a click frenzy.
- Twelve buildings (base price → cookies per second): cursor 15 → 0.1, grandma 100 → 1, farm 1,100
  → 8, mine 12,000 → 47, factory 130,000 → 260, bank 1.4 M → 1,400, temple 20 M → 7,800, wizard
  tower 330 M → 44,000, shipment 5.1 B → 260,000, alchemy lab 75 B → 1.6 M, portal 1 T → 10 M,
  time machine 14 T → 65 M. The k-th copy costs `base × 1.15^k` (rounded up); buy ×1 or ×10.
- Upgrades: five doublings per building, unlocked at 1, 5, 25, 50 and 100 owned, costing 10, 50,
  500, 50,000 and 5,000,000 × the building's base price; three rolling pins (×2 clicks) and three
  whisks (+1 % of production per click); Lucky day and Serendipity (more frequent, longer golden
  pastries).
- Golden pastries appear every 60–180 s (halved/quartered by the upgrades) and stay 13 s (26 with
  Lucky day). Clicking one gives: 45 % a lucky haul of min(15 % of the bank, 15 minutes of
  production) + 13; 45 % a frenzy (production ×7 for 77 s); 10 % a click frenzy (clicks ×777 for
  13 s).
- Ascension: prestige levels = ⌊∛(cookies baked ever / 10¹²)⌋; ascending (when it would add
  levels) restarts the bakery, keeping prestige, each level +1 % production.
- Offline: on return, 10 % of normal production for the time away, up to 12 hours.
- Everything saves automatically every 5 s and on leaving (`schema 1`).

### AI environment

One hour per episode, one decision per second: click (ten clicks), wait, buy a building, buy an
upgrade, catch a golden pastry. Reward 1 + log10(cookies baked). Agents: random, and Payback —
it buys whatever pays back its price soonest (counting the wait to afford it), catches golden
pastries, and clicks while saving.

### Controls

Click or tap the big cookie (Enter/Space when focused); click store items and upgrades; ×1/×10;
golden pastries are buttons too.

### Graphics and audio

A glowing purple backdrop with a big drawn cookie that squashes when clicked, floating “+N”
numbers (off with reduced motion), a pulsing golden pastry, buff and lucky messages, a rotating
news ticker of original headlines, store rows with prices that turn green when affordable, an
upgrade grid with tooltips, and a stats panel. Soft sounds for clicks, purchases, upgrades,
golden pastries, frenzies and ascension. Numbers use thousand/million/billion… names in English
and the long scale (mil millones, billones…) in Spanish.

### Simplifications

No sugar lumps, minigames, seasons, milk/kitten upgrades or heavenly upgrade tree; twelve
buildings rather than the original's full list.

### Achievements

batch, million, billion, clicker (1,000 clicks), golden, tycoon (100 buildings), ascend.

### Tests

`tests/engine.test.ts` (clicks and building prices, upgrades, golden pastries and their effects,
ascension and offline baking, number names, the payback agent's hour, adapter contract),
`tests/ui.test.tsx`, `tests/e2e/games/idle-bakery.spec.ts`.
