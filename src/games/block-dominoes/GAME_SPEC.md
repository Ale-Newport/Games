# #156 Block Dominoes — Game Specification

The basic double-six domino game without drawing, on the shared domino core (`shared/bones`),
reused by #157 and #158.

## Ruleset (`dominoes-block-50`)

2–4 players, seven tiles each (with fewer than four players the rest stay out of play, unseen). The
highest double opens the first hand (without a double, the heaviest tile); after that the previous
hand's winner leads with any tile. A player plays a tile matching one of the line's two open ends
or passes. A hand ends when a player goes out — they score the pips in every other hand — or when
nobody can play: the lowest hand then scores the others' pips minus its own, and a tie for the
lowest scores nothing. First to 50 wins.

## Computer players (shared domino core)

Every player decides from what a seat at the table can see (`observe`): its own hand, the layout,
hand sizes, the boneyard's size, and the numbers each player is known to lack (they passed or drew
facing them).

- `random`.
- `heavy` — sheds its heaviest playable tile (in all fives, the play that scores most first).
- `planner` — determinized Monte Carlo: in 160 sampled deals of the hidden tiles that agree with
  hand sizes and known voids, it plays each legal option and finishes the hand with heavy play for
  everyone, then keeps the option with the best average of its own points minus the best
  opponent's. It does not look ahead past the current hand, and its rollouts assume heavy opponents.

## States and actions

`BonesGame` (`shared/bones/engine.ts`): rules id, seed, players, hand number, hands, boneyard (in
draw order), layout (centre tile and four arms of placed tiles with their open numbers), scores,
whose turn, consecutive passes, known voids, phase (`play`/`handOver`/`over`), the last event,
winner, the next hand's leader, history. Each hand is dealt from a shuffle fixed by the seed and
the hand number. Actions: `play:<tile>` (opening), `play:<tile>:<arm>`, `draw`, `pass`, `next`.

## Saves and AI interface

Saves: schema 1 `{ state, level }`, validated by replaying the history from the seed. Kind
`turn-based`, 2–4 seats (config `{ players }`), hidden information (observations show other hands
and the boneyard as −1 until the hand ends), deterministic transitions once the seed is fixed;
returns 1 for the game's winner.

## Graphics and audio

Drawn domino tiles (SVG pips) on green felt: the line through the centre tile with doubles
crosswise, your hand with the playable tiles lit, pulsing end markers and end buttons when a tile
fits more than one end, chips with each player's score and tile count, every hand revealed with its
pips when a hand ends; synthesized sounds for tiles, draws, passes, points, hands, hints, wins and
losses. There is no pass-the-device mode: other hands are hidden, so the table is for one human
against computer players.

## Measured

`bones-bench`, 100 games against heavy players, seats rotated: two-player, the planner won 88;
four-player (one planner, three heavy) it won 68, against an even share of 25. A two-player game
lasts about 11 hands (many hands block: 14 tiles stay out of play).

## Achievements

| id        | Condition                        |
| --------- | -------------------------------- |
| `first`   | Win a game against the computer. |
| `hard`    | Beat hard computer players.      |
| `four`    | Win a four-player game.          |
| `shutout` | Win before any opponent scores.  |

## Testing criteria

Shared core: the deal and opening, matching ends, drawing and passing, blocked hands to the lowest
hand with the difference, going out and the target, all-fives counting and scoring, observations
hiding hands, sampled deals respecting voids, replay validation, the planner beating the heavy
player. This game: the rules binding, the contract suite for 2, 3 and 4 seats; UI: hands played
with hints until a hand ends, watch mode. E2E desktop + mobile.
