# #119 Bulls and Cows — Game Specification

## Ruleset (`bulls-and-cows-distinct`)

A secret number of 3, 4 or 5 different digits (0–9, a leading zero allowed); guesses also use
different digits. Each guess scores bulls (right digit, right place) and cows (right digit, wrong
place). 15 guesses.

- **Solo**: crack the computer's number (drawn from the seed).
- **Duel**: the player picks a number (or a random one) and so does the computer. Turns alternate,
  the player first; each side cracks the other's number. When the player cracks it, the computer
  gets one last guess: cracking too is a draw. If the computer cracks first, it wins; if both reach
  15 guesses, it is a draw.

| Digits | Numbers |
| ------ | ------- |
| 3      | 720     |
| 4      | 5 040   |
| 5      | 30 240  |

## Modes

Crack the number (`?deal=` fixes it), today's number (per size), duel against an easy, medium or
hard computer, watch the AI crack a number with a running count of the numbers that still fit;
solo and duel games resume.

## Play features

On-screen keypad (digits already typed are disabled) and keyboard; notes per digit (ruled out / in
the number / none), mirrored on the keypad; a warning when a full guess contradicts an earlier score
(which guess, and what it would have scored). Solo only: hints that count the numbers still
possible and suggest the breaker's guess with its average remaining count (hints are counted).

## Computer players

| Agent / duel level    | Play                                                                                                                                            |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `random`              | Any number.                                                                                                                                     |
| `forgetful` (easy)    | A number fitting only its last three scores (not yet tried).                                                                                    |
| `consistent` (medium) | A random number fitting every score.                                                                                                            |
| `minimax` (hard)      | The guess with the smallest expected number of remaining codes (then the smallest worst case), from the shared chooser with symmetry reduction. |

Solo, 200 numbers per size (100 for 5-digit hard), average / worst guesses:

| Size | Easy                | Medium   | Hard     | Hard, time per guess |
| ---- | ------------------- | -------- | -------- | -------------------- |
| 3    | 6.46 / 13           | 5.34 / 8 | 4.99 / 6 | 0.2 ms               |
| 4    | 7.14 / 15 (4 lost)  | 5.33 / 7 | 5.21 / 7 | 3.7 ms               |
| 5    | 8.38 / 15 (17 lost) | 6.03 / 9 | 5.69 / 8 | 59 ms                |

The 4-digit hard breaker's 5.21 average is close to the best possible (about 5.21). Ranking by the
worst case first (Knuth's rule, as in Code Breaker) gave 5.34 here, so this game ranks by the
expected size.

Duels on 4 digits, 200 games per pairing (first move alternating), wins–losses–draws for the first
named: hard vs easy 142–37–21, hard vs medium 87–66–47, medium vs easy 117–48–35.

## States and actions

`BullsState`: variant, seed, mode, secrets (`secrets[p]` is what seat p must crack), whether the
player chose their number, guesses per seat, turn, status, winner, hints, notes, elapsed time. The
environment is the duel: two seats, hidden information (a seat sees its own number, never the one
it must crack until the end), zero-sum; actions are numbers as digits (`0123`). Save validation
regenerates the computer's numbers from the seed and replays every guess in turn order.

## Achievements

| id          | Condition                                        |
| ----------- | ------------------------------------------------ |
| `first`     | Crack a number.                                  |
| `quick`     | Crack a 4-digit number in five guesses or fewer. |
| `five`      | Crack a 5-digit number.                          |
| `duel-win`  | Win a duel against the computer.                 |
| `duel-hard` | Win a duel against the hard computer.            |

## Graphics and audio

Monospaced digits, bull chips filled with the accent color and cow chips outlined (letters B/C, or
T/V in Spanish, so color is never the only cue), notes struck through or outlined in green.
Synthesized key clicks, scoring ticks, a miss buzz and win/lose phrases.

## Save format and AI interface

Save slot schema 1: `{ state, level }`. Env `bulls-and-cows` v`1.0.0`: kind `turn-based`, two
seats, hidden information, zero-sum, config `{ variant }`; returns ±1 for the winner, 0 for a draw;
scores are each seat's guess count.

## Testing criteria

Space sizes, distinct digits, bulls/cows scoring, illegal repeated digits, solo end by crack or 15
guesses, the duel's last-guess rule (draw, win, computer first), save validation (swapped numbers,
wrong turn, tampered score, bad notes, player-set solo), hard breaker within 7 guesses, legal moves
for every level, hidden observations per seat, the contract suite; UI: typing, disabled digits,
notes on the keypad, contradiction warning, crack by hints with the result recorded, and a duel
where the player cracks the number and the computer takes its last guess. E2E desktop + mobile.
