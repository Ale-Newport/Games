import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'closest-call',
  number: 235,
  title: { en: 'Closest Call', es: 'Por los pelos' },
  tagline: {
    en: 'An eight-round estimation showdown: answer in turn, hit the bullseye, beat the field.',
    es: 'Un duelo de estimaciones a ocho rondas: responde por turnos, da en la diana, gana a todos.',
  },
  description: {
    en: 'The closest-to-the-value game show: 2–4 contestants — people passing the device and/or computer players — answer real-world questions in turn (prices, distances, elements, populations, geography), seeing the answers already given. Arrows land on a target by how close they were, the closest takes a bonus, rounds get harder and the last counts double. Computer contestants never see the answer: they reason from related facts and play for expected points. Daily challenge and custom line-ups.',
    es: 'El concurso de acercarse al valor: 2–4 concursantes —personas que se pasan el dispositivo y/o el ordenador— responden por turnos a preguntas reales (precios, distancias, elementos, población, geografía) viendo las respuestas ya dadas. Las flechas caen en la diana según lo cerca que quedaron, el más cercano se lleva un extra, las rondas se endurecen y la última vale doble. El ordenador nunca ve la respuesta: razona con datos relacionados y juega a los puntos esperados. Reto diario y partidas personalizadas.',
  },
  category: 'estimation',
  genre: { en: 'Estimation quiz show', es: 'Concurso de estimación' },
  players: { min: 1, max: 4 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 8,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Points', es: 'Puntos' } },
  tags: ['estimation', 'quiz', 'party', 'local-multiplayer', 'daily'],
  achievements: [
    {
      id: 'bullseye',
      title: { en: 'Bullseye', es: 'En el centro' },
      description: {
        en: 'Answer within 2 % of the truth.',
        es: 'Responde a menos de un 2 % de la verdad.',
      },
    },
    {
      id: 'first-win',
      title: { en: 'Champion', es: 'Campeón' },
      description: { en: 'Win a game against the computer.', es: 'Gana una partida al ordenador.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Expert Slayer', es: 'Matagigantes' },
      description: {
        en: 'Win a game that includes a Hard contestant.',
        es: 'Gana una partida con un concursante difícil.',
      },
    },
    {
      id: 'full-house',
      title: { en: 'Full House', es: 'Casa llena' },
      description: {
        en: 'Win outright against three computer contestants.',
        es: 'Gana sin empates contra tres concursantes del ordenador.',
      },
    },
    {
      id: 'sharpshooter',
      title: { en: 'Sharpshooter', es: 'Tirador de élite' },
      description: { en: 'Score 60 points in one game.', es: 'Consigue 60 puntos en una partida.' },
    },
    {
      id: 'week',
      title: { en: 'Regular Contestant', es: 'Concursante habitual' },
      description: {
        en: 'Play the daily challenge seven days in a row.',
        es: 'Juega el reto diario siete días seguidos.',
      },
    },
  ],
};
