# #118 Code Breaker — Game Specification

Generic name for the Mastermind-style deduction game; pegs, colors, layout and texts are original.

## Ruleset (`code-breaker-pegs`)

A hidden code of colored pegs; each guess is scored with solid pegs (right color, right place) and
hollow pegs (right color, wrong place), each code peg counted at most once; the score never says
which peg is which. The code is cracked when a guess scores all solid; the game is lost when the
guesses run out.

| Code    | Pegs | Colors | Repeats | Guesses | Codes  |
| ------- | ---- | ------ | ------- | ------- | ------ |
| Easy    | 4    | 6      | no      | 10      | 360    |
| Classic | 4    | 6      | yes     | 10      | 1 296  |
| Hard    | 5    | 8      | yes     | 12      | 32 768 |

In Easy, guesses also use each color once (the palette disables colors already in the row).

## Modes

- **Break a code**: the computer draws the code from the seed (`?deal=` fixes it); timer; resume.
- **Today's code**: the same code for everyone on a date, per variant.
- **Set a code for the AI**: the player composes (or randomizes) a code and the minimax breaker
  cracks it, one guess every 0.9 s, saying after each score how many codes still fit.
- **Watch the AI**: the minimax breaker on a random code.

## Play features

Tap a slot then a color (the selection moves to the next empty slot; tapping the selected slot
empties it); Clear; Check. When the row is full and contradicts an earlier score, a warning shows
which guess it contradicts and what it would have scored. Hints say how many codes still fit and
offer the minimax guess with its worst case ("Use it" fills the row; hints are counted). Keyboard:
1–8 colors, ←/→ slot, Backspace, Enter, H, N.

## Computer players (`ai.ts`, shared chooser in `shared/codeguess/engine.ts`)

The minimax chooser scores each candidate guess by the largest group of still-possible codes that
share an answer (Knuth's rule), breaking ties by the average group size and then by preferring a
guess that could itself be the code. Symbols never used in any guess are interchangeable, so only
codes introducing them in a fixed order are considered (15 openings in Classic, 52 in Hard); when
codes × guesses exceeds 2.5 million pairs the guess pool is thinned evenly, half from the possible
codes.

Measured on 200 codes per variant (seeds 1–200):

| Agent        | Easy: avg / worst | Classic: avg / worst | Hard: avg / worst | Time per guess (E / C / H) |
| ------------ | ----------------- | -------------------- | ----------------- | -------------------------- |
| `random`     | 3% cracked        | 0.5% cracked         | 0% cracked        | —                          |
| `consistent` | 4.13 / 6          | 4.55 / 7             | 5.82 / 8          | 0.01 / 0.03 / 0.9 ms       |
| `minimax`    | 4.05 / 5          | 4.51 / 5             | 5.58 / 7          | 0.15 / 0.5 / 44 ms         |

Over all 1 296 Classic codes the minimax breaker averages 4.458 guesses and never needs more than 5
(Knuth's published strategy: 4.476 / 5); over all 360 Easy codes, 4.081 / 5. There is no exact
oracle (hidden information).

## States and actions

`CodeBreakerState`: variant, seed, setter (`computer` | `player`), secret, scored guesses, status,
hints, elapsed time. Environment actions are codes written as their color indices (`0011`); the
observation hides the code (all `-1`) until the game ends. Save validation regenerates a computer
code from the seed and replays every score.

## Achievements

| id         | Condition                                                           |
| ---------- | ------------------------------------------------------------------- |
| `first`    | Crack a code.                                                       |
| `four`     | Crack a Classic code in four guesses or fewer.                      |
| `win-hard` | Crack a Hard code.                                                  |
| `sharp`    | Crack a code without hints, every guess fitting the earlier scores. |
| `stump`    | Set a code the AI needs five or more guesses to crack.              |

## Graphics and audio

Glossy CSS pegs in eight colors, each numbered (1–8) so colors are never the only cue; solid and
hollow score pegs in the text color for both themes. Synthesized peg clicks, scoring ticks, a miss
buzz, and win/lose phrases.

## Save format and AI interface

Save slot schema 1: `{ state }` (only codes set by the computer are resumed). Env `code-breaker`
v`1.0.0`: kind `puzzle`, one seat, hidden information, config `{ variant }`; return 1 when cracked,
score = guesses left + 1.

## Testing criteria

Scoring cases (repeats, each peg once), code-space sizes and fast keys equal to the score,
consistency and contradictions, symmetry-reduced openings, the minimax opening (worst case 256) and
≤ 5 guesses on every 7th Classic code, Hard codes within 8, win/loss, save validation (tampered
code, score, variant), hidden observation, the contract suite; UI: compose, check, contradiction
warning, crack by hints with the result recorded, and the AI cracking a player's code. E2E desktop +
mobile.
