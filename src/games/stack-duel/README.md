# #219 Stack Duel

Competitive falling blocks in the style of the popular online stacker (generic name, original
look): a versus mode against bots with garbage, a 40-line sprint and a two-minute blitz. Built on
the shared falling-block core `../shared/blocks/` and the shared arcade shell.

| File            | Role                                                                    |
| --------------- | ----------------------------------------------------------------------- |
| `duel.ts`       | Pure duel rules: attack table, cancelling, garbage queue, rounds, modes |
| `bot.ts`        | The bot: placement search, attack and survival evaluations, pacing      |
| `definition.ts` | Arcade definition: two wells, meters, callouts, controls, sounds, text  |
| `ai-adapter.ts` | Environment (your well; the bot is part of the environment)             |

## Specification

### Ruleset (`stack-duel-versus`)

The shared modern rules (10 × 20 well with two hidden rows, 7-bag, five-piece preview, hold, ghost,
standard wall kicks, 0.5 s lock delay with 15 resets, T-spins by the three-corner rule, combos,
back-to-back), plus a half-turn rotation with the common "SRS+" 180° kick table (added to the
shared core; only this game offers it).

**Versus.** Both players get the same piece sequence each round. Gravity stays at level 1.

- Attack: single 0, double 1, triple 2, quad 4; T-spin single 2, double 4, triple 6; back-to-back
  +1; combo bonus by combo count 0,0,1,1,1,2,2,3,3,4,4,4,5 (then 5); all clear +10.
- Margin time: from 90 s into a round, attacks are multiplied by 1.1, then +0.1 every 30 s
  (rounded down).
- An attack first cancels the clearer's own waiting garbage; the rest travels 20 steps (1/3 s)
  and then waits in the opponent's queue.
- When a player locks a piece without clearing, waiting garbage that has arrived enters from the
  bottom: up to 8 rows, each attack's rows sharing one random hole column. Blocks pushed above the
  top end the round, as does a spawn that does not fit or a piece locked fully above the well.
- Matches: one round, or first to two round wins; 2.5 s between rounds.

**Blitz.** Two minutes; level starts at 1 and rises every 10 lines (shared gravity and scoring);
all clears add 800/1200/1800/2000 × level. Topping out ends the run with the score kept.

**40 Lines.** Clear 40 lines; the time is recorded.

Simplifications stated honestly: T-spin minis are scored as full T-spins (shared core); the margin
time schedule and the combo table follow common competitive conventions rather than any one game's
exact numbers; no online opponents (static site).

### Bot levels

| Level  | Wait per piece | Slip (2nd/3rd choice) | Hold | Measured PPS / APM vs same level |
| ------ | -------------- | --------------------- | ---- | -------------------------------- |
| easy   | 50 steps       | 15 %                  | no   | ≈ 0.9 / 8                        |
| medium | 26 steps       | 6 %                   | yes  | ≈ 1.5 / 22                       |
| hard   | 12 steps       | 2 %                   | yes  | ≈ 2.3 / 30–40                    |
| expert | 4 steps        | 0                     | yes  | ≈ 3.5 / 40–60                    |

The bot tries every rotation and column reachable by rotating at spawn height and sliding, for its
piece and (with hold) the held or next piece. While its stack is below 11 rows it scores boards for
attack (rewarding doubles to quads and all clears, penalising singles, holes, bumpiness and height,
and allowing one deep well); higher up it switches to the El-Tetris survival weights. Slips happen
only while the stack is low. Keys alternate with releases, so moves take two steps each.

### States and actions

`Duel`: mode, bot level, target wins, both `Blocks` wells, both garbage queues, seeded generator,
round and match steps, wins, round, pause, bot wait/slip, lines sent, pieces placed, the latest
callout per side, achievement counters, blitz all-clear bonus, the end, events. Actions are the
shared packed keys (`L`/`R`, `C`/`A`/`F`, `S`/`H`, `K`, 72 strings and `idle`).

### Scoring and saves

Versus records win/loss with lines sent as the score (mode `versus-<bot>`); blitz records points;
sprint records the time. Runs are saved on leaving and validated on load (`sd` slot).

### Controls

←/→ move (auto-repeat), ↓ soft drop, Space hard drop, ↑ clockwise, Z anticlockwise, X/Shift half
turn, C hold, P pause, R restart; on-screen buttons on phones.

### Graphics and audio

Two wells side by side with hold boxes, five-piece queues, garbage meters (orange travelling, red
ready), APM/PPS and waiting-garbage readouts, clear callouts (quad, T-spin, back-to-back, combo,
all clear, lines sent), K.O. banners and round stars; grey garbage cells. Synthesized sounds for
moves, rotations, drops, locks, holds, clears, quads, T-spins, attacks, incoming garbage,
cancelling, all clears, K.O.s, rounds and endings. All canvas words are localized.

### Achievements

win, hard, expert, quad, tspin, combo (5), all-clear, sprint (≤ 90 s), blitz (30,000 points).

### Tests

`tests/duel.test.ts` (attack table, margin time, sending and cancelling, garbage entry and cap,
garbage top-out, half turn, rounds and match end, blitz length, sprint finish, expert vs easy,
key mapping, adapter contract), `tests/ui.test.tsx`, `tests/e2e/games/stack-duel.spec.ts`.
