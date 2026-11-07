import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'rpsls',
  number: 163,
  title: { en: 'Rock Paper Scissors Lizard Wizard', es: 'Piedra, papel, tijera, lagarto o mago' },
  tagline: {
    en: 'Five throws, each beating two: fewer ties and more patterns to read.',
    es: 'Cinco jugadas, cada una vence a dos: menos empates y más patrones que leer.',
  },
  description: {
    en: 'The five-throw extension of rock, paper, scissors with our own cast: the wizard melts rock and enchants scissors, paper binds the wizard, the lizard bites the wizard and eats paper. Play to 3, 5 or 10 round wins against a coin flip, a counter, a pattern reader or the mind reader, and check after each round what it read in you.',
    es: 'La ampliación a cinco jugadas de piedra, papel o tijera con un reparto propio: el mago derrite la piedra y hechiza la tijera, el papel encierra al mago, el lagarto muerde al mago y se come el papel. Juega a 3, 5 o 10 rondas ganadas contra uno a cara o cruz, un contador, un lector de patrones o el lector de mentes, y mira tras cada ronda qué leyó en ti.',
  },
  category: 'dice',
  genre: { en: 'Hand game', es: 'Juego de manos' },
  players: { min: 1, max: 1 },
  vsComputer: true,
  complexity: 1,
  sessionMinutes: 3,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Round margin', es: 'Diferencia de rondas' } },
  tags: ['hand-game', 'prediction', 'quick', 'vs-ai'],
  achievements: [
    {
      id: 'first',
      title: { en: 'First Victory', es: 'Primera victoria' },
      description: { en: 'Win a match.', es: 'Gana una partida.' },
    },
    {
      id: 'mind',
      title: { en: 'Unreadable', es: 'Ilegible' },
      description: { en: 'Beat the Mind reader.', es: 'Vence al Lector de mentes.' },
    },
    {
      id: 'streak',
      title: { en: 'On a Roll', es: 'En racha' },
      description: { en: 'Win five rounds in a row.', es: 'Gana cinco rondas seguidas.' },
    },
    {
      id: 'shutout',
      title: { en: 'Clean Sheet', es: 'Sin perder ni una' },
      description: {
        en: 'Win a match without losing a round.',
        es: 'Gana una partida sin perder una ronda.',
      },
    },
  ],
};
