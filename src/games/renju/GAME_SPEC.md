# #008 Renju — Game Specification

## Ruleset (`renju-rif-15x15`)

Renju per the Renju International Federation (RIF) rules for play:

- 15×15 board, intersections. **Black** (seat 0) always moves first; **White** second.
- Black's first stone must be on the center point H8 (RIF).
- **Black wins only with exactly five** in a row. **White wins with five or more** (overlines win
  for White).
- **Forbidden points for Black** (illegal to play):
  - _overline_: the move makes six or more black stones in a row;
  - _double four (4-4)_: the move makes two or more fours — a four is a line where one more black
    stone makes exactly five; two fours in the same line (e.g. `X.XXX.X` after the middle stone)
    count as two, a straight four `.XXXX.` counts as one;
  - _double three (3-3)_: the move makes two or more threes — a three is a line that one more black
    stone turns into a straight four, where that stone is itself not forbidden and both ends of the
    straight four make exactly five (so a "three" that could only extend into an overline is fake).
  - A move that makes an exact five is never forbidden (the five wins).
- White has no restrictions. A full board without a winner is a draw.
- In every round Black moves first; players choose their color (no alternation of the first move).

**Documented simplification:** the RIF tournament _opening protocol_ (tentative Black places three
stones, White may swap, Black offers two fifth moves) is not implemented. Only the first-stone
center rule is enforced. In real RIF play a forbidden move loses immediately; here forbidden points
are simply not playable (and are marked), which is how most Renju software presents the rule.

## States and actions

m,n,k engine state (`board[225]`, `toMove`, `history`, `result`) with Renju legality in `rules.ts`.
Action: point 0–224; legal iff empty, the opening point on move 1, and not forbidden for Black.

## Modes and difficulty

vs Computer (Black or White), Two Players, Watch AI. Four levels on the shared five-in-a-row agent
with a board-level forbidden check applied at every node for Black (it never plays or plans a
forbidden point): Easy (greedy + randomness), Medium (greedy), Hard (4 plies over 8 candidates),
Expert (iterative deepening to 6 plies over 6 candidates, 900 ms).

## Achievements

`first-win`, `beat-medium`, `beat-hard`, `beat-expert`, `win-as-white`, `hot-seat`.

## Controls, graphics, audio

Shared `GoBoard` (mouse, touch preview + confirm, arrows/Enter, `U`/`H`/`R`/`N`). Forbidden points
are marked with a red ✕ whenever Black is to move. Shared stone sounds.

## Save format and AI interface

Shared two-player match envelope; the round is validated by replaying it with Renju legality.
Env `renju` v`1.0.0`, ruleset `renju-rif-15x15`, action = point (`actionSpaceSize` 225), tensor
`[3, 15, 15]`; agents `random`, `easy`, `medium`, `hard`, `expert`.

## Testing criteria

Hand-verified forbidden patterns (3-3, blocked three, 4-4 across lines and in one line, straight
four, 4-3 allowed, fake three via overline, overline, exact five overriding forbidden shapes);
opening rule; Black exact five vs White overline; forbidden points rejected by the engine and never
chosen by any agent over many seeded games; contract suite; UI; e2e.
