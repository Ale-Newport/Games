import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'naval-battle',
  number: 164,
  title: { en: 'Naval Battle', es: 'Batalla naval' },
  tagline: {
    en: 'Hide your fleet, then trade shots to find and sink the enemy’s five ships first.',
    es: 'Esconde tu flota y cruza disparos para encontrar y hundir antes los cinco barcos enemigos.',
  },
  description: {
    en: 'The classic hidden-fleet guessing game on a 10 × 10 grid: place five ships, then alternate shots with the computer. The Hunter searches a checkerboard and closes in on hits; the Analyst fires wherever the ships still afloat fit in the most ways — and the hint shows you the same reasoning.',
    es: 'El clásico juego de adivinar flotas ocultas en una cuadrícula de 10 × 10: coloca cinco barcos y alterna disparos con el ordenador. El Cazador busca en damero y cerca los impactos; el Analista dispara donde caben de más maneras los barcos que quedan, y la pista te muestra ese mismo razonamiento.',
  },
  category: 'dice',
  genre: { en: 'Guessing game', es: 'Juego de adivinar' },
  players: { min: 1, max: 1 },
  vsComputer: true,
  complexity: 1,
  sessionMinutes: 10,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Shots spared', es: 'Disparos ahorrados' } },
  tags: ['grid', 'hidden-information', 'deduction', 'vs-ai'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Admiral', es: 'Almirante' },
      description: { en: 'Win a battle.', es: 'Gana una batalla.' },
    },
    {
      id: 'hard',
      title: { en: 'Outwitted', es: 'Más listo que el analista' },
      description: { en: 'Beat the Analyst.', es: 'Vence al Analista.' },
    },
    {
      id: 'sharp',
      title: { en: 'Sharpshooter', es: 'Tirador certero' },
      description: { en: 'Win in 50 shots or fewer.', es: 'Gana en 50 disparos o menos.' },
    },
    {
      id: 'untouched',
      title: { en: 'Fleet Intact', es: 'Flota intacta' },
      description: { en: 'Win without losing a ship.', es: 'Gana sin perder un barco.' },
    },
  ],
};
