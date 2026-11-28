import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'number-line',
  number: 243,
  title: { en: 'Number Line', es: 'Línea numérica' },
  tagline: {
    en: 'Three countries are already on the line. Where do the other three go?',
    es: 'Ya hay tres países en la línea. ¿Dónde van los otros tres?',
  },
  description: {
    en: 'A placement game over real World Bank data: one indicator in one year — life expectancy, GDP per person, internet use, forest cover, CO₂ per person and 39 more — drawn as a number line with three reference countries already placed. Drag three mystery countries to where you think they sit; each scores by how close it lands, as a share of the line. Daily five lines (one per topic), endless runs by topic and difficulty.',
    es: 'Un juego de colocar con datos reales del Banco Mundial: un indicador en un año —esperanza de vida, PIB por habitante, uso de internet, superficie forestal, CO₂ por habitante y 39 más— dibujado como una línea numérica con tres países de referencia ya colocados. Arrastra tres países misteriosos a donde crees que están; cada uno puntúa según lo cerca que cae, en proporción a la línea. Cinco líneas diarias (una por tema) y partidas sin fin por tema y dificultad.',
  },
  category: 'estimation',
  genre: { en: 'Data placement', es: 'Colocar datos' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 5,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Points', es: 'Puntos' } },
  tags: ['estimation', 'statistics', 'world bank', 'countries', 'daily'],
  achievements: [
    {
      id: 'first-line',
      title: { en: 'On the Line', es: 'En la línea' },
      description: { en: 'Lock in your first line.', es: 'Fija tu primera línea.' },
    },
    {
      id: 'bullseye',
      title: { en: 'Three in Place', es: 'Los tres en su sitio' },
      description: {
        en: 'Score 90 or more with all three countries of a line.',
        es: 'Consigue 90 o más con los tres países de una línea.',
      },
    },
    {
      id: 'sharpshooter',
      title: { en: 'Sharpshooter', es: 'Tirador fino' },
      description: {
        en: 'Make 25 placements worth 90 or more.',
        es: 'Haz 25 colocaciones de 90 o más.',
      },
    },
    {
      id: 'statistician',
      title: { en: 'Statistician', es: 'Estadístico' },
      description: { en: 'Score 400 or more in a daily.', es: 'Consigue 400 o más en un diario.' },
    },
    {
      id: 'week',
      title: { en: 'Daily Data', es: 'Datos diarios' },
      description: {
        en: 'Play the daily seven days in a row.',
        es: 'Juega el diario siete días seguidos.',
      },
    },
  ],
};
