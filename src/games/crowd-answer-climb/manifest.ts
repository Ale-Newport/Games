import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'crowd-answer-climb',
  number: 202,
  title: { en: 'Crowd Answer Climb', es: 'Ascenso de respuestas populares' },
  tagline: {
    en: 'Say what everybody says — the more popular your answer, the higher you fly.',
    es: 'Di lo que dice todo el mundo: cuanto más popular tu respuesta, más alto vuelas.',
  },
  description: {
    en: 'The mirror of Rare Answer Dive: seven open prompts, 25 seconds and three tries each, and the most popular answers score most, from Crowd Favourite (100) down to Lone Star (10). Each point lifts your balloon 1 km through the real layers of the atmosphere toward a 700 km orbit. Daily climb with streaks, unlimited climbs, a pass-the-device party for 2–6 players and an AI to watch, in English or Spanish.',
    es: 'El espejo de la Inmersión de respuestas raras: siete preguntas abiertas, 25 segundos y tres intentos cada una, y las respuestas más populares puntúan más, de Favorita del público (100) a Estrella solitaria (10). Cada punto sube tu globo 1 km por las capas reales de la atmósfera hacia una órbita a 700 km. Ascenso diario con rachas, ascensos ilimitados, modo fiesta de 2 a 6 jugadores pasando el dispositivo y una IA para mirar, en inglés o español.',
  },
  category: 'viral',
  genre: { en: 'Trivia', es: 'Trivia' },
  players: { min: 1, max: 6 },
  vsComputer: false,
  complexity: 1,
  sessionMinutes: 4,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Points', es: 'Puntos' } },
  tags: ['trivia', 'daily', 'popular answers', 'survey', 'noillirk', 'balloon', 'party', 'spanish'],
  achievements: [
    {
      id: 'first-climb',
      title: { en: 'Lift Off', es: 'Despegue' },
      description: { en: 'Finish a climb.', es: 'Termina un ascenso.' },
    },
    {
      id: 'karman',
      title: { en: 'Edge of Space', es: 'Al borde del espacio' },
      description: {
        en: 'Reach the Kármán line at 100 km.',
        es: 'Llega a la línea de Kármán a 100 km.',
      },
    },
    {
      id: 'station',
      title: { en: 'Station Altitude', es: 'Altitud de estación' },
      description: { en: 'Reach 400 km in one climb.', es: 'Llega a 400 km en un ascenso.' },
    },
    {
      id: 'orbit',
      title: { en: 'In Orbit', es: 'En órbita' },
      description: { en: 'Reach 600 km in one climb.', es: 'Llega a 600 km en un ascenso.' },
    },
    {
      id: 'hive-mind',
      title: { en: 'Hive Mind', es: 'Mente colmena' },
      description: {
        en: 'Give a Crowd Favourite answer to all seven questions.',
        es: 'Da una respuesta Favorita del público en las siete preguntas.',
      },
    },
    {
      id: 'streak-3',
      title: { en: 'Daily Flyer', es: 'Volador diario' },
      description: {
        en: 'Finish daily climbs three days in a row.',
        es: 'Termina ascensos diarios tres días seguidos.',
      },
    },
    {
      id: 'party',
      title: { en: 'Balloon Party', es: 'Fiesta de globos' },
      description: { en: 'Finish a party climb.', es: 'Termina un ascenso en modo fiesta.' },
    },
  ],
};
