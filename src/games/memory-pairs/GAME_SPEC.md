# #165 Memory Pairs — Game Specification

The concentration card game with original card faces.

## Ruleset (`memory-pairs`)

A grid of face-down cards (4 × 4, 4 × 6 or 6 × 6), every face twice, dealt from the seed. A turn
turns over two cards: a matching pair is taken and the same player goes again; otherwise both turn
back (shown for a moment) and the turn passes. Solo, the aim is to clear the grid in as few turns as
possible; against the computer, the player with more pairs wins (ties possible).

## Computer players

Every card turned over is public; the players differ in how much they remember. Each takes a pair
it remembers; otherwise it turns over a card it does not remember, then that card's twin if it
remembers it, else another unknown card.

- `random`, `forgetful` (last 6 cards seen), `attentive` (last 14), `perfect` (all).

Measured (`mp-bench`, 400 deals): solo turns to clear 4 × 4 — forgetful 16.2, attentive 13.2,
perfect 12.4; 4 × 6 — 29.3, 22.0, 18.9; 6 × 6 — 54.3, 37.4, 28.5. Head to head, perfect beat
forgetful in 349 of 400 games on 4 × 4 (27 ties) and 399 of 400 on 6 × 6, and beat attentive in 241
(4 × 4) and 389 (6 × 6). The hint uses perfect memory.

## States and actions

`MemoryGame`: size, seed, players, faces, taken cards, faces seen so far, the order of flips, the
card open this turn, the last pair shown, whose turn, pairs and turns per player, phase, history.
Actions: `flip:<i>`.

## Saves and AI interface

Saves: schema 1 `{ state, opp }`, validated by replaying the flips from the seed. Env
`memory-pairs` v`1.0.0`: kind `turn-based`, 1 or 2 seats (config `{ size, players }`), hidden
information (unseen faces hidden); returns solo 2 × pairs / turns − 1, else ±1 or 0 for a tie.

## Achievements

| id        | Condition                                    |
| --------- | -------------------------------------------- |
| `first`   | Finish a game.                               |
| `perfect` | Beat the Perfect opponent.                   |
| `sharp`   | Clear a grid solo within 1.6 turns per pair. |
| `large`   | Finish a 6 × 6 game.                         |

## Graphics and audio

Cards that flip in 3D (instantly with reduced motion), a patterned purple back, cream fronts with
nine original shapes in two colours, taken pairs faded, the hint's card ringed in gold; chips with
pairs and turns; synthesized sounds for flips, matches, misses, hints and the end.

## Testing criteria

Every face dealt twice, a pair taken and the turn kept, a miss passing the turn, hidden faces,
replay validation, a remembered pair taken at once, better memories clearing in fewer turns and
winning, the contract suite for solo and two players; UI: a solo grid cleared by hints, a game
against the computer. E2E desktop + mobile.
