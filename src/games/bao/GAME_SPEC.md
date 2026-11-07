# #063 Bao — Game Specification

## Ruleset (`bao-la-kujifunza`)

A simplified "learners' Bao" (Bao la Kujifunza) — the full Zanzibar Bao opening phase (seeds in
hand, the nyumba house, takasa rules) is left out on purpose so the game stays readable.

- A 4 × 8 board; each player owns the two rows on their side: a **front row** facing the opponent
  and a **back row**. All 32 pits start with **2 seeds** (64 in all). **South** (seat 0) moves first.
- A player's 16 pits form their own ring; seeds only change sides by capture. A move takes every
  seed of one of your pits holding **at least two** and sows them one per pit around your ring, in
  the direction you choose.
- When a sowing ends:
  - in an **occupied front pit** whose facing opponent pit holds seeds, those seeds are captured and
    sown into your front row from the **kichwa** (end pit) on the capture's side — the left end for
    the left half (pits 1–4), the right end for the right half (pits 5–8) — toward the center; the
    turn goes on from where that sowing ends, in its direction;
  - in any other occupied pit: pick everything up and keep sowing the same way (relay);
  - in an empty pit: the turn ends.
- **Capturing is compulsory**: when some move captures at the end of its first sowing, only those
  moves may be played.
- You **lose** when your front row is empty or you have no pit holding two seeds. A relay chain is
  cut after 400 sowings (never seen in play); after 300 plies the side with more seeds wins (equal is
  a draw).

## Modes and difficulty

vs Computer (South or North), Two Players, Watch AI. Generic alpha-beta with a transposition table;
evaluation = seed difference plus 0.8 per occupied front pit, squashed with tanh.

| Level  | Search                             |
| ------ | ---------------------------------- |
| Easy   | 1 ply; random move 25% of the time |
| Medium | 3 plies                            |
| Hard   | Iterative deepening for about 1 s  |

Measured (seats alternated, 10 games per pair): Easy vs Random 9–1, Medium vs Easy 10–0, Hard vs
Medium 10–0.

## States and actions

`BaoState` = `pits` (32: seat·16 + ring index; ring 0–7 is the front row from the owner's left to
right, 8–15 the back row from right to left, so "+" is clockwise as the owner sees it), `toMove`,
`history`, `result` {winner, reason `front` | `stuck` | `limit`}; validated by replaying the history.
Actions: `"<ring index><+|->"`, e.g. `"3+"`.

## Achievements

| id                         | Condition                               |
| -------------------------- | --------------------------------------- |
| `first-win`                | Win against the computer.               |
| `beat-medium`, `beat-hard` | Beat each level.                        |
| `harvest`                  | Win holding 48 or more of the 64 seeds. |
| `hot-seat`                 | Finish a two-player game.               |

## Controls

Tap one of your highlighted pits (gold ring), then the neighboring pit (green ring) you want to sow
toward, or press the direction button. Keyboard: arrows move the cursor, Enter chooses, Esc cancels;
`U`/`H`/`R`/`N`. The board turns so your rows are at the bottom; the status line says when a capture
is compulsory.

## Graphics and audio

A carved wooden board with a gap between the two halves, rounded pits with ivory seeds and exact
counts, the last move's pit, the hint and the keyboard cursor outlined. Sowing patter and a capture
chime when your total grows.

## Save format and AI interface

Shared match envelope (schema 1). Env `bao` v`1.0.0`; codec: ring index·2 + direction
(`actionSpaceSize` 32); tensor `[2, 16]` (the observer's ring, then the opponent's, scaled by 64).
Agents `random`, `easy`, `medium`, `hard`.

## Testing criteria

Engine: compulsory capture at the start, a left-half capture sown from the left kichwa followed by a
relay, a right-half capture sown from the right, relays ending in an empty pit, front-row and stuck
losses, seed conservation and replay validation, codec. Module: strength ordering (seeded), South
first, save round trip and tamper rejection, contract suite, UI (pit then direction), e2e desktop +
mobile.
