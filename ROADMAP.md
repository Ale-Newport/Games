# Arcade AI Lab — 200-Game Roadmap

<!-- GENERATED FILE: edit src/data/roadmap.ts and run `npm run roadmap`. -->

**Complete:** 155 / 200 · **In progress:** 0 · **Testing:** 0 · **Blocked:** 0 · **To do:** 45

Status values: `TODO`, `IN_PROGRESS`, `TESTING`, `COMPLETE`, `BLOCKED`. Part columns: ✔ done, ◐ partial, — not started.
A game is COMPLETE only when it meets [docs/game-standards.md](docs/game-standards.md).

## Classic Board & Abstract Strategy

| # | Game | ID | Status | Engine | Graphics | Content | Tests | AI | Completed | Known issues |
|---:|---|---|---|:-:|:-:|:-:|:-:|:-:|---|---|
| 001 | Tic-Tac-Toe 3×3 | `tic-tac-toe` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 002 | Tic-Tac-Toe 4×4 | `tic-tac-toe-4x4` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 003 | Ultimate Tic-Tac-Toe | `ultimate-tic-tac-toe` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 004 | Misère Tic-Tac-Toe | `misere-tic-tac-toe` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 005 | Connect Four | `four-in-a-row` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 006 | Connect Five Gravity | `connect-five-gravity` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 007 | Gomoku | `gomoku` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 008 | Renju | `renju` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 009 | Pente | `pente` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 010 | Othello / Reversi 8×8 | `reversi-8x8` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 011 | Othello / Reversi 6×6 | `reversi-6x6` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 012 | English Checkers | `english-checkers` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 013 | International Draughts | `international-draughts` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 014 | Spanish Checkers | `spanish-checkers` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 015 | Chess | `chess` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 016 | Chess960 | `chess960` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 017 | Antichess | `antichess` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 018 | King of the Hill Chess | `king-of-the-hill` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 019 | Three-Check Chess | `three-check-chess` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 020 | Gardner Minichess | `gardner-minichess` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 021 | Shogi | `shogi` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 022 | Dōbutsu Shōgi | `dobutsu-shogi` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 023 | Xiangqi | `xiangqi` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 024 | Janggi | `janggi` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 025 | Go 9×9 | `go-9x9` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 026 | Go 13×13 | `go-13x13` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 027 | Go 19×19 | `go-19x19` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 028 | Hex 7×7 | `hex-7x7` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 029 | Hex 11×11 | `hex-11x11` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 030 | Nine Men's Morris | `nine-mens-morris` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 031 | Three Men's Morris | `three-mens-morris` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 032 | Six Men's Morris | `six-mens-morris` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 033 | Quarto | `quarto` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 034 | Pentago | `pentago` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 035 | Gobblet Gobblers | `stacking-gobblers` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 036 | Teeko | `teeko` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 037 | Ataxx | `ataxx` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 038 | Breakthrough | `breakthrough` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 039 | Isolation | `isolation` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 040 | Dots and Boxes | `dots-and-boxes` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |

## Mathematical, Historical & Additional Strategy

| # | Game | ID | Status | Engine | Graphics | Content | Tests | AI | Completed | Known issues |
|---:|---|---|---|:-:|:-:|:-:|:-:|:-:|---|---|
| 041 | Nim | `nim` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 042 | Misère Nim | `misere-nim` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 043 | Wythoff's Game | `wythoff` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 044 | Subtraction Game | `subtraction-game` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 045 | Chomp | `chomp` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 046 | Kayles | `kayles` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 047 | Domineering | `domineering` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 048 | Cram | `cram` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 049 | Sim | `sim` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 050 | SOS | `sos` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 051 | Sprouts | `sprouts` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 052 | Clobber | `clobber` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 053 | Konane | `konane` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 054 | Fanorona | `fanorona` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 055 | Hnefatafl | `hnefatafl` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 056 | Tablut | `tablut` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 057 | Fox and Geese | `fox-and-geese` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 058 | Bagh-Chal | `bagh-chal` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 059 | Alquerque | `alquerque` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-06 |  |
| 060 | Yoté | `yote` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 061 | Kalah Mancala | `kalah` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 062 | Oware | `oware` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 063 | Bao | `bao` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 064 | Congkak | `congkak` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 065 | Halma | `halma` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 066 | Chinese Checkers | `chinese-checkers` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 067 | Game of the Amazons | `amazons` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 068 | Lines of Action | `lines-of-action` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 069 | Paper Soccer | `paper-soccer` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 070 | Bridg-It | `bridg-it` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |

## Card & Solitaire

| # | Game | ID | Status | Engine | Graphics | Content | Tests | AI | Completed | Known issues |
|---:|---|---|---|:-:|:-:|:-:|:-:|:-:|---|---|
| 071 | Klondike Solitaire — Draw One | `klondike-draw-1` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 072 | Klondike Solitaire — Draw Three | `klondike-draw-3` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 073 | FreeCell | `freecell` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 074 | Spider Solitaire — One Suit | `spider-1-suit` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 075 | Spider Solitaire — Two Suits | `spider-2-suits` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 076 | Spider Solitaire — Four Suits | `spider-4-suits` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 077 | Pyramid Solitaire | `pyramid-solitaire` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 078 | TriPeaks Solitaire | `tripeaks` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 079 | Golf Solitaire | `golf-solitaire` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 080 | Yukon Solitaire | `yukon` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 081 | Scorpion Solitaire | `scorpion` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 082 | Forty Thieves Solitaire | `forty-thieves` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 083 | Accordion Solitaire | `accordion` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 084 | Clock Solitaire | `clock-solitaire` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 085 | Canfield Solitaire | `canfield` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 086 | Blackjack | `blackjack` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 087 | Texas Hold'em Poker | `texas-holdem` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 088 | Five Card Draw Poker | `five-card-draw` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 089 | Omaha Hold'em | `omaha` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 090 | Seven Card Stud | `seven-card-stud` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 091 | Kuhn Poker | `kuhn-poker` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 092 | Leduc Poker | `leduc-poker` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 093 | Hearts | `hearts` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 094 | Spades | `spades` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 095 | Contract Bridge | `contract-bridge` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 096 | Gin Rummy | `gin-rummy` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 097 | Cribbage | `cribbage` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 098 | Euchre | `euchre` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 099 | Crazy Eights | `crazy-eights` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 100 | Go Fish | `go-fish` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |

## Puzzles, Logic & Solving

| # | Game | ID | Status | Engine | Graphics | Content | Tests | AI | Completed | Known issues |
|---:|---|---|---|:-:|:-:|:-:|:-:|:-:|---|---|
| 101 | Classic Sudoku 9×9 | `sudoku-9x9` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 102 | Mini Sudoku 4×4 | `sudoku-4x4` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 103 | Sudoku 6×6 | `sudoku-6x6` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 104 | Sudoku 16×16 | `sudoku-16x16` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 105 | X-Sudoku | `x-sudoku` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 106 | Killer Sudoku | `killer-sudoku` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 107 | Jigsaw Sudoku | `jigsaw-sudoku` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 108 | Kakuro | `kakuro` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 109 | KenKen | `calcudoku` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 110 | Futoshiki | `futoshiki` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 111 | Hitori | `hitori` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 112 | Nonogram / Picross | `nonogram` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 113 | Slitherlink | `slitherlink` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 114 | Hashiwokakero | `hashiwokakero` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 115 | Nurikabe | `nurikabe` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 116 | Classic Minesweeper | `minesweeper` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 117 | No-Guess Minesweeper | `minesweeper-no-guess` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 118 | Mastermind | `code-breaker` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 119 | Bulls and Cows | `bulls-and-cows` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 120 | Five-Letter Word Guessing Game | `word-guess` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 121 | Hangman | `hangman` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 122 | Queens — Colored Regions Puzzle | `queens` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 123 | Zip — Numbered Hamiltonian Path Puzzle | `zip` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 124 | 8-Puzzle | `eight-puzzle` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 125 | 15-Puzzle | `fifteen-puzzle` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 126 | Rush Hour | `traffic-jam` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 127 | Sokoban | `sokoban` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 128 | Peg Solitaire | `peg-solitaire` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 129 | Lights Out | `lights-out` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 130 | Flow Path Connection Puzzle | `flow` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 131 | Water Sort Puzzle | `water-sort` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 132 | Ball Sort Puzzle | `ball-sort` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 133 | Towers of Hanoi | `towers-of-hanoi` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 134 | Rubik's Cube 2×2 | `twisty-cube-2x2` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 135 | Rubik's Cube 3×3 | `twisty-cube-3x3` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 136 | Rubik's Cube 4×4 | `twisty-cube-4x4` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 137 | 2048 | `game-2048` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 138 | Threes-Style Number-Merging Game | `threes` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 139 | Fibonacci 2048 | `fibonacci-2048` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 140 | Klotski Sliding Block Puzzle | `klotski` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |

## Dice, Dominoes, Chance & Social

| # | Game | ID | Status | Engine | Graphics | Content | Tests | AI | Completed | Known issues |
|---:|---|---|---|:-:|:-:|:-:|:-:|:-:|---|---|
| 141 | Backgammon | `backgammon` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 142 | Narde | `narde` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 143 | Royal Game of Ur | `royal-game-of-ur` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 144 | Senet | `senet` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 145 | Ludo | `ludo` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 146 | Pachisi | `pachisi` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 147 | Parchís | `parchis` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 148 | Snakes and Ladders | `snakes-and-ladders` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 149 | Yahtzee | `five-dice` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 150 | Generala | `generala` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 151 | Farkle | `farkle` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 152 | Pig Dice | `pig` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 153 | Can't Stop | `cant-stop` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 154 | Shut the Box | `shut-the-box` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 155 | Qwixx | `qwixx` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 156 | Block Dominoes | `block-dominoes` | TODO | — | — | — | — | — |  |  |
| 157 | Draw Dominoes | `draw-dominoes` | TODO | — | — | — | — | — |  |  |
| 158 | All Fives Dominoes | `all-fives-dominoes` | TODO | — | — | — | — | — |  |  |
| 159 | Mahjong Solitaire | `mahjong-solitaire` | TODO | — | — | — | — | — |  |  |
| 160 | Riichi Mahjong | `riichi-mahjong` | TODO | — | — | — | — | — |  |  |
| 161 | Tile Rummy | `tile-rummy` | TODO | — | — | — | — | — |  |  |
| 162 | Rock Paper Scissors | `rock-paper-scissors` | TODO | — | — | — | — | — |  |  |
| 163 | Rock Paper Scissors Lizard Spock | `rpsls` | TODO | — | — | — | — | — |  |  |
| 164 | Battleship | `naval-battle` | TODO | — | — | — | — | — |  |  |
| 165 | Memory Pairs | `memory-pairs` | TODO | — | — | — | — | — |  |  |

## Arcade, Platformers & Physics

| # | Game | ID | Status | Engine | Graphics | Content | Tests | AI | Completed | Known issues |
|---:|---|---|---|:-:|:-:|:-:|:-:|:-:|---|---|
| 166 | Pong | `pong` | TODO | — | — | — | — | — |  |  |
| 167 | Breakout | `breakout` | TODO | — | — | — | — | — |  |  |
| 168 | Enhanced Brick Breaker | `brick-breaker` | TODO | — | — | — | — | — |  |  |
| 169 | Space Invaders-Style Shooter | `invaders` | TODO | — | — | — | — | — |  |  |
| 170 | Galaxian-Style Shooter | `diving-swarm` | TODO | — | — | — | — | — |  |  |
| 171 | Asteroids | `asteroids` | TODO | — | — | — | — | — |  |  |
| 172 | Classic Snake | `snake` | TODO | — | — | — | — | — |  |  |
| 173 | Wraparound Snake | `wraparound-snake` | TODO | — | — | — | — | — |  |  |
| 174 | Guideline-Style Tetris | `falling-blocks` | TODO | — | — | — | — | — |  |  |
| 175 | NES-Style Tetris | `falling-blocks-classic` | TODO | — | — | — | — | — |  |  |
| 176 | Classic Maze-Chase Game | `maze-chase` | TODO | — | — | — | — | — |  |  |
| 177 | Advanced Maze-Chase Variant | `maze-chase-advanced` | TODO | — | — | — | — | — |  |  |
| 178 | Frogger-Style Crossing Game | `crossing` | TODO | — | — | — | — | — |  |  |
| 179 | Crossy Road-Style Endless Crossing | `endless-crossing` | TODO | — | — | — | — | — |  |  |
| 180 | Donkey Kong-Style Platform Arcade | `girder-climb` | TODO | — | — | — | — | — |  |  |
| 181 | Classic Side-Scrolling Platformer | `platformer` | TODO | — | — | — | — | — |  |  |
| 182 | Precision Platformer | `precision-platformer` | TODO | — | — | — | — | — |  |  |
| 183 | Flappy Bird-Style Game | `flappy` | TODO | — | — | — | — | — |  |  |
| 184 | Lunar Lander | `lunar-lander` | TODO | — | — | — | — | — |  |  |
| 185 | Missile Command | `missile-command` | TODO | — | — | — | — | — |  |  |
| 186 | Centipede-Style Arcade Game | `centipede` | TODO | — | — | — | — | — |  |  |
| 187 | Isometric Tile-Hopping Arcade Game | `tile-hopper` | TODO | — | — | — | — | — |  |  |
| 188 | Boulder Dash-Style Game | `boulder-dig` | TODO | — | — | — | — | — |  |  |
| 189 | Bomberman-Style Arena Game | `bomber-arena` | TODO | — | — | — | — | — |  |  |
| 190 | Light Cycles | `light-cycles` | TODO | — | — | — | — | — |  |  |
| 191 | Joust-Style Arcade Game | `joust` | TODO | — | — | — | — | — |  |  |
| 192 | Spacewar! | `spacewar` | TODO | — | — | — | — | — |  |  |
| 193 | Vertical Scrolling Shoot-'Em-Up | `vertical-shmup` | TODO | — | — | — | — | — |  |  |
| 194 | River Raid-Style Shooter | `river-raid` | TODO | — | — | — | — | — |  |  |
| 195 | Top-Down Racing Game | `top-down-racing` | TODO | — | — | — | — | — |  |  |
| 196 | Endless Runner | `endless-runner` | TODO | — | — | — | — | — |  |  |
| 197 | Vertical Jumping Platform Game | `vertical-jumper` | TODO | — | — | — | — | — |  |  |
| 198 | CartPole Balancing Game | `cartpole` | TODO | — | — | — | — | — |  |  |
| 199 | Bubble Shooter | `bubble-shooter` | TODO | — | — | — | — | — |  |  |
| 200 | Lemmings-Style Puzzle Platformer | `rescue-walkers` | TODO | — | — | — | — | — |  |  |
