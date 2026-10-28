import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'minesweeper-no-guess',
  number: 117,
  title: { en: 'No-Guess Minesweeper', es: 'Buscaminas sin adivinar' },
  tagline: {
    en: 'Every board is solvable by pure reasoning from the first click — no coin flips, ever.',
    es: 'Cada tablero se resuelve razonando desde el primer toque: nunca hay que echarlo a suertes.',
  },
  description: {
    en: 'The three standard boards, generated so that a deduction solver clears each one from your first click: when you are stuck, the numbers always hold the answer. Flags, chording, long-press, a daily board, hints that explain every step and an AI that plays while you watch.',
    es: 'Los tres tableros clásicos, generados para que un solucionador por deducción despeje cada uno desde tu primer toque: si te atascas, los números siempre tienen la respuesta. Banderas, acordes, pulsación larga, tablero del día, pistas que explican cada paso y una IA que juega mientras miras.',
  },
  category: 'puzzle',
  genre: { en: 'Deduction', es: 'Deducción' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 5,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Time', es: 'Tiempo' }, lowerIsBetter: true },
  tags: ['minesweeper', 'no guess', 'mines', 'logic', 'daily'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Pure Logic', es: 'Lógica pura' },
      description: { en: 'Clear a board.', es: 'Despeja un tablero.' },
    },
    {
      id: 'speed',
      title: { en: 'Quick Sweep', es: 'Barrido rápido' },
      description: {
        en: 'Clear Beginner in under 30 seconds.',
        es: 'Despeja Principiante en menos de 30 segundos.',
      },
    },
    {
      id: 'win-intermediate',
      title: { en: 'Steady Hands', es: 'Pulso firme' },
      description: { en: 'Clear Intermediate.', es: 'Despeja Intermedio.' },
    },
    {
      id: 'win-expert',
      title: { en: 'Sapper', es: 'Zapador' },
      description: { en: 'Clear Expert.', es: 'Despeja Experto.' },
    },
    {
      id: 'no-flags',
      title: { en: 'No Flags Needed', es: 'Sin banderas' },
      description: {
        en: 'Clear a board without placing a flag or taking a hint.',
        es: 'Despeja un tablero sin poner banderas ni pedir pistas.',
      },
    },
  ],
};
