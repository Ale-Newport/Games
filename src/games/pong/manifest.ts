import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'pong',
  number: 166,
  title: { en: 'Pong', es: 'Pong' },
  tagline: {
    en: 'Two paddles, one ball: angle your returns past the computer.',
    es: 'Dos palas y una pelota: dale ángulo a tus devoluciones para superar al ordenador.',
  },
  description: {
    en: 'The original paddle duel against a computer opponent at three skill levels, in games to 3, 5 or 11. Edge hits angle the ball and every hit speeds it up; play with keys, touch buttons or by dragging on the field, and watch the AI play.',
    es: 'El duelo de palas original contra un rival con tres niveles, en partidas a 3, 5 u 11. Los golpes con el borde dan ángulo y cada golpe acelera la pelota; juega con teclas, botones táctiles o arrastrando sobre el campo, y mira jugar a la IA.',
  },
  category: 'arcade',
  genre: { en: 'Arcade', es: 'Arcade' },
  players: { min: 1, max: 1 },
  vsComputer: true,
  complexity: 1,
  sessionMinutes: 5,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Point margin', es: 'Diferencia de puntos' } },
  tags: ['arcade', 'real-time', 'paddle', 'vs-ai'],
  achievements: [
    {
      id: 'first',
      title: { en: 'First Point Win', es: 'Primera victoria' },
      description: { en: 'Win a game.', es: 'Gana una partida.' },
    },
    {
      id: 'hard',
      title: { en: 'Unreturnable', es: 'Imparable' },
      description: { en: 'Beat the hard computer.', es: 'Vence al ordenador difícil.' },
    },
    {
      id: 'shutout',
      title: { en: 'Shutout', es: 'Sin encajar' },
      description: { en: 'Win without conceding a point.', es: 'Gana sin encajar un punto.' },
    },
    {
      id: 'rally',
      title: { en: 'Long Rally', es: 'Peloteo largo' },
      description: { en: 'Keep a rally going for 20 hits.', es: 'Mantén un peloteo de 20 golpes.' },
    },
  ],
};
