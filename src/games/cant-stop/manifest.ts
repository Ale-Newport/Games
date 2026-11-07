import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'cant-stop',
  number: 153,
  title: { en: 'Summit Rush', es: 'Carrera a la cima' },
  tagline: {
    en: 'Pair the dice, climb the columns, and know when to stop — one bad roll and the climb is gone.',
    es: 'Empareja los dados, sube las columnas y sabe cuándo parar: una mala tirada y adiós a lo subido.',
  },
  description: {
    en: 'A push-your-luck climbing race on eleven columns from 2 to 12: pair four dice into two sums, climb with up to three climbers a turn, and stop before a roll you cannot use wipes the turn out. Claim three summits to win. The hard computer weighs every climb and stops by the rule of 28 or the exact chance of a bust, which the hints show you too.',
    es: 'Una carrera de escalada de tentar a la suerte en once columnas del 2 al 12: empareja cuatro dados en dos sumas, sube con hasta tres escaladores por turno y párate antes de que una tirada inservible te borre el turno. Gana quien conquiste tres cimas. El ordenador difícil valora cada subida y se para con la regla del 28 o la probabilidad exacta de fallar, que las pistas también te muestran.',
  },
  category: 'dice',
  genre: { en: 'Dice game', es: 'Juego de dados' },
  players: { min: 1, max: 4 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 15,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Summits', es: 'Cimas' } },
  tags: ['dice', 'push-your-luck', 'race', 'multiplayer', 'vs-ai'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Top of the World', es: 'En la cima del mundo' },
      description: {
        en: 'Win a game against the computer.',
        es: 'Gana una partida contra el ordenador.',
      },
    },
    {
      id: 'hard',
      title: { en: 'Mountaineer', es: 'Alpinista' },
      description: { en: 'Beat hard computer players.', es: 'Vence a rivales difíciles.' },
    },
    {
      id: 'steady',
      title: { en: 'Sure-Footed', es: 'Paso firme' },
      description: { en: 'Win without a single bust.', es: 'Gana sin fallar ni una vez.' },
    },
    {
      id: 'edge',
      title: { en: 'Outer Peaks', es: 'Cimas de los extremos' },
      description: {
        en: 'Win holding the 2 or the 12.',
        es: 'Gana con el 2 o el 12 conquistados.',
      },
    },
  ],
};
