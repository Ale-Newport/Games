import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'doodle-recognizer',
  number: 227,
  title: { en: 'Doodle Recognizer', es: 'Reconocedor de dibujos' },
  tagline: {
    en: 'You draw, a neural network guesses — six words, twenty seconds each.',
    es: 'Tú dibujas y una red neuronal adivina: seis palabras, veinte segundos cada una.',
  },
  description: {
    en: 'Draw the word you are given while a small neural network, trained on real human doodles, says what it sees in real time (out loud if you like). It wins the round the moment its top guess is right. At the end, review your six drawings and what the computer thought of each.',
    es: 'Dibuja la palabra que te toca mientras una pequeña red neuronal, entrenada con dibujos reales de personas, dice lo que ve en tiempo real (en voz alta si quieres). Gana la ronda en cuanto su mejor apuesta acierta. Al final, repasa tus seis dibujos y qué pensó el ordenador de cada uno.',
  },
  category: 'viral',
  genre: { en: 'Drawing', es: 'Dibujo' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 1,
  sessionMinutes: 3,
  inputs: ['mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Drawings recognized', es: 'Dibujos reconocidos' } },
  tags: ['drawing', 'ai', 'neural-network', 'casual'],
  achievements: [
    {
      id: 'first',
      title: { en: 'It Sees You', es: 'Te ve' },
      description: { en: 'Get a drawing recognized.', es: 'Consigue que reconozca un dibujo.' },
    },
    {
      id: 'speedy',
      title: { en: 'Quick Sketch', es: 'Boceto rápido' },
      description: {
        en: 'Get recognized in under 4 seconds.',
        es: 'Consigue que te reconozca en menos de 4 segundos.',
      },
    },
    {
      id: 'perfect',
      title: { en: 'Six for Six', es: 'Seis de seis' },
      description: {
        en: 'Get all six drawings recognized.',
        es: 'Consigue que reconozca los seis dibujos.',
      },
    },
  ],
};
