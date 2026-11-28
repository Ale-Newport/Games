# Arcade AI Lab — Game Roadmap

<!-- GENERATED FILE: edit src/data/roadmap.ts and run `npm run roadmap`. -->

**Complete:** 239 / 264 · **In progress:** 0 · **Testing:** 0 · **Blocked:** 0 · **To do:** 25

Status values: `TODO`, `IN_PROGRESS`, `TESTING`, `COMPLETE`, `BLOCKED`. Part columns: ✔ done, ◐ partial, — not started.
A game is COMPLETE only when it meets [the definition of done](game-standards.md).

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
| 156 | Block Dominoes | `block-dominoes` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 157 | Draw Dominoes | `draw-dominoes` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 158 | All Fives Dominoes | `all-fives-dominoes` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 159 | Mahjong Solitaire | `mahjong-solitaire` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 160 | Riichi Mahjong | `riichi-mahjong` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 161 | Tile Rummy | `tile-rummy` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 162 | Rock Paper Scissors | `rock-paper-scissors` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 163 | Rock Paper Scissors Lizard Spock | `rpsls` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 164 | Battleship | `naval-battle` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 165 | Memory Pairs | `memory-pairs` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |

## Arcade, Platformers & Physics

| # | Game | ID | Status | Engine | Graphics | Content | Tests | AI | Completed | Known issues |
|---:|---|---|---|:-:|:-:|:-:|:-:|:-:|---|---|
| 166 | Pong | `pong` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 167 | Breakout | `breakout` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 168 | Enhanced Brick Breaker | `brick-breaker` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 169 | Space Invaders-Style Shooter | `invaders` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 170 | Galaxian-Style Shooter | `diving-swarm` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 171 | Asteroids | `asteroids` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 172 | Classic Snake | `snake` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 173 | Wraparound Snake | `wraparound-snake` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 174 | Guideline-Style Tetris | `falling-blocks` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 175 | NES-Style Tetris | `falling-blocks-classic` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 176 | Classic Maze-Chase Game | `maze-chase` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 177 | Advanced Maze-Chase Variant | `maze-chase-advanced` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 178 | Frogger-Style Crossing Game | `crossing` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 179 | Crossy Road-Style Endless Crossing | `endless-crossing` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 180 | Donkey Kong-Style Platform Arcade | `girder-climb` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 181 | Classic Side-Scrolling Platformer | `platformer` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 182 | Precision Platformer | `precision-platformer` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 183 | Flappy Bird-Style Game | `flappy` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 184 | Lunar Lander | `lunar-lander` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 185 | Missile Command | `missile-command` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 186 | Centipede-Style Arcade Game | `centipede` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 187 | Isometric Tile-Hopping Arcade Game | `tile-hopper` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 188 | Boulder Dash-Style Game | `boulder-dig` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 189 | Bomberman-Style Arena Game | `bomber-arena` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 190 | Light Cycles | `light-cycles` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 191 | Joust-Style Arcade Game | `joust` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 192 | Spacewar! | `spacewar` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 193 | Vertical Scrolling Shoot-'Em-Up | `vertical-shmup` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 194 | River Raid-Style Shooter | `river-raid` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 195 | Top-Down Racing Game | `top-down-racing` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 196 | Endless Runner | `endless-runner` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 197 | Vertical Jumping Platform Game | `vertical-jumper` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 198 | CartPole Balancing Game | `cartpole` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 199 | Bubble Shooter | `bubble-shooter` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |
| 200 | Lemmings-Style Puzzle Platformer | `rescue-walkers` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-07 |  |

## Viral Web, Word & Party Games

| # | Game | ID | Status | Engine | Graphics | Content | Tests | AI | Completed | Known issues |
|---:|---|---|---|:-:|:-:|:-:|:-:|:-:|---|---|
| 201 | Rare Answer Dive (Krillion-style) | `rare-answer-dive` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-17 |  |
| 202 | Crowd Answer Climb (Noillirk-style) | `crowd-answer-climb` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-17 |  |
| 203 | Category Letters (Scattergories-style) | `category-letters` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-17 |  |
| 204 | Quiz Arcade (Sporcle-style) | `quiz-arcade` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-17 |  |
| 205 | World Quiz (JetPunk-style) | `world-quiz` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-17 |  |
| 206 | Word Rank (Contexto-style) | `word-rank` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-17 |  |
| 207 | Word Warmth (Semantle-style) | `word-warmth` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-17 |  |
| 208 | Word Groups (Connections-style) | `word-groups` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-17 |  |
| 209 | Country Shape (Worldle-style) | `country-shape` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-17 |  |
| 210 | Theme Strands (Strands-style) | `theme-strands` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-17 |  |
| 211 | Flag Reveal (Flagle-style) | `flag-reveal` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-17 |  |
| 212 | Hot & Cold Globe (Globle-style) | `globe-hot-cold` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-17 |  |
| 213 | Sketch & Guess (Skribbl-style) | `sketch-guess` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-17 |  |
| 214 | Draw Telephone (Gartic Phone-style) | `draw-telephone` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-17 |  |
| 215 | Code Words (Codenames-style) | `code-words` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-17 |  |
| 216 | Caption Battle (Make It Meme-style) | `caption-battle` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-17 |  |
| 217 | Syllable Bomb (BombParty-style) | `syllable-bomb` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-17 |  |
| 218 | Disc Soccer (HaxBall-style) | `disc-soccer` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-17 |  |
| 219 | Stack Duel (TETR.IO-style) | `stack-duel` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-17 |  |
| 220 | Snake Arena (Slither.io-style) | `snake-arena` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-17 |  |
| 221 | Cell Arena (Agar.io-style) | `cell-arena` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-17 |  |
| 222 | Blocky Arena FPS (Krunker-style) | `blocky-arena-fps` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-17 |  |
| 223 | Endless Craft (Infinite Craft-style) | `endless-craft` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-17 |  |
| 224 | Password Rules (Password Game-style) | `password-rules` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-17 |  |
| 225 | Higher or Lower | `higher-lower` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-17 |  |
| 226 | Mind Reader (Akinator-style) | `mind-reader` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-17 |  |
| 227 | Doodle Recognizer (Quick, Draw!-style) | `doodle-recognizer` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-17 |  |
| 228 | Idle Bakery (Cookie Clicker-style) | `idle-bakery` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-17 |  |
| 229 | When & Where (WenWare-style) | `when-and-where` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-17 |  |
| 230 | Painted Night Ride (Starry Nightrider-style) | `painted-night-ride` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-17 |  |

## Guessing, Estimation & Daily Challenges

| # | Game | ID | Status | Engine | Graphics | Content | Tests | AI | Completed | Known issues |
|---:|---|---|---|:-:|:-:|:-:|:-:|:-:|---|---|
| 231 | Graph Forecast (Extraplot-style) | `graph-forecast` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-27 |  |
| 232 | Size Sense (Size It Up-style) | `size-sense` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-27 |  |
| 233 | Order of Magnitude (Magnitudle-style) | `order-of-magnitude` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-27 |  |
| 234 | Rough Guess (Roughly-style) | `rough-guess` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-27 |  |
| 235 | Closest Call (Bullseye-style) | `closest-call` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-28 |  |
| 236 | Plot the Point (Factual-style) | `plot-the-point` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-28 |  |
| 237 | Price Check (Asking Price-style) | `price-check` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-28 |  |
| 238 | Clue Ladder (Tenfold-style) | `clue-ladder` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-28 |  |
| 239 | Year Guess (Time Clocker-style) | `year-guess` | COMPLETE | ✔ | ✔ | ✔ | ✔ | ✔ | 2026-11-28 |  |
| 240 | One-Star Landmarks (One Star-style) | `one-star-landmarks` | TODO | — | — | — | — | — |  |  |
| 241 | Fact Match (Decoydle-style) | `fact-match` | TODO | — | — | — | — | — |  |  |
| 242 | Aerial Eye (Analyst Eye-style) | `aerial-eye` | TODO | — | — | — | — | — |  |  |
| 243 | Number Line (Spanzo-style) | `number-line` | TODO | — | — | — | — | — |  |  |
| 244 | Trend Draw (Trendle-style) | `trend-draw` | TODO | — | — | — | — | — |  |  |
| 245 | Gap Graph (Daily Graph-style) | `gap-graph` | TODO | — | — | — | — | — |  |  |
| 246 | Equation Guess (Nerdle-style) | `equation-guess` | TODO | — | — | — | — | — |  |  |

## Strategy & Modern Board Games

| # | Game | ID | Status | Engine | Graphics | Content | Tests | AI | Completed | Known issues |
|---:|---|---|---|:-:|:-:|:-:|:-:|:-:|---|---|
| 247 | Hex Isles (Catan-style) | `hex-isles` | TODO | — | — | — | — | — |  |  |
| 248 | World Conquest (Risk-style) | `world-conquest` | TODO | — | — | — | — | — |  |  |
| 249 | Land Baron (Monopoly-style) | `land-baron` | TODO | — | — | — | — | — |  |  |
| 250 | Tile Realm (Carcassonne-style) | `tile-realm` | TODO | — | — | — | — | — |  |  |
| 251 | Fading Empires (Small World-style) | `fading-empires` | TODO | — | — | — | — | — |  |  |
| 252 | Global Front (Axis & Allies-style) | `global-front` | TODO | — | — | — | — | — |  |  |
| 253 | Star Council (Twilight Imperium-style) | `star-council` | TODO | — | — | — | — | — |  |  |
| 254 | Planet Shapers (Terraforming Mars-style) | `planet-shapers` | TODO | — | — | — | — | — |  |  |
| 255 | Farmstead (Agricola-style) | `farmstead` | TODO | — | — | — | — | — |  |  |
| 256 | Iron Fields (Scythe-style) | `iron-fields` | TODO | — | — | — | — | — |  |  |
| 257 | Trade League (Concordia-style) | `trade-league` | TODO | — | — | — | — | — |  |  |
| 258 | Ages of Nations (Through the Ages-style) | `ages-of-nations` | TODO | — | — | — | — | — |  |  |
| 259 | Wonder Draft (7 Wonders-style) | `wonder-draft` | TODO | — | — | — | — | — |  |  |
| 260 | Rise of Cultures (Clash of Cultures-style) | `rise-of-cultures` | TODO | — | — | — | — | — |  |  |
| 261 | Rail Routes (Ticket to Ride-style) | `rail-routes` | TODO | — | — | — | — | — |  |  |
| 262 | Reef Dominion (Root-style) | `reef-dominion` | TODO | — | — | — | — | — |  |  |
| 263 | Guild Ascendancy (Dune: Imperium-style) | `guild-ascendancy` | TODO | — | — | — | — | — |  |  |
| 264 | Stellar Expanse (Eclipse-style) | `stellar-expanse` | TODO | — | — | — | — | — |  |  |
