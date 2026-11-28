import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'year-guess',
  number: 239,
  title: { en: 'Year Guess', es: 'Adivina el año' },
  tagline: {
    en: 'A battle, a treaty, a film, a discovery: pin its year on a timeline from 3000 BC to today.',
    es: 'Una batalla, un tratado, una película, un descubrimiento: clava su año en una línea del tiempo desde el 3000 a. C.',
  },
  description: {
    en: 'The year-guessing game over thousands of real dated events from Wikidata — battles, wars, treaties, discoveries, spaceflights, films, books, paintings, albums, video games, openings, company foundings and disasters. Place your guess on a timeline compressed with age, nudge it or type it; points fall with the error measured against how old the event is. Daily five events (one from each era) with a timeline recap, and endless runs by era, topic and difficulty.',
    es: 'El juego de adivinar años con miles de sucesos reales fechados de Wikidata: batallas, guerras, tratados, descubrimientos, vuelos espaciales, películas, libros, cuadros, álbumes, videojuegos, inauguraciones, fundaciones de empresas y catástrofes. Coloca tu año en una línea del tiempo comprimida con la antigüedad, ajústalo o escríbelo; los puntos bajan con el error medido frente a la antigüedad del suceso. Cinco sucesos diarios (uno de cada época) con resumen en la línea del tiempo, y partidas sin fin por época, tema y dificultad.',
  },
  category: 'estimation',
  genre: { en: 'History timeline', es: 'Línea del tiempo' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 1,
  sessionMinutes: 4,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Points', es: 'Puntos' } },
  tags: ['estimation', 'history', 'timeline', 'trivia', 'daily'],
  achievements: [
    {
      id: 'first-year',
      title: { en: 'Dated', es: 'Fechado' },
      description: { en: 'Lock in your first year.', es: 'Fija tu primer año.' },
    },
    {
      id: 'exact',
      title: { en: 'To the Year', es: 'Al año exacto' },
      description: {
        en: 'Guess an event’s exact year.',
        es: 'Acierta el año exacto de un suceso.',
      },
    },
    {
      id: 'antiquarian',
      title: { en: 'Antiquarian', es: 'Anticuario' },
      description: {
        en: 'Score 80 or more on an event from before AD 500.',
        es: 'Consigue 80 o más en un suceso anterior al año 500.',
      },
    },
    {
      id: 'historian',
      title: { en: 'Historian', es: 'Historiador' },
      description: {
        en: 'Score 60 or more on all five events of a daily.',
        es: 'Consigue 60 o más en los cinco sucesos de un diario.',
      },
    },
    {
      id: 'week',
      title: { en: 'Every Day in History', es: 'Cada día en la historia' },
      description: {
        en: 'Play the daily seven days in a row.',
        es: 'Juega el diario siete días seguidos.',
      },
    },
  ],
};
