import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'aerial-eye',
  number: 242,
  title: { en: 'Aerial Eye', es: 'Ojo aéreo' },
  tagline: {
    en: 'A real aerial photo, zoomed right in. Which airport, castle, volcano or city is it?',
    es: 'Una foto aérea real, muy ampliada. ¿Qué aeropuerto, castillo, volcán o ciudad es?',
  },
  description: {
    en: 'Read the ground like an image analyst: 365 freely licensed aerial photographs of real places from Wikimedia Commons — airports, racing circuits, cities, historic sites, stadiums, castles, volcanoes, mountains, islands, lakes and rivers. Each photo starts zoomed in on its centre with six places of the same kind to choose from; a wrong pick strikes it and zooms out. Three picks for 100, 50 or 20 points, then the whole photo, a map and the photographer’s credit. Daily five photos of five kinds, endless runs by kind and difficulty.',
    es: 'Lee el terreno como un analista de imágenes: 365 fotografías aéreas con licencia libre de lugares reales, de Wikimedia Commons: aeropuertos, circuitos, ciudades, lugares históricos, estadios, castillos, volcanes, montañas, islas, lagos y ríos. Cada foto empieza ampliada en su centro, con seis lugares del mismo tipo para elegir; un fallo lo tacha y aleja la imagen. Tres intentos por 100, 50 o 20 puntos y luego la foto completa, un mapa y el crédito del fotógrafo. Cinco fotos diarias de cinco tipos y partidas sin fin por tipo y dificultad.',
  },
  category: 'estimation',
  genre: { en: 'Aerial photo identification', es: 'Identificar fotos aéreas' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 1,
  sessionMinutes: 4,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Points', es: 'Puntos' } },
  tags: ['geography', 'photos', 'aerial', 'observation', 'daily'],
  achievements: [
    {
      id: 'first-spot',
      title: { en: 'Spotted', es: 'Localizado' },
      description: { en: 'Identify your first place.', es: 'Identifica tu primer lugar.' },
    },
    {
      id: 'eagle-eye',
      title: { en: 'Eagle Eye', es: 'Vista de águila' },
      description: {
        en: 'Identify 10 places on the first pick.',
        es: 'Identifica 10 lugares al primer intento.',
      },
    },
    {
      id: 'all-rounder',
      title: { en: 'All-Rounder', es: 'Todoterreno' },
      description: {
        en: 'Identify five different kinds of place in one run.',
        es: 'Identifica cinco tipos de lugar distintos en una partida.',
      },
    },
    {
      id: 'analyst',
      title: { en: 'Chief Analyst', es: 'Analista jefe' },
      description: { en: 'Score 500 in a daily.', es: 'Consigue 500 en un diario.' },
    },
    {
      id: 'week',
      title: { en: 'Daily Flyover', es: 'Sobrevuelo diario' },
      description: {
        en: 'Play the daily seven days in a row.',
        es: 'Juega el diario siete días seguidos.',
      },
    },
  ],
};
