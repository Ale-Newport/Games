# #021 Shogi — Game Specification

## Ruleset (`jsa-standard`)

Standard shogi (Japanese chess) as played under the Japan Shogi Association rules:

- 9×9 board; files 9–1 from left to right and ranks a–i from top to bottom as seen by **Sente**
  (Black, seat 0, bottom, moves first). **Gote** (White, seat 1) starts at the top.
- Pieces: king (玉/王), rook (飛), bishop (角), gold (金), silver (銀), knight (桂), lance (香), pawn
  (歩) with their standard moves.
- **Promotion zone**: the three far ranks. A move that starts or ends in the zone may promote: rook
  → dragon (龍), bishop → horse (馬), silver/knight/lance/pawn → gold movers (全/圭/杏/と). King and
  gold never promote. Promotion is **compulsory** for a pawn or lance reaching the last rank and a
  knight reaching the last two ranks.
- **Drops**: captured pieces join the captor's hand unpromoted; a turn may be spent dropping one on
  any empty square, unpromoted. Forbidden: drops where the piece could never move (pawn/lance on
  the last rank, knight on the last two), a second unpromoted own pawn on a file (**nifu**), and a
  pawn drop that gives immediate checkmate (**uchifuzume**). Other drops may mate.
- A move may never leave the own king in check. **Checkmate wins**; a player with no legal move
  also loses.
- **Repetition (sennichite)**: the same position — board, both hands and the side to move — for the
  fourth time is a draw, **unless** one side gave check with every one of its moves since the first
  occurrence; that side loses (perpetual check).
- Optional clocks (5+5, 10+10, 20+10; increment-based instead of byōyomi), resignation and agreed
  draws (two players). A flag fall loses.

Not implemented (documented): impasse adjudication by points (_jishōgi_ 24/27-point rules) — a
512-ply limit draws instead; handicap games; byōyomi clocks.

## States and actions

Shared engine `src/games/shared/shogi/` (variant `SHOGI`). A mutable `ShogiPosition` (signed kind
codes, hands, Zobrist keys, oriented move vectors and reverse attack tables) drives both the rules
and the search; the immutable `ShogiState` stores `board`, `hands`, `toMove`, `history`
(actions), `notation`, `keys` (position keys after every ply), `checks` (per ply) and `result`.
Saves and deserialized states are validated by replaying `history` and comparing the whole state.
Actions are USI-style strings: `7g7f`, `8h2b+` (promote), `P*5e` (drop).

## Modes and difficulty

vs Computer (Sente or Gote), Two Players, Watch AI. One engine (`ShogiSearchAgent`: negamax
alpha-beta, quiescence on captures, transposition table, MVV-LVA + killers, iterative deepening;
evaluation = material on board and in hand (hand pieces +15%), advancement, king shelter):

| Level  | Search                                                |
| ------ | ----------------------------------------------------- |
| Easy   | 1 ply + captures; a random legal move 30% of the time |
| Medium | 3 plies + captures (400 ms cap)                       |
| Hard   | Iterative deepening to 5 plies (1 s cap)              |
| Expert | Iterative deepening, as deep as 1.8 s allow           |

Measured (seeded, sides alternated, `shogi-match` bench): Easy vs Random 5–0–1 (one 512-ply draw: Easy
does not always find the mate), Medium vs Easy 6–0, Hard vs Medium 4–0, Expert vs Hard 4–0 (all by
checkmate; about 120 plies per game).

## Achievements

| id                                        | Condition                                          |
| ----------------------------------------- | -------------------------------------------------- |
| `first-win`                               | Win against the computer.                          |
| `beat-medium`, `beat-hard`, `beat-expert` | Beat each level.                                   |
| `dragon`                                  | Promote a rook into a dragon against the computer. |
| `drop-mate`                               | Checkmate the computer with a drop.                |
| `hot-seat`                                | Finish a two-player game.                          |

## Controls

Tap a piece to show its moves, then a destination; tap a piece in your hand, then an empty square
to drop. When promotion is optional a dialog offers "Promote" or "Keep". Keyboard: arrows move the
cursor, Enter selects/moves, Esc cancels; hand pieces are buttons (Tab); `U` undo (untimed), `H`
hint, `R` restart, `N` next round.

## Graphics and audio

Original wedge-shaped wooden pieces drawn in SVG with kanji (red when promoted) and a small Latin
letter for learners, Gote's pieces rotated; wooden board with file numbers and rank letters, a
lighter promotion zone, last-move/selection/check/hint highlights, hands as trays with counts,
Western notation move list with ☗/☖ marks. Synthesized sounds for move, capture, drop and
promotion.

## Save format and AI interface

Shared match envelope (schema 1, optional clock/adjudication). Env `shogi` v`1.0.0`, ruleset
`jsa-standard`; action codec: board moves `(from·81 + to)·2 + promote`, drops `81²·2 + kind·81 +
to` (`actionSpaceSize` 14 337); observation tensor `[56, 9, 9]` (own/opponent pieces by kind, own/
opponent hand counts as constant planes); `stateKey` = board + hands + side. Agents `random`,
`easy`, `medium`, `hard`, `expert`.

## Testing criteria

Perft from the start position = 30 / 900 / 25 470 / 719 731 (depth 1–4, the published values);
placement/hand round trips; nifu and dead drops; uchifuzume forbidden while a gold-drop mate is
allowed; compulsory vs optional promotion; pins; Western notation (captures, `+`, `=`, drops);
fourfold repetition draw and perpetual-check loss; random games end and validate; engine wins by a
drop and wins free material; strength ordering (seeded); action codec bijective; save round trip
and tamper rejection; contract suite; UI (promotion dialog, capture into hand, drop); e2e desktop +
mobile.
