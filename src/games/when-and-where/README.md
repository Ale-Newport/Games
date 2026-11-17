# #229 When & Where

A where-and-when guessing game in the style of the viral illustrated-scene geo/history guessers
(generic name, original look). Instead of photographs, every scene is a 360° street panorama
painted procedurally in the browser from a list of clues, so there are no image assets at all.

| File            | Role                                                                                   |
| --------------- | -------------------------------------------------------------------------------------- |
| `scenes.ts`     | 35 scenes: place, year, flag, style, landmark, terrain, climate, script, signs, extras |
| `era.ts`        | Era cues derived from the year: vehicles, lamps, clothes, antennas, dishes, phones     |
| `painter.ts`    | Paints a 3,600 × 640 panorama from a scene (sky to traffic)                            |
| `Panorama.tsx`  | The draggable 360° view                                                                |
| `PinMap.tsx`    | A zoomable world map (Natural Earth) to drop a pin anywhere                            |
| `engine.ts`     | Pure rules: dealing, distances, scoring                                                |
| `ai-adapter.ts` | Environment over the clues, and the clue-reading agent                                 |

## Specification

### Ruleset (`when-and-where-5`)

- Five different scenes per game (seeded shuffle of 35, from 1872 to 2020, on six continents).
- For each: drop a pin anywhere on the map and choose a year from 1850 to 2025, then Guess.
- Place score: 5,000 within 25 km, then `5000 · e^(−(km − 25)/1450)`. Year score:
  `5000 · e^(−|years off|/11)` (about 3,000 at 5 years, 1,000 at 18). A game is out of 50,000.
- Optional round clock (none, 1 or 2 minutes): when it runs out the current year counts and a
  missing pin scores 0 for the place.
- The reveal shows the true place on the map with a great-circle line from your pin, the
  distance, the years off and the points; the summary lists all five.

### What the panoramas show

Sky by time of day (stars and moon at night, a low sun at dusk, haze in deserts); mountains or
hills (snow-capped in cold places) or the sea; a landmark silhouette (lattice tower, onion domes,
minaret and dome, pagoda, pyramids, clock tower, needle tower, supertall, shell roofs, table
mountain, sugarloaf, volcano, cathedral, temple columns, gateway arch, a graffitied wall); a row
of buildings in one of twelve styles with shop signs in the local language and script (vertical
neon signs in East Asia at night); the street, square, canal, snow or seaside promenade; lamps,
trees or palms; the national flag when it flew there that year; vehicles and people of the era
(horse carriages, early cars with spoked wheels, rounded mid-century cars, boxy seventies cars,
modern cars; clothes from bustles and top hats to phones in hand); roof TV antennas (1952–2004),
satellite dishes (from 1994); and extras such as trams, cable cars, double-deckers, yellow cabs,
classic cars, rickshaws, tuk-tuks, gondolas, bicycles, scooters, camels, boats and snowfall.

### AI environment

The observation is exactly the clues on screen (never the place or year). Each round takes two
actions: a pin on a 15° grid, then a decade. Reward: total points / 10,000. Agents: random and the
clue reader (script, climate and skyline for the place; vehicles for the decade), which averages
well over 20,000.

### Controls

Drag the panorama or use ←/→ when it has focus; click the map to pin, zoom with +/− or the wheel
and drag to pan; the year slider and ± buttons.

### Simplifications

Illustrations instead of photographs, so scenes are recognisable by their clues rather than
exact streets; 35 scenes (the deck repeats across games).

### Achievements

bullseye (within 50 km), exact-year, round-9000, game-35000.

### Tests

`tests/engine.test.ts` (scene data, eras, distances and scores, a full game, the clue reader in
the environment, adapter contract), `tests/ui.test.tsx`, `tests/e2e/games/when-and-where.spec.ts`.
