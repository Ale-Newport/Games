import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'girder-climb',
  number: 180,
  title: { en: 'Girder Climb', es: 'Escalada de vigas' },
  tagline: {
    en: 'Jump the rolling drums and climb the girders to rescue the kitten.',
    es: 'Salta los bidones que ruedan y sube por las vigas para rescatar al gatito.',
  },
  description: {
    en: 'A single-screen climbing arcade game with an original cast: a runaway robot rolls drums down six sloping girders while you climb ladders (not the broken ones) to reach the kitten at the top. Jump drums for points, grab a hammer to smash them, and beat the bonus clock. Arrow keys and Space to jump, or the touch pad; watch an AI climber.',
    es: 'Un arcade de escalada en una sola pantalla con personajes originales: un robot descontrolado hace rodar bidones por seis vigas inclinadas mientras subes por las escaleras (no por las rotas) hasta el gatito de arriba. Salta bidones para sumar puntos, coge un martillo para aplastarlos y gana al reloj del bonus. Flechas y Espacio para saltar, o el panel táctil; mira a un escalador de la IA.',
  },
  category: 'arcade',
  genre: { en: 'Arcade', es: 'Arcade' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 5,
  inputs: ['keyboard', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Score', es: 'Puntos' } },
  tags: ['arcade', 'real-time', 'platform', 'climbing'],
  achievements: [
    {
      id: 'hop',
      title: { en: 'Hop Over', es: 'Por encima' },
      description: { en: 'Jump over a drum.', es: 'Salta por encima de un bidón.' },
    },
    {
      id: 'smash',
      title: { en: 'Hammer Time', es: 'Martillazo' },
      description: { en: 'Smash a drum with a hammer.', es: 'Aplasta un bidón con un martillo.' },
    },
    {
      id: 'rescue',
      title: { en: 'Kitten Rescued', es: 'Gatito a salvo' },
      description: { en: 'Reach the kitten at the top.', es: 'Llega hasta el gatito de arriba.' },
    },
    {
      id: 'score',
      title: { en: 'High Scorer', es: 'Gran puntuación' },
      description: { en: 'Score 20 000 points.', es: 'Consigue 20 000 puntos.' },
    },
  ],
};
