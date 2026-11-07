# #152 Pig — Game Specification

The classic push-your-luck dice game for two, played with one die — and solved.

## Ruleset (`pig-100`)

Two players race to 100. On a turn a player rolls one die as often as they like, adding each throw
to the turn total, and may hold at any time to bank the turn total. A 1 ends the turn and loses
the turn total. The first to bank 100 wins. Who starts comes from the seed.

## Computer players

- `random` — rolls or holds at random.
- `hold20` — the rule of thumb: hold once the turn total reaches 20 (or reaches the goal).
- `optimal` — the solved game, after Neller and Presser: value iteration over (my score, the
  opponent's score, the turn total), 10⁶ states, converged to 10⁻⁹ in about 0.7 s, computed once.
  The player to move holds when banking wins at least as often as rolling. It reproduces the
  published value: with perfect play the first player wins 53.06%. From 0–0 it rolls up to a turn
  total of 20 and holds at 21; far behind it rolls on much longer; near 100 it holds anything that
  wins.

Measured (4000 games, starts alternated): `optimal` beat `hold20` in 2157 (53.9%) and a player that
holds at random about a third of the time in 88.8%. The hints show the optimal choice and the exact
chance to win from the position under perfect play.

## States and actions

`PigGame`: seed and generator state, the two scores, whose turn, the turn total, the last throw,
phase (`play`/`over`), winner, the last event (a 1 or a hold), history. Actions: `roll`, `hold`
(only with a turn total above 0).

## Saves and AI interface

Saves: schema 1 `{ state, opponent }`, validated by replaying the history from the seed. Env `pig`
v`1.0.0`: kind `turn-based`, 2 seats, deterministic transitions (dice come from the stored
generator), zero-sum returns ±1. `exactOracleId`: `optimal`.

## Achievements

| id        | Condition                              |
| --------- | -------------------------------------- |
| `first`   | Win a game against the computer.       |
| `hard`    | Beat the Perfect opponent.             |
| `shutout` | Win before the computer banks a point. |
| `greedy`  | Bank a turn of 40 or more.             |

## Graphics and audio

Two score bars racing to 100, a large die that flashes red on a 1, the turn total, hints with the
chance to win; synthesized sounds for throws, holds, a lost turn, hints, wins and losses.

## Testing criteria

Rolling, losing the turn on a 1 and holding; replay validation; the solved value 0.5306; the
optimal policy at known positions (holds at 21 from 0–0, rolls on far behind, holds a winning
total); the optimal player beating hold-at-20; the contract suite; UI: a whole game with hints
against the computer. E2E desktop + mobile.
