# #084 Clock — Game Specification

## Ruleset (`clock-classic`)

- One deck shuffled from a deal number (`?deal=N`), dealt face down into 13 piles of four: one per
  hour (ace at one o'clock … queen at twelve) and the kings' pile in the middle.
- The first card is turned from the kings' pile. Each turned card goes face up **under the pile of
  its own hour** (kings in the middle), and the next card is turned from that same pile.
- The game ends when the **fourth king** is turned up: **won** if every other card is already face
  up, otherwise lost.
- There are no decisions: the outcome is fixed by the shuffle. The theoretical chance of a win is
  1/13; over deals 1–2000 the engine wins 152 (7.6%).
- Score: cards face up.

## Modes

Play (undo) and Watch AI. Statistics key `clock` (wins, losses, best score, streaks). The stats row
counts the kings out.

## Computer players

One agent, the "dealer" (`random`): with a single legal move at every step it simply plays the
game. It is there for Watch AI and the AI Lab; no strategy exists to measure.

## States and actions

`ClockState` = `seed`, `down[13]` (face-down cards), `up[13]` (cards placed), `current` (pile to
turn from), `hand`, `history`, `result`; validated by replay. Moves: `turn`, `place`.

## Achievements

| id          | Condition                               |
| ----------- | --------------------------------------- |
| `first-win` | Get the whole clock face up.            |
| `close`     | Finish with ten or more hours complete. |

## Controls

Tap the glowing pile to turn its top card, then tap the card (or drag it to its hour) to place it;
a card dropped on another hour is refused. Keyboard: D turn, A place, U undo, N new deal.

## Graphics and audio

The shared card art on felt: twelve piles around a dial with the kings in the middle, each pile
showing its placed cards fanned over the face-down ones, the pile to turn glowing, the card in hand
at the corner. A flick for each turn, a slap for each placement, a fanfare on a win.

## Save format and AI interface

Save slot schema 1, validated by replay. Env `clock-solitaire` v`1.0.0`: one seat, hidden
information (face-down cards are masked), move strings, return 1 for a win or the share face up.

## Testing criteria

Engine: the deal, placing under the hour and turning from it, the fourth-king ending, the 1-in-13
win rate over 1300 deals, a known winning deal, replay validation. Definition: the dial layout,
only the right hour accepts a card, the glowing pile. Contract suite. UI (turn and place by taps,
then by keys). e2e desktop + mobile.
