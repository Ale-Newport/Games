import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'gap-graph',
  number: 245,
  title: { en: 'Gap Graph', es: 'Gráfica con huecos' },
  tagline: {
    en: 'Real World Bank charts with three values missing. Fill the gaps.',
    es: 'Gráficas reales del Banco Mundial a las que les faltan tres valores. Rellena los huecos.',
  },
  description: {
    en: 'A chart-completion game over real World Bank data, with two kinds of chart in turn: a country’s line over 12–20 years with three years missing — always including the year that broke the trend most — and eight countries’ bars in one year with three bars missing. Drag each gap to where you think it belongs (or use the keys); each scores by how close it lands as a share of the chart height. Daily five charts, endless runs by topic and difficulty.',
    es: 'Un juego de completar gráficas con datos reales del Banco Mundial, con dos tipos que se alternan: la línea de un país durante 12–20 años a la que faltan tres años —siempre incluido el que más rompió la tendencia— y las barras de ocho países en un año, de las que faltan tres. Arrastra cada hueco hasta donde crees que va (o usa las teclas); cada uno puntúa según lo cerca que cae, en proporción a la altura de la gráfica. Cinco gráficas diarias y partidas sin fin por tema y dificultad.',
  },
  category: 'estimation',
  genre: { en: 'Chart completion', es: 'Completar gráficas' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 5,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Points', es: 'Puntos' } },
  tags: ['estimation', 'charts', 'statistics', 'world bank', 'daily'],
  achievements: [
    {
      id: 'first-gap',
      title: { en: 'Mind the Gap', es: 'Cuidado con el hueco' },
      description: { en: 'Lock in your first chart.', es: 'Fija tu primera gráfica.' },
    },
    {
      id: 'seamless',
      title: { en: 'Seamless', es: 'Sin costuras' },
      description: {
        en: 'Score 90 or more on all three gaps of a chart.',
        es: 'Consigue 90 o más en los tres huecos de una gráfica.',
      },
    },
    {
      id: 'gap-filler',
      title: { en: 'Gap Filler', es: 'Rellenahuecos' },
      description: { en: 'Fill 30 gaps worth 90 or more.', es: 'Rellena 30 huecos de 90 o más.' },
    },
    {
      id: 'data-detective',
      title: { en: 'Data Detective', es: 'Detective de datos' },
      description: { en: 'Score 400 or more in a daily.', es: 'Consigue 400 o más en un diario.' },
    },
    {
      id: 'week',
      title: { en: 'Daily Charts', es: 'Gráficas diarias' },
      description: {
        en: 'Play the daily seven days in a row.',
        es: 'Juega el diario siete días seguidos.',
      },
    },
  ],
};
