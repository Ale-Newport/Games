import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'pentago',
  number: 34,
  title: { en: 'Pentago', es: 'Pentago' },
  tagline: {
    en: 'Five in a row on a board that keeps turning.',
    es: 'Cinco en línea en un tablero que no deja de girar.',
  },
  description: {
    en: 'Place a marble, then twist one of the four quadrants a quarter turn: get five in a row before your opponent. Animated twists, hints and three computer levels.',
    es: 'Coloca una canica y gira uno de los cuatro cuadrantes un cuarto de vuelta: haz cinco en línea antes que tu rival. Giros animados, pistas y tres niveles de CPU.',
  },
  category: 'board',
  genre: { en: 'Abstract strategy', es: 'Estrategia abstracta' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 8,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['pentago', 'five in a row', 'rotation', 'abstract'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'First Twist', es: 'Primer giro' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Spin Doctor', es: 'Experto en giros' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Turntable Master', es: 'Maestro del plato' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'no-twist-needed',
      title: { en: 'No Twist Needed', es: 'Sin necesidad de girar' },
      description: {
        en: 'Win with a placement that already makes five.',
        es: 'Gana con una colocación que ya hace cinco.',
      },
    },
    {
      id: 'quick-five',
      title: { en: 'Quick Five', es: 'Cinco rápido' },
      description: {
        en: 'Beat the computer in at most seven of your moves.',
        es: 'Vence a la CPU en siete jugadas tuyas o menos.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Spinning Table', es: 'Mesa giratoria' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
