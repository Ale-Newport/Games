import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'falling-blocks',
  number: 174,
  title: { en: 'Falling Blocks', es: 'Bloques que caen' },
  tagline: {
    en: 'The modern falling-block puzzle: hold, ghost piece, wall kicks and T-spins.',
    es: 'El puzle moderno de bloques que caen: reserva, pieza fantasma, patadas y giros en T.',
  },
  description: {
    en: 'A falling-block puzzle following the modern conventions: a 7-piece bag, five pieces of preview, hold, hard and soft drop, a ghost piece, rotation with wall kicks, a half-second lock delay, T-spins, combos and back-to-back bonuses. Play the 150-line marathon or the 40-line sprint.',
    es: 'Un puzle de bloques que caen con las convenciones modernas: bolsa de 7 piezas, cinco de vista previa, reserva, caída rápida y suave, pieza fantasma, rotación con patadas, medio segundo antes de fijar, giros en T, combos y bonificaciones seguidas. Juega el maratón de 150 líneas o el sprint de 40.',
  },
  category: 'arcade',
  genre: { en: 'Puzzle arcade', es: 'Arcade de puzle' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 10,
  inputs: ['keyboard', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Score', es: 'Puntos' } },
  tags: ['arcade', 'real-time', 'puzzle', 'blocks'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Line!', es: '¡Línea!' },
      description: { en: 'Clear a line.', es: 'Completa una línea.' },
    },
    {
      id: 'four',
      title: { en: 'Four at Once', es: 'Cuatro de golpe' },
      description: {
        en: 'Clear four lines with one piece.',
        es: 'Completa cuatro líneas con una pieza.',
      },
    },
    {
      id: 'tspin',
      title: { en: 'T-Spin', es: 'Giro en T' },
      description: { en: 'Score a T-spin.', es: 'Consigue un giro en T.' },
    },
    {
      id: 'goal',
      title: { en: 'Finish Line', es: 'Meta' },
      description: {
        en: 'Complete a marathon or a sprint.',
        es: 'Completa un maratón o un sprint.',
      },
    },
  ],
};
