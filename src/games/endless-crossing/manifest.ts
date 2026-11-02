import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'endless-crossing',
  number: 179,
  title: { en: 'Endless Crossing', es: 'Cruce sin fin' },
  tagline: {
    en: 'How far can the hedgehog hop through lanes that never end?',
    es: '¿Hasta dónde llegará el erizo por carriles que nunca se acaban?',
  },
  description: {
    en: 'An endless crossing game: lanes are generated as you go — meadows with trees in the way, roads, rivers with logs, and railways whose fast trains are announced by a flashing signal. One life; the view creeps forward on its own, and lingering lets a hawk swoop. Your score is the furthest row. Arrow keys or the touch pad, and a planning AI to watch.',
    es: 'Un juego de cruzar sin fin: los carriles se generan a medida que avanzas: prados con árboles en medio, carreteras, ríos con troncos y vías cuyos trenes rápidos anuncia una señal que parpadea. Una vida; la vista avanza sola, y si te entretienes baja un halcón. Tu puntuación es la fila más lejana. Flechas o panel táctil, y una IA que planifica para mirar.',
  },
  category: 'arcade',
  genre: { en: 'Arcade', es: 'Arcade' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 1,
  sessionMinutes: 5,
  inputs: ['keyboard', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Rows', es: 'Filas' } },
  tags: ['arcade', 'real-time', 'crossing', 'timing'],
  achievements: [
    {
      id: 'twenty',
      title: { en: 'Off You Go', es: 'En marcha' },
      description: { en: 'Reach row 20.', es: 'Llega a la fila 20.' },
    },
    {
      id: 'hundred',
      title: { en: 'Long Way', es: 'Mucho camino' },
      description: { en: 'Reach row 100.', es: 'Llega a la fila 100.' },
    },
    {
      id: 'twofifty',
      title: { en: 'Marathon Hedgehog', es: 'Erizo maratoniano' },
      description: { en: 'Reach row 250.', es: 'Llega a la fila 250.' },
    },
    {
      id: 'fivehundred',
      title: { en: 'Legendary Hop', es: 'Salto legendario' },
      description: { en: 'Reach row 500.', es: 'Llega a la fila 500.' },
    },
  ],
};
