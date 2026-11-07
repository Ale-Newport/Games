import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'minesweeper',
  number: 116,
  title: { en: 'Classic Minesweeper', es: 'Buscaminas clásico' },
  tagline: {
    en: 'Beginner, Intermediate and Expert boards with a safe first click, chords, flags and hints that reason.',
    es: 'Tableros de principiante, intermedio y experto con primer toque seguro, acordes, banderas y pistas que razonan.',
  },
  description: {
    en: 'The classic: open every cell without a mine, reading the numbers that count the mines around them. Mines are placed after your first click, never under it. Flags, chording, long-press on touch screens, a daily board, hints that explain the deduction (or the least risky guess), and an AI that plays while you watch.',
    es: 'El clásico: abre todas las casillas sin mina leyendo los números que cuentan las minas de alrededor. Las minas se colocan tras tu primer toque, nunca debajo. Banderas, acordes, pulsación larga en pantallas táctiles, tablero del día, pistas que explican la deducción (o la apuesta menos arriesgada) y una IA que juega mientras miras.',
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
  tags: ['minesweeper', 'mines', 'logic', 'classic', 'daily'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Cleared', es: 'Despejado' },
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
