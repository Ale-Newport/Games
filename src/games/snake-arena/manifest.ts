import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'snake-arena',
  number: 220,
  title: { en: 'Snake Arena', es: 'Arena de serpientes' },
  tagline: {
    en: 'Eat glowing pellets, grow huge and make the other snakes crash into you.',
    es: 'Come bolitas brillantes, hazte enorme y haz que las demás serpientes choquen contigo.',
  },
  description: {
    en: 'A giant round arena shared with 10 to 30 computer snakes. Steer with the mouse, boost by burning length, and when a snake’s head touches your body it bursts into a trail of food. Climb the live leaderboard; the bots graze, dodge and, on harder levels, hunt by cutting in front of smaller snakes.',
    es: 'Una arena redonda gigante compartida con 10 a 30 serpientes del ordenador. Dirige con el ratón, acelera quemando longitud, y cuando la cabeza de una serpiente toca tu cuerpo estalla en un rastro de comida. Sube en la clasificación en directo; los bots pastan, esquivan y, en los niveles difíciles, cazan cruzándose delante de las serpientes más pequeñas.',
  },
  category: 'viral',
  genre: { en: 'Arcade', es: 'Arcade' },
  players: { min: 1, max: 1 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 6,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Best length', es: 'Mejor longitud' } },
  tags: ['arcade', 'real-time', 'snake', 'io', 'vs-ai'],
  achievements: [
    {
      id: 'length-100',
      title: { en: 'Growing Up', es: 'Creciendo' },
      description: { en: 'Reach a length of 100.', es: 'Llega a una longitud de 100.' },
    },
    {
      id: 'length-500',
      title: { en: 'Big Noodle', es: 'Gran fideo' },
      description: { en: 'Reach a length of 500.', es: 'Llega a una longitud de 500.' },
    },
    {
      id: 'length-1000',
      title: { en: 'Arena Giant', es: 'Gigante de la arena' },
      description: { en: 'Reach a length of 1,000.', es: 'Llega a una longitud de 1000.' },
    },
    {
      id: 'kill',
      title: { en: 'Cut Off', es: 'Corte' },
      description: {
        en: 'Make a snake crash into you.',
        es: 'Haz que una serpiente choque contigo.',
      },
    },
    {
      id: 'kills-5',
      title: { en: 'Serial Coiler', es: 'Enroscadora' },
      description: { en: 'Five kills in one life.', es: 'Cinco bajas en una vida.' },
    },
    {
      id: 'top',
      title: { en: 'Number One', es: 'Número uno' },
      description: { en: 'Top the leaderboard.', es: 'Encabeza la clasificación.' },
    },
  ],
};
