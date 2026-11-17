import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'rare-answer-dive',
  number: 201,
  title: { en: 'Rare Answer Dive', es: 'Inmersión de respuestas raras' },
  tagline: {
    en: 'Name the answer nobody else would — the rarer it is, the deeper you dive.',
    es: 'Di la respuesta que nadie más diría: cuanto más rara, más hondo buceas.',
  },
  description: {
    en: 'A daily seven-question trivia dive: type one answer per open prompt in 25 seconds, and score by how rare it is, from Bait Ball (10) to Abyssal Pearl (100). Each point sinks your diver 10 metres past real ocean landmarks toward the 7,000 m trench floor. Daily dive with streaks, unlimited dives, a pass-the-device party for 2–6 players and an AI diver to watch, in English or Spanish.',
    es: 'Una inmersión diaria de trivia con siete preguntas: escribe una respuesta por pregunta abierta en 25 segundos y puntúa según lo rara que sea, de Banco de cebo (10) a Perla abisal (100). Cada punto hunde a tu buzo 10 metros, pasando hitos reales del océano, hacia el fondo de la fosa a 7000 m. Inmersión diaria con rachas, inmersiones ilimitadas, modo fiesta de 2 a 6 jugadores pasando el dispositivo y un buzo IA, en inglés o español.',
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
  tags: ['trivia', 'daily', 'rare answers', 'krillion', 'ocean', 'party', 'spanish'],
  achievements: [
    {
      id: 'first-dive',
      title: { en: 'First Descent', es: 'Primer descenso' },
      description: { en: 'Finish a dive.', es: 'Termina una inmersión.' },
    },
    {
      id: 'pearl',
      title: { en: 'Abyssal Pearl', es: 'Perla abisal' },
      description: { en: 'Find a prize answer.', es: 'Encuentra una respuesta premio.' },
    },
    {
      id: 'titanic',
      title: { en: 'Shipwreck Visitor', es: 'Visita al pecio' },
      description: {
        en: 'Reach 3,800 m, the depth of the Titanic.',
        es: 'Llega a 3800 m, la profundidad del Titanic.',
      },
    },
    {
      id: 'hadal',
      title: { en: 'Hadal Explorer', es: 'Explorador hadal' },
      description: { en: 'Reach 6,000 m in one dive.', es: 'Llega a 6000 m en una inmersión.' },
    },
    {
      id: 'no-bait',
      title: { en: 'No Bait Taken', es: 'Sin morder el cebo' },
      description: {
        en: 'Finish a dive without a single Bait Ball or Decoy answer.',
        es: 'Termina una inmersión sin ninguna respuesta Banco de cebo ni Señuelo.',
      },
    },
    {
      id: 'streak-3',
      title: { en: 'Tide Regular', es: 'Habitual de la marea' },
      description: {
        en: 'Finish daily dives three days in a row.',
        es: 'Termina inmersiones diarias tres días seguidos.',
      },
    },
    {
      id: 'party',
      title: { en: 'Puffer Party', es: 'Fiesta de peces globo' },
      description: { en: 'Finish a party dive.', es: 'Termina una inmersión en modo fiesta.' },
    },
  ],
};
