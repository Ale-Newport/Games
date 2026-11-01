import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'invaders',
  number: 169,
  title: { en: 'Invaders from Above', es: 'Invasores del cielo' },
  tagline: {
    en: 'A marching formation, crumbling shields, one shot at a time.',
    es: 'Una formación que marcha, escudos que se desmoronan y un disparo cada vez.',
  },
  description: {
    en: 'A fixed shooter in the classic mould with original sprites: 55 invaders march and quicken as their ranks thin, the lowest of each column drops bombs, four shields erode from both sides, and a mystery ship crosses the top. Three cannons, an extra one at 1500, and waves that start lower each time.',
    es: 'Un matamarcianos de pantalla fija al estilo clásico con sprites originales: 55 invasores marchan y aceleran a medida que caen, el más bajo de cada columna suelta bombas, cuatro escudos se desgastan por ambos lados y una nave misteriosa cruza por arriba. Tres cañones, uno más a los 1500 puntos, y oleadas que empiezan cada vez más abajo.',
  },
  category: 'arcade',
  genre: { en: 'Shooter', es: 'Matamarcianos' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 1,
  sessionMinutes: 10,
  inputs: ['keyboard', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Score', es: 'Puntos' } },
  tags: ['arcade', 'real-time', 'shooter'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Defender', es: 'Defensor' },
      description: { en: 'Finish a game.', es: 'Termina una partida.' },
    },
    {
      id: 'wave',
      title: { en: 'Wave Cleared', es: 'Oleada despejada' },
      description: { en: 'Clear a wave.', es: 'Despeja una oleada.' },
    },
    {
      id: 'veteran',
      title: { en: 'Veteran', es: 'Veterano' },
      description: { en: 'Reach wave 4.', es: 'Llega a la oleada 4.' },
    },
    {
      id: 'score',
      title: { en: 'High Score', es: 'Gran puntuación' },
      description: { en: 'Score 3000 points.', es: 'Consigue 3000 puntos.' },
    },
  ],
};
