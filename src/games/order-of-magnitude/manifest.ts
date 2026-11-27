import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'order-of-magnitude',
  number: 233,
  title: { en: 'Order of Magnitude', es: 'Orden de magnitud' },
  tagline: {
    en: 'How many people, how many kilometres, how many dollars? Three guesses in powers of ten.',
    es: '¿Cuántas personas, cuántos kilómetros, cuántos dólares? Tres intentos en potencias de diez.',
  },
  description: {
    en: 'The daily estimation game of orders of magnitude: 5,100 verified quantities from Wikidata and the World Bank — city and country populations, GDP, tourism, rivers, mountains, lakes, islands, buildings, bridges, ships, planets and stars. Answer in scientific notation, get higher/lower and how-many-orders-off feedback, watch a magnitude ruler narrow down, and lock in when you are close. Daily five-question challenge and endless runs by difficulty and topic.',
    es: 'El juego diario de estimar órdenes de magnitud: 5.100 cantidades verificadas de Wikidata y el Banco Mundial —población de ciudades y países, PIB, turismo, ríos, montañas, lagos, islas, edificios, puentes, barcos, planetas y estrellas—. Responde en notación científica, recibe pistas de «más o menos» y de cuántos órdenes te alejas, mira cómo se estrecha la regla de magnitudes y fija cuando estés cerca. Reto diario de cinco preguntas y partidas sin fin por dificultad y tema.',
  },
  category: 'estimation',
  genre: { en: 'Number estimation', es: 'Estimación numérica' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 1,
  sessionMinutes: 4,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Points', es: 'Puntos' } },
  tags: ['estimation', 'numbers', 'daily', 'geography', 'economics', 'science'],
  achievements: [
    {
      id: 'first-answer',
      title: { en: 'Ballpark', es: 'A ojo' },
      description: { en: 'Lock in your first answer.', es: 'Fija tu primera respuesta.' },
    },
    {
      id: 'first-try',
      title: { en: 'First Try', es: 'A la primera' },
      description: {
        en: 'Get within 5 % with your first guess.',
        es: 'Acierta a menos del 5 % en el primer intento.',
      },
    },
    {
      id: 'calibrated',
      title: { en: 'Well Calibrated', es: 'Bien calibrado' },
      description: {
        en: 'Answer 25 questions within 5 %.',
        es: 'Responde 25 preguntas a menos del 5 %.',
      },
    },
    {
      id: 'economist',
      title: { en: 'Economist', es: 'Economista' },
      description: {
        en: "Get a country's GDP within 5 %.",
        es: 'Acierta el PIB de un país a menos del 5 %.',
      },
    },
    {
      id: 'daily-400',
      title: { en: 'Power of Ten', es: 'Potencia de diez' },
      description: {
        en: 'Score 400 or more in a daily challenge.',
        es: 'Consigue 400 o más en un reto diario.',
      },
    },
    {
      id: 'week',
      title: { en: 'Daily Estimate', es: 'Estimación diaria' },
      description: {
        en: 'Play the daily challenge seven days in a row.',
        es: 'Juega el reto diario siete días seguidos.',
      },
    },
  ],
};
