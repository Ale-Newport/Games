import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'falling-blocks-classic',
  number: 175,
  title: { en: 'Falling Blocks Classic', es: 'Bloques que caen clásico' },
  tagline: {
    en: 'The 8-bit-era rules: one preview, no hold, the classic speed table.',
    es: 'Las reglas de la era de 8 bits: una vista previa, sin reserva, la tabla clásica de velocidad.',
  },
  description: {
    en: 'A falling-block puzzle following the late-eighties console conventions: a nearly-uniform random draw, one piece of preview, no hold, soft drop only, rotation without wall kicks, slower auto-repeat, the classic frames-per-row gravity table and 40/100/300/1200 × (level + 1) scoring. Start at level 0, 9 or 18 and play until you top out.',
    es: 'Un puzle de bloques que caen con las convenciones de las consolas de finales de los ochenta: sorteo casi uniforme, una pieza de vista previa, sin reserva, solo caída suave, rotación sin patadas, autorrepetición más lenta, la tabla clásica de velocidad y puntuación 40/100/300/1200 × (nivel + 1). Empieza en el nivel 0, 9 o 18 y juega hasta llenar el pozo.',
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
      id: 'hundred',
      title: { en: 'Century', es: 'Centenario' },
      description: { en: 'Clear 100 lines.', es: 'Completa 100 líneas.' },
    },
    {
      id: 'ten',
      title: { en: 'Level 10', es: 'Nivel 10' },
      description: {
        en: 'Climb to level 10 by clearing lines.',
        es: 'Sube al nivel 10 despejando líneas.',
      },
    },
  ],
};
