import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'kalah',
  number: 61,
  title: { en: 'Kalah Mancala', es: 'Kalah (mancala)' },
  tagline: {
    en: 'The classic count-and-capture mancala: six pits, four seeds, two stores.',
    es: 'El mancala clásico de contar y capturar: seis casillas, cuatro semillas y dos almacenes.',
  },
  description: {
    en: 'Pick up all the seeds of one of your pits and sow them one by one counter-clockwise, into your own store but never your opponent’s. End in your store to sow again; end in an empty pit of yours to capture the seeds opposite. Most seeds wins.',
    es: 'Toma todas las semillas de una de tus casillas y siémbralas una a una en sentido antihorario, en tu almacén pero nunca en el del rival. Si acabas en tu almacén vuelves a sembrar; si acabas en una casilla vacía tuya, capturas las semillas de enfrente. Gana quien reúne más.',
  },
  category: 'strategy',
  genre: { en: 'Mancala', es: 'Mancala' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 8,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['kalah', 'mancala', 'sowing', 'count and capture'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'First Harvest', es: 'Primera cosecha' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Seed Counter', es: 'Contador de semillas' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Granary Master', es: 'Maestro del granero' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'big-store',
      title: { en: 'Overflowing Store', es: 'Almacén rebosante' },
      description: {
        en: 'Win with 30 or more seeds in your store.',
        es: 'Gana con 30 semillas o más en tu almacén.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Arcade Night', es: 'Noche de arcade' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
