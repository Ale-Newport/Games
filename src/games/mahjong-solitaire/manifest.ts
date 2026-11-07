import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'mahjong-solitaire',
  number: 159,
  title: { en: 'Mahjong Solitaire', es: 'Mahjong solitario' },
  tagline: {
    en: 'Match free tiles two by two until the stacked layout is clear.',
    es: 'Empareja fichas libres de dos en dos hasta despejar la mesa.',
  },
  description: {
    en: 'The tile-matching solitaire with mahjong tiles: remove pairs of free tiles — nothing on top, an open side — from original stepped layouts of 84 and 144 tiles. Every deal is built so it can be cleared, shuffles redeal solvably, and you can undo or ask the strategist for a pair.',
    es: 'El solitario de emparejar fichas de mahjong: retira parejas de fichas libres —sin nada encima y con un lado abierto— de disposiciones escalonadas originales de 84 y 144 fichas. Cada reparto se construye para que tenga solución, al barajar se reparte también con solución y puedes deshacer o pedir una pareja al estratega.',
  },
  category: 'dice',
  genre: { en: 'Tile matching', es: 'Emparejar fichas' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 1,
  sessionMinutes: 10,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Time', es: 'Tiempo' }, lowerIsBetter: true },
  tags: ['tiles', 'solitaire', 'puzzle', 'matching'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Clear Table', es: 'Mesa despejada' },
      description: { en: 'Clear a layout.', es: 'Despeja una disposición.' },
    },
    {
      id: 'pyramid',
      title: { en: 'Pyramid Builder', es: 'Constructor de pirámides' },
      description: { en: 'Clear the 144-tile pyramid.', es: 'Despeja la pirámide de 144 fichas.' },
    },
    {
      id: 'pure',
      title: { en: 'No Second Chances', es: 'Sin segundas oportunidades' },
      description: {
        en: 'Clear a layout without undoing or shuffling.',
        es: 'Despeja sin deshacer ni barajar.',
      },
    },
    {
      id: 'unaided',
      title: { en: 'Sharp Eyes', es: 'Ojo de lince' },
      description: { en: 'Clear a layout without hints.', es: 'Despeja sin pistas.' },
    },
  ],
};
