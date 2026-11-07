# #160 Riichi Mahjong — Game Specification

Four-player Japanese mahjong (riichi rules), an East-only game, against three computer players, with
original SVG tile art shared with #159.

## Ruleset (`riichi-east-only`)

- **Tiles and walls**: 136 tiles (three suits 1–9 and seven honours, four of each). Each hand is
  shuffled from the seed and the hand number; 14 tiles form the dead wall (four kan replacements,
  dora and ura-dora indicators), 13 go to each player and the dealer draws first.
- **Turn**: draw, then discard — or win by self-draw (tsumo), declare riichi (closed hand, ready,
  1000 points staked, at least four tiles left), a concealed kan or an added kan (each draws a
  replacement and turns a new dora indicator; the live wall gives up a tile).
- **Calls on a discard**, in priority: ron; pon or open kan; chi (only the next player). Each other
  seat decides in turn order; a ron by the first seat in order settles at once; with several rons
  the first seat in order takes it (head bump). After pon or chi the caller may not discard the
  called kind (or, after chi, the other end of the run) at once.
- **Winning**: four sets and a pair, seven pairs or thirteen orphans, with at least one yaku.
  Furiten: no ron when a wait is among your own discards, after passing a ron (until your next
  discard), or after passing a ron in riichi (for the hand). Robbing an added kan (chankan) is a ron.
- **Yaku**: riichi, double riichi, ippatsu, closed self-draw, all simples (open allowed), pinfu,
  pure double run and twice, dragon / seat-wind / round-wind triplets, last tile draw and discard,
  kan replacement win, robbing a kan, seven pairs, mixed triple run, triple triplets, pure straight,
  all triplets, three concealed triplets, three kans, outside hand, terminals in every set, little
  three dragons, all terminals and honours, half flush, full flush (with the usual open-hand
  reductions); yakuman: thirteen orphans, four concealed triplets, big three dragons, little and
  big four winds, four kans, all honours, all terminals, all green, nine gates, heavenly and
  earthly hands. Dora and ura-dora (riichi only) add han but are not yaku.
- **Fu and points**: 20 base, +10 closed ron, +2 tsumo (not pinfu), triplets and kans by kind and
  concealment, yakuhai pairs, closed/edge/single waits; rounded up to 10, open hands at least 30;
  seven pairs 25; pinfu tsumo 20. Basic points fu × 2^(han+2), capped at mangan (5 han or 2000),
  haneman, baiman, sanbaiman, counted yakuman (13 han) and yakuman multiples. Ron pays 4× basic
  (6× to a dealer), tsumo 1×/2× from each; rounded up to 100. Honba add 300 a win; riichi sticks go
  to the winner.
- **Draw**: when the wall runs out, ready players share 3000 from those who are not.
- **Game**: from 25 000 each. The dealer keeps the deal on a win or when ready at a draw (honba +1;
  honba also +1 on any draw); otherwise the deal passes on. The game ends when the fourth dealer
  passes the deal or a score drops below zero; leftover sticks go to the leader.

**Simplifications, stated honestly**: no red fives; no abortive draws (nine terminals, four winds,
four riichi, four kans by different players); no kans after riichi; the riichi stake is paid on
declaration (even if that discard deals in); simultaneous rons go to one player (head bump); no
South round, no uma or oka; nagashi mangan is not scored.

## Computer players

They decide from their seat's observation: own tiles, all discards and melds, dora indicators and
riichi declarations.

- `efficient`: discards to the lowest shanten (computed per suit with memoized splits), breaking
  ties by ukeire — unseen tiles that would improve the hand — then keeping dora and shedding
  isolated honours and terminals; declares riichi when ready and closed; takes every win; calls pon
  on value tiles, and once open calls pon or chi that bring it closer to ready.
- `careful`: the same, but once another player is in riichi and its own hand is not ready, it
  discards its safest tile: that player's own discards, then suji partners of them, honours already
  out, terminals (folding at 1 shanten beat folding at 2 or 3 or never in tuning).

Measured (`rm-bench`, 200 games, one careful seat rotating against three efficient seats): the
careful seat averaged 25 170 points and rank 2.50, finished first in 42, and dealt in on 136 of
1088 hands, against 178 of 1065 for an efficient seat in the same position. Exhaustive draws were
6.5% of hands and wins came with about 27 tiles left in the wall on average — bots that push this
hard win fast. These are heuristic players, not strong ones.

## States and actions

`RiichiGame` (`engine.ts`): seed, hands dealt, round, dealer, honba, sticks, scores, live and dead
walls, kans, closed tiles, melds, discards (called, riichi), turn, phase
(`discard`/`claim`/`handOver`/`over`), the drawn tile, riichi / double riichi / ippatsu / furiten
flags, the first go-around, after-kan, kuikae bans, the open claim (tile, from, kind, queue, calls),
the hand's result (yaku, han, fu, limit, point changes, ready players, the winning hand, ura-dora),
winner, history. Actions: `discard:<tile>`, `riichi:<tile>`, `tsumo`, `ankan:<kind>`,
`kakan:<kind>`, `ron`, `pon`, `kan`, `chi:<tile>,<tile>`, `pass`, `next`.

## Saves and AI interface

Saves: schema 1 `{ state, level }`, validated by replaying the history from the seed. Env
`riichi-mahjong` v`1.0.0`: kind `turn-based`, four seats, the current player is whoever decides
now, hidden information (observations hide the other hands, the walls and their draws), zero-sum
returns by final rank (1, 1/3, −1/3, −1; ties share).

## Achievements

| id       | Condition                          |
| -------- | ---------------------------------- |
| `first`  | Finish a game.                     |
| `podium` | Finish first or second.            |
| `top`    | Finish first.                      |
| `mangan` | Win a hand worth a mangan or more. |

## Graphics and audio

A green table with the round, honba, sticks, wall count and dora indicators; the three other
players' winds, scores, riichi badges, melds and discards (riichi tiles sideways, called tiles
faded); your discards, melds and hand with the drawn tile apart, the waits shown when ready; buttons
for every call and declaration; a result panel with the winning hand, the yaku and their han, fu,
the limit name and every player's point change; final standings. Synthesized sounds for discards,
calls, riichi, wins, draws, deals, hints and the end.

## Testing criteria

Shanten and waits (including nine gates and thirteen orphans), dora order, scoring (pinfu ron 1000,
kanchan tsumo payments, no yaku, seven pairs 25 fu, a dealer mangan 12 000, full flush + straight +
pinfu as baiman, thirteen orphans, big three dragons, ron-completed triplets not concealed), the
deal, observations, whole games with points conserved and replays, ron and furiten, chi only from
the left, riichi locking the hand, claims decided seat by seat, the contract suite; UI: a hand
followed by hints to its end, watch mode. E2E desktop + mobile.
