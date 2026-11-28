import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'equation-guess',
  number: 246,
  title: { en: 'Equation Guess', es: 'Adivina la ecuación' },
  tagline: {
    en: 'Find the hidden equation in a few tries. Every guess must be true.',
    es: 'Descubre la ecuación oculta en pocos intentos. Cada intento tiene que ser cierto.',
  },
  description: {
    en: 'A daily arithmetic deduction puzzle: the answer is a true equation such as 82−57=25, of 6 or 8 characters. Type any true equation; each symbol turns green if it is in the right place, yellow if it is in the equation elsewhere, grey if not. Three sizes — Mini, Classic and Hard (fewer tries) — standard precedence, exact division. Daily three equations (one of each) and endless runs, with a solver AI.',
    es: 'Un acertijo diario de deducción aritmética: la respuesta es una ecuación cierta, como 82−57=25, de 6 u 8 caracteres. Escribe cualquier ecuación cierta; cada símbolo se pone verde si está en su sitio, amarillo si está en la ecuación en otro sitio y gris si no está. Tres tamaños —Mini, Clásica y Difícil (menos intentos)—, prioridad habitual de operaciones y divisiones exactas. Tres ecuaciones diarias (una de cada) y partidas sin fin, con una IA que resuelve.',
  },
  category: 'estimation',
  genre: { en: 'Arithmetic deduction', es: 'Deducción aritmética' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 6,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Points', es: 'Puntos' } },
  tags: ['math', 'logic', 'deduction', 'numbers', 'daily'],
  achievements: [
    {
      id: 'first-solve',
      title: { en: 'Balanced', es: 'Equilibrada' },
      description: { en: 'Solve your first equation.', es: 'Resuelve tu primera ecuación.' },
    },
    {
      id: 'lightning',
      title: { en: 'Lightning Calculator', es: 'Calculadora relámpago' },
      description: {
        en: 'Solve an equation in two tries or fewer.',
        es: 'Resuelve una ecuación en dos intentos o menos.',
      },
    },
    {
      id: 'hard-solve',
      title: { en: 'Under Pressure', es: 'Bajo presión' },
      description: { en: 'Solve a Hard equation.', es: 'Resuelve una ecuación Difícil.' },
    },
    {
      id: 'mathematician',
      title: { en: 'Mathematician', es: 'Matemático' },
      description: { en: 'Solve 25 equations.', es: 'Resuelve 25 ecuaciones.' },
    },
    {
      id: 'week',
      title: { en: 'Daily Sums', es: 'Cuentas diarias' },
      description: {
        en: 'Play the daily seven days in a row.',
        es: 'Juega el diario siete días seguidos.',
      },
    },
  ],
};
