import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'hitori',
  number: 111,
  title: { en: 'Hitori', es: 'Hitori' },
  tagline: {
    en: 'Shade the repeats, keep the rest connected: generated grids from 5×5 to 10×10 with hints that teach.',
    es: 'Sombrea las repeticiones y mantén el resto unido: cuadrículas generadas de 5×5 a 10×10 con pistas que enseñan.',
  },
  description: {
    en: 'Shade cells so no number repeats in a row or column, shaded cells never touch, and the white cells stay connected. Grids are generated with exactly one solution, checked to be solvable with the classic patterns, and the hints name them. Undo, a daily puzzle, and an AI that solves while you watch.',
    es: 'Sombrea casillas para que ningún número se repita en fila ni columna, las sombreadas no se toquen y las blancas sigan unidas. Las cuadrículas se generan con una única solución, se comprueba que se resuelven con los patrones clásicos y las pistas los nombran. Deshacer, puzle del día y una IA que resuelve mientras miras.',
  },
  category: 'puzzle',
  genre: { en: 'Logic puzzle (shading)', es: 'Puzle de lógica (sombreado)' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 8,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Time', es: 'Tiempo' }, lowerIsBetter: true },
  tags: ['hitori', 'shading', 'logic', 'daily'],
  achievements: [
    {
      id: 'first',
      title: { en: 'In the Shade', es: 'A la sombra' },
      description: { en: 'Solve a hitori.', es: 'Resuelve un hitori.' },
    },
    {
      id: 'clean',
      title: { en: 'Clean Sheet', es: 'Hoja limpia' },
      description: {
        en: 'Solve without a mistake or a hint.',
        es: 'Resuelve sin errores ni pistas.',
      },
    },
    {
      id: 'speed',
      title: { en: 'Quick Pencil', es: 'Lápiz rápido' },
      description: {
        en: 'Solve an 8×8 hitori in under 5 minutes without hints.',
        es: 'Resuelve un hitori de 8×8 en menos de 5 minutos sin pistas.',
      },
    },
    {
      id: 'hardest',
      title: { en: 'Alone at Last', es: 'Por fin solo' },
      description: { en: 'Solve a 10×10 hitori.', es: 'Resuelve un hitori de 10×10.' },
    },
    {
      id: 'daily',
      title: { en: 'Daily Habit', es: 'Hábito diario' },
      description: { en: "Solve today's puzzle.", es: 'Resuelve el puzle del día.' },
    },
  ],
};
