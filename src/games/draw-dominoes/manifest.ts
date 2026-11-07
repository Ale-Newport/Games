import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'draw-dominoes',
  number: 157,
  title: { en: 'Draw Dominoes', es: 'Dominó de robo' },
  tagline: {
    en: 'Dominoes with a boneyard: when nothing fits, draw until something does.',
    es: 'Dominó con pozo: si no te cabe nada, roba hasta que algo encaje.',
  },
  description: {
    en: 'Double-six dominoes for 2–4 players (seven tiles each for two, five for three or four) with a boneyard: a player who cannot match an open end draws until they can, and passes only when the boneyard is empty. Going out scores the other hands’ pips; a blocked game goes to the lowest hand. First to 100 wins.',
    es: 'Dominó doble seis para 2–4 jugadores (siete fichas cada uno entre dos, cinco entre tres o cuatro) con pozo: quien no puede casar un extremo roba hasta que pueda, y solo pasa con el pozo vacío. Quedarse sin fichas se apunta los puntos de las otras manos; si se cierra, gana la mano más baja. Gana quien llegue a 100.',
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
  tags: ['dominoes', 'tiles', 'hidden-information', 'multiplayer', 'vs-ai'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Out of the Boneyard', es: 'Fuera del pozo' },
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
      id: 'shutout',
      title: { en: 'Shutout', es: 'Paliza' },
      description: {
        en: 'Win before any opponent scores.',
        es: 'Gana sin que ningún rival puntúe.',
      },
    },
  ],
};
