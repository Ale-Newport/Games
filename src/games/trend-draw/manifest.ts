import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'trend-draw',
  number: 244,
  title: { en: 'Trend Draw', es: 'Dibuja la tendencia' },
  tagline: {
    en: 'One starting point and the world’s curve. Draw how this country really went.',
    es: 'Un punto de partida y la curva del mundo. Dibuja cómo le fue de verdad a este país.',
  },
  description: {
    en: 'A drawing game over real World Bank data: an indicator for one country over 15–40 years — life expectancy, GDP per person, internet use, fertility, CO₂… — with only its first point shown and the world’s own curve dotted across the chart as a guide. Draw the whole line freehand (or with the keys); the score falls with the average gap to the truth. Then see the real line and a computer’s curve built from countries that started at a similar level. Daily five charts, endless runs by topic and difficulty.',
    es: 'Un juego de dibujar con datos reales del Banco Mundial: un indicador de un país durante 15–40 años —esperanza de vida, PIB por habitante, uso de internet, fecundidad, CO₂…— con solo su primer punto a la vista y la curva del mundo punteada como guía. Dibuja la línea entera a mano alzada (o con las teclas); la puntuación baja con la distancia media a la realidad. Después ves la línea real y la curva de un ordenador hecha con países que empezaron en un nivel parecido. Cinco gráficas diarias y partidas sin fin por tema y dificultad.',
  },
  category: 'estimation',
  genre: { en: 'Draw the data', es: 'Dibujar datos' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 5,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Points', es: 'Puntos' } },
  tags: ['estimation', 'drawing', 'statistics', 'world bank', 'daily'],
  achievements: [
    {
      id: 'first-trend',
      title: { en: 'First Stroke', es: 'Primer trazo' },
      description: { en: 'Submit your first drawing.', es: 'Envía tu primer dibujo.' },
    },
    {
      id: 'steady-hand',
      title: { en: 'Steady Hand', es: 'Pulso firme' },
      description: { en: 'Score 90 or more on a chart.', es: 'Consigue 90 o más en una gráfica.' },
    },
    {
      id: 'beat-peers',
      title: { en: 'Better Than the Peers', es: 'Mejor que los parecidos' },
      description: {
        en: 'Beat the similar-countries curve on 10 charts.',
        es: 'Supera la curva de países parecidos en 10 gráficas.',
      },
    },
    {
      id: 'trend-setter',
      title: { en: 'Trend Setter', es: 'Marcatendencias' },
      description: { en: 'Score 350 or more in a daily.', es: 'Consigue 350 o más en un diario.' },
    },
    {
      id: 'week',
      title: { en: 'Daily Sketch', es: 'Boceto diario' },
      description: {
        en: 'Play the daily seven days in a row.',
        es: 'Juega el diario siete días seguidos.',
      },
    },
  ],
};
