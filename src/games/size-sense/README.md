# #232 Size Sense

The size-estimation guessing game in the style of Size It Up (generic name; original art, code
and texts; real measurements). A mystery object stands next to a reference drawn at true scale and
the player stretches its silhouette to the size they believe is right.

| File                      | Role                                                                      |
| ------------------------- | ------------------------------------------------------------------------- |
| `engine.ts`               | Pure rules: objects, references, pools, scoring, sessions, validation     |
| `Stage.tsx`               | The true-scale stage: layout per axis, auto-zoom, drag/wheel/keys, reveal |
| `Silhouettes.tsx`         | 25 original SVG silhouettes with real-world proportions                   |
| `SizeSenseGame.tsx`       | Menu, record, play, reveal, results; saves                                |
| `format.ts`               | Metric/imperial lengths                                                   |
| `ai-adapter.ts`           | `GameEnvironment` (discrete log-scale guesses) and agents                 |
| `objects.json`            | The shipped measurements (generated)                                      |
| `tools/size-queries.ts`   | The Wikidata queries, one per object family                               |
| `tools/fetch-sizes.ts`    | Downloads them into `.cache/wikidata/` (rate-limit aware)                 |
| `tools/generate-sizes.ts` | Validates and builds `objects.json`                                       |

## Specification

### Data (5,716 objects, 21 families)

From the Wikidata Query Service (data CC0), downloaded 2026-11-27: heights of skyscrapers,
towers, lighthouses, statues, pyramids, dams, big wheels, roller coasters, launch vehicles and
notable trees; lengths of bridges, ships (carriers, battleships, liners, cruise ships, corvettes,
frigates, destroyers, submarines, container ships, sailing ships), aircraft models (also their
wingspans), car models and locomotives; diameters of coins and of solar-system bodies (twice the
mean radius) and stars. Each family needs a minimum number of Wikipedia sitelinks (its notability).

Verification in `tools/generate-sizes.ts`, per object and dimension:

- only statements without an “applies to part” qualifier (antenna, roof, hull…), except that a
  “mean” qualifier wins when present (planet radii are listed equatorial / polar / mean);
- if any statement is preferred-rank, only preferred ones count;
- the remaining values must agree within 5 %, otherwise the object is dropped as ambiguous;
- the value must be plausible for its family (e.g. cars 2–8 m, coins 1–6 cm), which catches unit
  slips; launch vehicles need ≥ 25 m (drops orbiters filed under the same classes);
- known units only (m, cm, mm, km, ft, in, yd, mi, solar radius).

Spot checks in the tests: Burj Khalifa 828 m, Golden Gate Bridge 2,737 m, Jupiter 139,820 km,
Earth 12,742 km, Moon 3,475 km (all within 1 %). Caveat shown in the rules: building heights are
what Wikidata records and may include spires or antennas.

Built-in standard references: an adult (1.75 m), an ID-1 card (85.60 mm, ISO/IEC 7810), a CD
(120 mm, ECMA-130) and a football pitch (105 m, FIFA's recommended length).

Refresh: `npx tsx tools/fetch-sizes.ts --force && npx tsx tools/generate-sizes.ts`.

### Ruleset (`size-sense-wikidata`)

- **Axes**: heights stand side by side on the ground; lengths and wingspans are two rows;
  diameters are discs side by side. A reference always shares the mystery's axis.
- **Difficulty**: the mystery's minimum fame and the reference's size ratio.

  | Difficulty | Objects                | Reference ratio |
  | ---------- | ---------------------- | --------------- |
  | Easy       | sitelinks ≥ 30 (525)   | 1.25–3×         |
  | Normal     | sitelinks ≥ 15 (2,587) | 1.3–5×          |
  | Hard       | all (5,716)            | 1.4–8×          |

  References are well-known objects (sitelinks ≥ 25) or the built-in standards, bigger or smaller
  at random; if none fits the ratio, the nearest one does. Targets are drawn family first, then
  object, so the 1,549 car models do not crowd the rest out; no family twice in a row.

- **Guess**: from 1/40 to 40 times the reference, starting at the reference's size.
- **Score**: `round(100 · e^(−1.152 · |ln(guess / actual)|))` — exact 100, ±10 % 90, ±25 % 77,
  half or double 45, a third or triple 28, ten times off 7.

### Modes

Daily (five Normal objects, all categories, seeded by date, one play a day, streak, share line
with ≥ 90 / ≥ 70 / ≥ 45 / lower squares) and Endless (difficulty × category: buildings &
structures, vehicles, space, everything; the last 1,500 objects are avoided; “End run” records
it). `?deal=N` fixes the endless seed. Metric or imperial units.

### Interface and controls

Object card (kind, name, question), the stage (dark “screen” in both themes, reference in light
ink with its name and size, the mystery in the accent color with a handle; a marker when it is
tiny), a log-scale slider, Lock in / End run. The view eases to fit whatever is shown (frozen while
dragging). Reveal: the real size drawn over the now-translucent guess with a dashed frame, score
count-up and grade, both sizes, the ratio (“1.9× too small”), and the Wikidata link.

Pointer/touch: drag anywhere on the stage (`touch-action: none`) — height/diameter follow the
pointer's height above the ground, length its distance from the left edge. Mouse wheel. Keyboard
with the stage focused: `↑`/`→` +2 %, `↓`/`←` −2 % (`Shift`: 10 %), `Enter` locks in.

### Saves, statistics, achievements

One versioned slot: session (resumable), daily totals, seen objects, difficulty, category, units,
record (objects, average, best, within 10 %). Results `daily` / `endless:<difficulty>`.
Achievements: Measuring Up, Spot On (≥ 97), Human Tape Measure (25 within 10 %), Astronomer
(≥ 80 on a planet, moon or star), Sharp Eye (≥ 400 daily), Daily Measure (7-day streak).

### AI interface

Action `k` ∈ −20…20: guess = reference × 2^(k/4). Observation: name, family, dimension, the
reference (name, family, size) — never the mystery's size. Agents: Random, Same as reference,
Typical size (median of the family, leaving the object out). `npm run evaluate -- size-sense <a>
<a> 200 7`, mean session total out of 500: Random 116.0, Same as reference 194.0, **Typical size
287.6**.

### Tests

`tests/engine.test.ts` (dataset integrity and spot checks, scoring curve, formatting, reference
axis/ratio rules for 1,200 draws, categories, built-in references, daily determinism, illegal
guesses, endless totals and trimming, validation, agents, adapter contract with an observation
check); `tests/ui.test.tsx` (full daily with keyboard and slider, record, imperial units, resume,
end run); `tests/e2e/games/size-sense.spec.ts` (daily sized by dragging the handle with real
pointer moves, reload record; keyboard endless run resumed after reload; desktop and Pixel 7).
