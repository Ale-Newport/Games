import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'size-sense',
  number: 232,
  title: { en: 'Size Sense', es: 'Ojo de medidas' },
  tagline: {
    en: 'How tall is that tower, how long that ship, how wide that moon? Stretch it to size.',
    es: '¿Cuánto mide esa torre, ese barco o esa luna? Estíralo hasta su tamaño.',
  },
  description: {
    en: 'The size-estimation guessing game: a mystery object stands next to a reference drawn at true scale, and you stretch its silhouette until you think it is right. 5,700 real measurements from Wikidata — skyscrapers, towers, bridges, ships, aircraft, cars, locomotives, statues, coins, moons, planets and stars — with proportional scoring, a smooth auto-zooming stage, a daily five-object challenge and endless runs by difficulty and category, in metric or imperial units.',
    es: 'El juego de estimar tamaños: un objeto misterioso junto a una referencia dibujada a escala real; estira su silueta hasta que creas que acierta. 5.700 medidas reales de Wikidata —rascacielos, torres, puentes, barcos, aviones, coches, locomotoras, estatuas, monedas, lunas, planetas y estrellas— con puntuación proporcional, un escenario con zoom automático suave, un reto diario de cinco objetos y partidas sin fin por dificultad y categoría, en unidades métricas o imperiales.',
  },
  category: 'estimation',
  genre: { en: 'Size estimation', es: 'Estimación de tamaños' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 1,
  sessionMinutes: 4,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Points', es: 'Puntos' } },
  tags: ['estimation', 'measurement', 'daily', 'architecture', 'vehicles', 'space'],
  achievements: [
    {
      id: 'first-size',
      title: { en: 'Measuring Up', es: 'A la medida' },
      description: { en: 'Lock in your first guess.', es: 'Fija tu primera estimación.' },
    },
    {
      id: 'spot-on',
      title: { en: 'Spot On', es: 'Clavado' },
      description: { en: 'Score 97 or more on an object.', es: 'Consigue 97 o más en un objeto.' },
    },
    {
      id: 'tape-measure',
      title: { en: 'Human Tape Measure', es: 'Cinta métrica humana' },
      description: {
        en: 'Guess 25 objects within 10 % of their real size.',
        es: 'Acierta 25 objetos con menos de un 10 % de error.',
      },
    },
    {
      id: 'astronomer',
      title: { en: 'Astronomer', es: 'Astrónomo' },
      description: {
        en: 'Score 80 or more on a planet, moon or star.',
        es: 'Consigue 80 o más con un planeta, luna o estrella.',
      },
    },
    {
      id: 'daily-400',
      title: { en: 'Sharp Eye', es: 'Vista de águila' },
      description: {
        en: 'Score 400 or more in a daily challenge.',
        es: 'Consigue 400 o más en un reto diario.',
      },
    },
    {
      id: 'week',
      title: { en: 'Daily Measure', es: 'Medida diaria' },
      description: {
        en: 'Play the daily challenge seven days in a row.',
        es: 'Juega el reto diario siete días seguidos.',
      },
    },
  ],
};
