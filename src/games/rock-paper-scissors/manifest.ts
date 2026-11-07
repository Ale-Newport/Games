import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'rock-paper-scissors',
  number: 162,
  title: { en: 'Rock Paper Scissors', es: 'Piedra, papel o tijera' },
  tagline: {
    en: 'Throw at the same time — and see whether the computer can read your habits.',
    es: 'Saca a la vez que el ordenador y comprueba si sabe leer tus costumbres.',
  },
  description: {
    en: 'Rock, paper, scissors against four computer opponents: a coin flip that cannot be beaten in the long run, a counter that beats your favourite throw, a pattern reader, and a mind reader that runs many predictors at once — including how you might be reading it — and trusts whichever has been right. Matches to 3, 5 or 10 round wins; after every round you can see what it read in you.',
    es: 'Piedra, papel o tijera contra cuatro rivales: uno a cara o cruz que no se puede vencer a la larga, un contador que vence a tu jugada favorita, un lector de patrones y un lector de mentes que usa muchos predictores a la vez —incluido cómo podrías estar leyéndolo tú— y se fía del que acierta. Partidas a 3, 5 o 10 rondas ganadas; tras cada ronda puedes ver qué leyó en ti.',
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
