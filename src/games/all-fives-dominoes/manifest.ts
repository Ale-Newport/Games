import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'all-fives-dominoes',
  number: 158,
  title: { en: 'All Fives Dominoes', es: 'Dominó de los cincos' },
  tagline: {
    en: 'Score as you play: make the open ends add up to a multiple of five.',
    es: 'Puntúa mientras juegas: haz que los extremos sumen un múltiplo de cinco.',
  },
  description: {
    en: 'Double-six dominoes for 2–4 players with a boneyard and a spinner: the opening double can be played on all four sides once both of its sides hold a tile. Whenever the open ends add up to a multiple of five (a double at an end counts both halves), the player scores that sum at once; going out adds the other hands’ pips rounded to five. First to 150 wins.',
    es: 'Dominó doble seis para 2–4 jugadores con pozo y doble giratorio: el doble de salida se puede jugar por sus cuatro lados cuando sus dos costados tienen ficha. Cada vez que los extremos suman un múltiplo de cinco (un doble en un extremo cuenta sus dos mitades), el jugador se apunta esa suma al momento; quedarse sin fichas añade los puntos de las otras manos redondeados a cinco. Gana quien llegue a 150.',
  },
  category: 'dice',
  genre: { en: 'Dominoes', es: 'Dominó' },
  players: { min: 2, max: 4 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 15,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Points', es: 'Puntos' } },
  tags: ['dominoes', 'tiles', 'hidden-information', 'scoring', 'multiplayer', 'vs-ai'],
  achievements: [
    {
      id: 'first',
      title: { en: 'High Five', es: 'Choca esos cinco' },
      description: {
        en: 'Win a game against the computer.',
        es: 'Gana una partida contra el ordenador.',
      },
    },
    {
      id: 'hard',
      title: { en: 'Bone Master', es: 'Maestro del hueso' },
      description: { en: 'Beat hard computer players.', es: 'Vence a rivales difíciles.' },
    },
    {
      id: 'four',
      title: { en: 'Full Table', es: 'Mesa completa' },
      description: { en: 'Win a four-player game.', es: 'Gana una partida a cuatro.' },
    },
    {
      id: 'twenty',
      title: { en: 'Twenty Spot', es: 'Veinte de golpe' },
      description: {
        en: 'Score 20 or more with one play.',
        es: 'Apúntate 20 o más con una jugada.',
      },
    },
  ],
};
