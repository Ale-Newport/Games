/**
 * Game families: variants of the same game that the library shows together (every Tic-Tac-Toe
 * variant in one group, every chess variant in another…). A game belongs to at most one family;
 * games without a family are shown on their own. Keep this module dependency-free.
 */

export interface GameFamily {
  id: string;
  name: { en: string; es: string };
  /** Member game ids, in the order they are listed inside the group. */
  members: readonly string[];
}

export const FAMILIES: readonly GameFamily[] = [
  {
    id: 'tic-tac-toe',
    name: { en: 'Tic-Tac-Toe', es: 'Tres en raya' },
    members: ['tic-tac-toe', 'tic-tac-toe-4x4', 'ultimate-tic-tac-toe', 'misere-tic-tac-toe'],
  },
  {
    id: 'connect',
    name: { en: 'Four in a Row', es: 'Cuatro en línea' },
    members: ['four-in-a-row', 'connect-five-gravity'],
  },
  {
    id: 'five-in-a-row',
    name: { en: 'Five in a Row', es: 'Cinco en línea' },
    members: ['gomoku', 'renju', 'pente'],
  },
  {
    id: 'reversi',
    name: { en: 'Reversi', es: 'Reversi' },
    members: ['reversi-8x8', 'reversi-6x6'],
  },
  {
    id: 'draughts',
    name: { en: 'Checkers & Draughts', es: 'Damas' },
    members: ['english-checkers', 'international-draughts', 'spanish-checkers'],
  },
  {
    id: 'chess',
    name: { en: 'Chess', es: 'Ajedrez' },
    members: [
      'chess',
      'chess960',
      'antichess',
      'king-of-the-hill',
      'three-check-chess',
      'gardner-minichess',
    ],
  },
  {
    id: 'shogi',
    name: { en: 'Shogi', es: 'Shogi' },
    members: ['shogi', 'dobutsu-shogi'],
  },
  {
    id: 'xiangqi',
    name: { en: 'Xiangqi & Janggi', es: 'Xiangqi y Janggi' },
    members: ['xiangqi', 'janggi'],
  },
  {
    id: 'go',
    name: { en: 'Go', es: 'Go' },
    members: ['go-9x9', 'go-13x13', 'go-19x19'],
  },
  {
    id: 'hex',
    name: { en: 'Hex', es: 'Hex' },
    members: ['hex-7x7', 'hex-11x11'],
  },
  {
    id: 'morris',
    name: { en: "Men's Morris", es: 'Molino' },
    members: ['three-mens-morris', 'six-mens-morris', 'nine-mens-morris'],
  },
  {
    id: 'nim',
    name: { en: 'Nim & Take-Away Games', es: 'Nim y juegos de sustracción' },
    members: ['nim', 'misere-nim', 'wythoff', 'subtraction-game'],
  },
  {
    id: 'domino-tiling',
    name: { en: 'Domino Placement', es: 'Colocación de dominós' },
    members: ['domineering', 'cram'],
  },
  {
    id: 'clobber',
    name: { en: 'Capture-Jump Games', es: 'Juegos de salto y captura' },
    members: ['clobber', 'konane'],
  },
  {
    id: 'tafl',
    name: { en: 'Tafl', es: 'Tafl' },
    members: ['hnefatafl', 'tablut'],
  },
  {
    id: 'hunt',
    name: { en: 'Hunt Games', es: 'Juegos de caza' },
    members: ['fox-and-geese', 'bagh-chal'],
  },
  {
    id: 'mancala',
    name: { en: 'Mancala', es: 'Mancala' },
    members: ['kalah', 'oware', 'bao', 'congkak'],
  },
  {
    id: 'halma',
    name: { en: 'Halma', es: 'Halma' },
    members: ['halma', 'chinese-checkers'],
  },
  {
    id: 'klondike',
    name: { en: 'Klondike Solitaire', es: 'Solitario Klondike' },
    members: ['klondike-draw-1', 'klondike-draw-3'],
  },
  {
    id: 'spider',
    name: { en: 'Spider Solitaire', es: 'Solitario Spider' },
    members: ['spider-1-suit', 'spider-2-suits', 'spider-4-suits'],
  },
  {
    id: 'poker',
    name: { en: 'Poker', es: 'Póker' },
    members: [
      'texas-holdem',
      'five-card-draw',
      'omaha',
      'seven-card-stud',
      'kuhn-poker',
      'leduc-poker',
    ],
  },
  {
    id: 'sudoku',
    name: { en: 'Sudoku', es: 'Sudoku' },
    members: [
      'sudoku-9x9',
      'sudoku-4x4',
      'sudoku-6x6',
      'sudoku-16x16',
      'x-sudoku',
      'killer-sudoku',
      'jigsaw-sudoku',
    ],
  },
  {
    id: 'minesweeper',
    name: { en: 'Minesweeper', es: 'Buscaminas' },
    members: ['minesweeper', 'minesweeper-no-guess'],
  },
  {
    id: 'code-breaking',
    name: { en: 'Code Breaking', es: 'Descifrar códigos' },
    members: ['code-breaker', 'bulls-and-cows'],
  },
  {
    id: 'sliding',
    name: { en: 'Sliding Puzzles', es: 'Puzles deslizantes' },
    members: ['eight-puzzle', 'fifteen-puzzle', 'klotski', 'traffic-jam'],
  },
  {
    id: 'sorting',
    name: { en: 'Sort Puzzles', es: 'Puzles de ordenar' },
    members: ['water-sort', 'ball-sort'],
  },
  {
    id: 'twisty-cube',
    name: { en: 'Twisty Cubes', es: 'Cubos de giro' },
    members: ['twisty-cube-2x2', 'twisty-cube-3x3', 'twisty-cube-4x4'],
  },
  {
    id: 'merge',
    name: { en: 'Number Merging', es: 'Fusionar números' },
    members: ['game-2048', 'threes', 'fibonacci-2048'],
  },
  {
    id: 'backgammon',
    name: { en: 'Backgammon', es: 'Backgammon' },
    members: ['backgammon', 'narde'],
  },
  {
    id: 'ancient-race',
    name: { en: 'Ancient Race Games', es: 'Juegos de carreras antiguos' },
    members: ['royal-game-of-ur', 'senet'],
  },
  {
    id: 'cross-and-circle',
    name: { en: 'Ludo & Parcheesi', es: 'Ludo y parchís' },
    members: ['ludo', 'pachisi', 'parchis'],
  },
  {
    id: 'five-dice',
    name: { en: 'Five-Dice Scoring', es: 'Cinco dados' },
    members: ['five-dice', 'generala'],
  },
  {
    id: 'dominoes',
    name: { en: 'Dominoes', es: 'Dominó' },
    members: ['block-dominoes', 'draw-dominoes', 'all-fives-dominoes'],
  },
  {
    id: 'mahjong',
    name: { en: 'Mahjong', es: 'Mahjong' },
    members: ['mahjong-solitaire', 'riichi-mahjong'],
  },
  {
    id: 'rock-paper-scissors',
    name: { en: 'Rock Paper Scissors', es: 'Piedra, papel o tijera' },
    members: ['rock-paper-scissors', 'rpsls'],
  },
  {
    id: 'bricks',
    name: { en: 'Brick Breakers', es: 'Rompeladrillos' },
    members: ['breakout', 'brick-breaker'],
  },
  {
    id: 'invaders',
    name: { en: 'Fixed Shooters', es: 'Matamarcianos' },
    members: ['invaders', 'diving-swarm'],
  },
  {
    id: 'snake',
    name: { en: 'Snake', es: 'Serpiente' },
    members: ['snake', 'wraparound-snake'],
  },
  {
    id: 'falling-blocks',
    name: { en: 'Falling Blocks', es: 'Bloques que caen' },
    members: ['falling-blocks', 'falling-blocks-classic'],
  },
  {
    id: 'maze-chase',
    name: { en: 'Maze Chase', es: 'Persecución en laberinto' },
    members: ['maze-chase', 'maze-chase-advanced'],
  },
  {
    id: 'crossing',
    name: { en: 'Crossing', es: 'Cruzar la calle' },
    members: ['crossing', 'endless-crossing'],
  },
  {
    id: 'platformer',
    name: { en: 'Platformers', es: 'Plataformas' },
    members: ['platformer', 'precision-platformer'],
  },
  {
    id: 'survey',
    name: { en: 'Survey Trivia', es: 'Trivia de encuestas' },
    members: ['rare-answer-dive', 'crowd-answer-climb'],
  },
  {
    id: 'quiz',
    name: { en: 'Timed Quizzes', es: 'Tests contrarreloj' },
    members: ['quiz-arcade', 'world-quiz'],
  },
  {
    id: 'semantic',
    name: { en: 'Meaning Games', es: 'Juegos de significado' },
    members: ['word-rank', 'word-warmth'],
  },
  {
    id: 'geo-guess',
    name: { en: 'Country Guessers', es: 'Adivina el país' },
    members: ['country-shape', 'flag-reveal', 'globe-hot-cold'],
  },
  {
    id: 'drawing',
    name: { en: 'Drawing Games', es: 'Juegos de dibujo' },
    members: ['sketch-guess', 'draw-telephone'],
  },
];

const BY_GAME = new Map<string, GameFamily>();
for (const f of FAMILIES) for (const id of f.members) BY_GAME.set(id, f);

/** The family a game belongs to, if any. */
export function familyOf(gameId: string): GameFamily | undefined {
  return BY_GAME.get(gameId);
}
