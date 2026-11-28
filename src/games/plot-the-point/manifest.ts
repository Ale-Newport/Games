import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'plot-the-point',
  number: 236,
  title: { en: 'Plot the Point', es: 'Sitúa el punto' },
  tagline: {
    en: 'A real chart of every country — except a few. Drag them to where the data puts them.',
    es: 'Una gráfica real con todos los países… menos unos pocos. Arrástralos a donde los ponen los datos.',
  },
  description: {
    en: 'The data-placement game: real World Bank scatter charts — wealth against life expectancy, fertility against child mortality, energy against emissions and more, any year since 1990 — with a few countries hidden. Drag each one to where you think it sits, on correctly scaled linear and log axes, then see the true positions, your distance and how the computer did by reasoning from similar countries. Daily five-chart challenge and endless play.',
    es: 'El juego de colocar datos: gráficas de dispersión reales del Banco Mundial —riqueza frente a esperanza de vida, fecundidad frente a mortalidad infantil, energía frente a emisiones y más, cualquier año desde 1990— con unos pocos países ocultos. Arrastra cada uno a donde creas que está, en ejes lineales y logarítmicos bien escalados, y descubre las posiciones reales, tu distancia y cómo lo hizo el ordenador razonando con países parecidos. Reto diario de cinco gráficas y juego sin fin.',
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
  tags: ['statistics', 'data', 'charts', 'geography', 'economics', 'daily'],
  achievements: [
    {
      id: 'first-chart',
      title: { en: 'On the Map', es: 'En el mapa' },
      description: { en: 'Submit your first chart.', es: 'Envía tu primera gráfica.' },
    },
    {
      id: 'pinpoint',
      title: { en: 'Pinpoint', es: 'Clavado' },
      description: { en: 'Score 95 or more on one country.', es: 'Consigue 95 o más con un país.' },
    },
    {
      id: 'cartographer',
      title: { en: 'Data Cartographer', es: 'Cartógrafo de datos' },
      description: {
        en: 'Score 85 or more on a whole chart.',
        es: 'Consigue 85 o más en una gráfica entera.',
      },
    },
    {
      id: 'beat-machine',
      title: { en: 'Better Than Neighbours', es: 'Mejor que los vecinos' },
      description: {
        en: 'Beat the computer on 10 charts.',
        es: 'Supera al ordenador en 10 gráficas.',
      },
    },
    {
      id: 'week',
      title: { en: 'Daily Analyst', es: 'Analista diario' },
      description: {
        en: 'Play the daily challenge seven days in a row.',
        es: 'Juega el reto diario siete días seguidos.',
      },
    },
  ],
};
