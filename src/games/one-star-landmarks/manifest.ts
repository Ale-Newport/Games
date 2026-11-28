import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'one-star-landmarks',
  number: 240,
  title: { en: 'One-Star Landmarks', es: 'Lugares de una estrella' },
  tagline: {
    en: 'The world’s great sights, reviewed by its grumpiest tourists. Name the place.',
    es: 'Las grandes maravillas del mundo, reseñadas por sus turistas más gruñones. Adivina el lugar.',
  },
  description: {
    en: 'A geography guessing game built on 137 famous places and a one-star review of each, written for this game. Read the first grumble and name the place; every wrong guess shows how far away and in which direction the answer lies, plots it on a map and reveals another line of the review. Five guesses, fewer points for each. Daily five places from around the world and endless runs by region and difficulty.',
    es: 'Un juego de adivinar lugares con 137 sitios famosos y una reseña de una estrella de cada uno, escrita para este juego. Lee la primera queja y nombra el lugar; cada fallo te dice a qué distancia y en qué dirección está la respuesta, lo marca en un mapa y desvela otra línea de la reseña. Cinco intentos, menos puntos en cada uno. Cinco lugares diarios de todo el mundo y partidas sin fin por región y dificultad.',
  },
  category: 'estimation',
  genre: { en: 'Geography riddles', es: 'Acertijos geográficos' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 1,
  sessionMinutes: 5,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Points', es: 'Puntos' } },
  tags: ['geography', 'landmarks', 'humour', 'travel', 'daily'],
  achievements: [
    {
      id: 'first-find',
      title: { en: 'Found It', es: 'Encontrado' },
      description: { en: 'Name your first place.', es: 'Acierta tu primer lugar.' },
    },
    {
      id: 'first-guess',
      title: { en: 'Seasoned Traveller', es: 'Viajero curtido' },
      description: {
        en: 'Name a place from the first line alone.',
        es: 'Acierta un lugar solo con la primera línea.',
      },
    },
    {
      id: 'last-chance',
      title: { en: 'Last Stop', es: 'Última parada' },
      description: {
        en: 'Find a place on your fifth guess.',
        es: 'Encuentra un lugar en el quinto intento.',
      },
    },
    {
      id: 'globetrotter',
      title: { en: 'Globetrotter', es: 'Trotamundos' },
      description: { en: 'Find 50 places.', es: 'Encuentra 50 lugares.' },
    },
    {
      id: 'week',
      title: { en: 'Frequent Flyer', es: 'Viajero frecuente' },
      description: {
        en: 'Play the daily seven days in a row.',
        es: 'Juega el diario siete días seguidos.',
      },
    },
  ],
};
