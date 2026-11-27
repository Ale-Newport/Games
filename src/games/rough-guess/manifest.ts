import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'rough-guess',
  number: 234,
  title: { en: 'Rough Guess', es: 'A ojo de buen cubero' },
  tagline: {
    en: 'Gold in 1980? Paris to Tokyo? Iron’s melting point? Answer with a range — narrow wins.',
    es: '¿El oro en 1980? ¿De París a Tokio? ¿Dónde funde el hierro? Responde con un rango: estrecho gana.',
  },
  description: {
    en: 'The range-estimation game: commodity prices from 65 years of World Bank data, straight-line distances between 525 cities, properties of the chemical elements and world facts. Drag a range on a log scale; it scores only if it holds the answer, and more the narrower it is. Daily ten-question challenge with a calibration verdict, endless runs by difficulty and topic.',
    es: 'El juego de estimar con rangos: precios de materias primas con 65 años de datos del Banco Mundial, distancias en línea recta entre 525 ciudades, propiedades de los elementos químicos y datos del mundo. Arrastra un rango en una escala logarítmica; solo puntúa si contiene la respuesta, y más cuanto más estrecho. Reto diario de diez preguntas con veredicto de calibración y partidas sin fin por dificultad y tema.',
  },
  category: 'estimation',
  genre: { en: 'Range estimation', es: 'Estimación por rangos' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 5,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Points', es: 'Puntos' } },
  tags: ['estimation', 'calibration', 'prices', 'geography', 'chemistry', 'daily'],
  achievements: [
    {
      id: 'first-range',
      title: { en: 'In the Ballpark', es: 'Por ahí anda' },
      description: { en: 'Lock in your first range.', es: 'Fija tu primer rango.' },
    },
    {
      id: 'narrow',
      title: { en: 'Pinpoint', es: 'Al milímetro' },
      description: {
        en: 'Score 90 or more with a range that holds the answer.',
        es: 'Consigue 90 o más con un rango que contenga la respuesta.',
      },
    },
    {
      id: 'trader',
      title: { en: 'Commodity Trader', es: 'Corredor de materias primas' },
      description: {
        en: 'Score 80 or more on a price question.',
        es: 'Consigue 80 o más en una pregunta de precios.',
      },
    },
    {
      id: 'clean-sheet',
      title: { en: 'Clean Sheet', es: 'Pleno' },
      description: {
        en: 'Hit all ten questions of a daily challenge.',
        es: 'Acierta las diez preguntas de un reto diario.',
      },
    },
    {
      id: 'calibrated',
      title: { en: 'Well Calibrated', es: 'Bien calibrado' },
      description: {
        en: 'After 50 questions, keep your hit rate between 80 % and 95 %.',
        es: 'Tras 50 preguntas, mantén tus aciertos entre el 80 % y el 95 %.',
      },
    },
    {
      id: 'week',
      title: { en: 'Roughly Daily', es: 'Casi a diario' },
      description: {
        en: 'Play the daily challenge seven days in a row.',
        es: 'Juega el reto diario siete días seguidos.',
      },
    },
  ],
};
