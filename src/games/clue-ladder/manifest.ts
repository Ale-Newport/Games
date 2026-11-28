import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'clue-ladder',
  number: 238,
  title: { en: 'Clue Ladder', es: 'Escalera de pistas' },
  tagline: {
    en: 'Guess a real number, or climb for a better clue — every rung is worth less.',
    es: 'Adivina un número real o sube a por una pista mejor: cada peldaño vale menos.',
  },
  description: {
    en: 'A push-your-luck estimation game over the same real data as Rough Guess — commodity prices, city distances, the chemical elements and world facts. Each question has five rungs: the bare question, two related facts that bracket it, its number of digits, its first digit and a narrow window. Guess on any rung and see “higher” or “lower” with how far off you are; keep the guess, or climb for the next clue at a lower multiplier. Daily five-question ladder and endless runs by difficulty and topic.',
    es: 'Un juego de estimar y arriesgar con los mismos datos reales que A ojo de buen cubero: precios de materias primas, distancias entre ciudades, elementos químicos y datos del mundo. Cada pregunta tiene cinco peldaños: la pregunta sola, dos datos relacionados que la acotan, su número de cifras, su primera cifra y una ventana estrecha. Responde en cualquier peldaño y verás «más» o «menos» y cuánto te alejas; plántate o sube a por la siguiente pista con un multiplicador menor. Escalera diaria de cinco preguntas y partidas sin fin por dificultad y tema.',
  },
  category: 'estimation',
  genre: { en: 'Clue-by-clue estimation', es: 'Estimación con pistas' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 5,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Points', es: 'Puntos' } },
  tags: ['estimation', 'push-your-luck', 'clues', 'prices', 'geography', 'daily'],
  achievements: [
    {
      id: 'first-rung',
      title: { en: 'First Step', es: 'Primer paso' },
      description: { en: 'Finish your first question.', es: 'Termina tu primera pregunta.' },
    },
    {
      id: 'no-clues',
      title: { en: 'No Clues Needed', es: 'Sin pistas' },
      description: {
        en: 'Score 85 or more keeping a guess on the first rung.',
        es: 'Consigue 85 o más plantándote en el primer peldaño.',
      },
    },
    {
      id: 'top-rung',
      title: { en: 'All the Way Up', es: 'Hasta arriba' },
      description: {
        en: 'Climb to the last rung and still score 25.',
        es: 'Sube hasta el último peldaño y aun así consigue 25.',
      },
    },
    {
      id: 'confident',
      title: { en: 'Confident', es: 'Seguro de sí' },
      description: {
        en: 'Keep a guess on the first rung 20 times.',
        es: 'Plántate en el primer peldaño 20 veces.',
      },
    },
    {
      id: 'week',
      title: { en: 'Daily Climber', es: 'Escalador diario' },
      description: {
        en: 'Play the daily ladder seven days in a row.',
        es: 'Juega la escalera diaria siete días seguidos.',
      },
    },
  ],
};
