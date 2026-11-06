import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'gardner-minichess',
  number: 20,
  title: { en: 'Gardner Minichess', es: 'Minichess de Gardner' },
  tagline: {
    en: 'Every piece, five files, no room to hide.',
    es: 'Todas las piezas, cinco columnas, sin sitio para esconderse.',
  },
  description: {
    en: 'Chess on a 5×5 board with one of each piece and five pawns per side: no castling, no double steps, tactics from move one. Four computer levels, clocks and resignation.',
    es: 'Ajedrez en un tablero de 5×5 con una pieza de cada tipo y cinco peones por bando: sin enroque ni doble paso, táctica desde la primera jugada. Cuatro niveles de CPU, relojes y rendición.',
  },
  category: 'board',
  genre: { en: 'Chess variant', es: 'Variante de ajedrez' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 3,
  sessionMinutes: 8,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['minichess', 'gardner', '5x5 chess', 'small chess', 'miniajedrez'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Small Victory', es: 'Pequeña victoria' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Pocket Tactician', es: 'Táctico de bolsillo' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Five by Five', es: 'Cinco por cinco' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'beat-expert',
      title: { en: 'Mini Master', es: 'Minimaestro' },
      description: { en: 'Beat Expert.', es: 'Vence al nivel Experto.' },
    },
    {
      id: 'hold-expert',
      title: { en: 'Solid as a Rock', es: 'Sólido como una roca' },
      description: {
        en: 'Draw against Expert (perfect play is a draw).',
        es: 'Empata contra el Experto (el juego perfecto es tablas).',
      },
    },
    {
      id: 'quick-mate',
      title: { en: 'Pocket Mate', es: 'Mate de bolsillo' },
      description: {
        en: 'Checkmate the computer in at most 10 of your moves.',
        es: 'Da mate a la CPU en 10 jugadas tuyas o menos.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Coffee Break', es: 'Pausa del café' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
