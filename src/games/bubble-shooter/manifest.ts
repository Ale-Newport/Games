import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'bubble-shooter',
  number: 199,
  title: { en: 'Bubble Cannon', es: 'Cañón de burbujas' },
  tagline: {
    en: 'Aim, bank off the walls, pop three of a colour.',
    es: 'Apunta, rebota en las paredes y explota tres del mismo color.',
  },
  description: {
    en: 'A bubble shooter with an original name and look: coloured bubbles hang from the ceiling in a honeycomb, and your cannon fires one at a time. Bank shots off the side walls; three or more of a colour touching pop, and anything left hanging from nothing drops for double points. Every few shots without a pop, a new row pushes the honeycomb down — let it reach the line and it is over. Clear the board for a fuller level with more colours. Each colour also has its own mark. Aim with the arrows or by dragging, swap with the next bubble; watch an AI that tries every angle.',
    es: 'Un juego de disparar burbujas con nombre y aspecto originales: burbujas de colores cuelgan del techo formando un panal y tu cañón dispara una cada vez. Rebota en las paredes; tres o más del mismo color que se tocan explotan, y lo que queda colgando de nada cae y vale el doble. Cada pocos disparos sin explotar nada, una fila nueva empuja el panal hacia abajo; si llega a la línea, se acabó. Limpia el tablero para pasar a un nivel más lleno y con más colores. Cada color lleva además su propia marca. Apunta con las flechas o arrastrando y cambia por la siguiente burbuja; mira a una IA que prueba todos los ángulos.',
  },
  category: 'arcade',
  genre: { en: 'Puzzle shooter', es: 'Puzle de disparos' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 5,
  inputs: ['keyboard', 'touch', 'mouse'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Score', es: 'Puntos' } },
  tags: ['arcade', 'puzzle', 'matching', 'aiming'],
  achievements: [
    {
      id: 'pop',
      title: { en: 'Pop!', es: '¡Pop!' },
      description: { en: 'Pop a group of bubbles.', es: 'Explota un grupo de burbujas.' },
    },
    {
      id: 'drop',
      title: { en: 'Let It Fall', es: 'Que caigan' },
      description: {
        en: 'Drop bubbles by popping what holds them up.',
        es: 'Haz caer burbujas explotando lo que las sujeta.',
      },
    },
    {
      id: 'clear',
      title: { en: 'Clean Sweep', es: 'Tablero limpio' },
      description: { en: 'Clear a board.', es: 'Limpia un tablero.' },
    },
    {
      id: 'level5',
      title: { en: 'Six Colours', es: 'Seis colores' },
      description: { en: 'Reach level 5.', es: 'Llega al nivel 5.' },
    },
  ],
};
