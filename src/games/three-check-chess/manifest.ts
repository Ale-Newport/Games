import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'three-check-chess',
  number: 19,
  title: { en: 'Three-Check Chess', es: 'Ajedrez de tres jaques' },
  tagline: {
    en: 'Check, check, check — the third one wins.',
    es: 'Jaque, jaque, jaque: el tercero gana.',
  },
  description: {
    en: 'Standard chess where giving check three times also wins. Check counters, clocks, resignation and four computer levels.',
    es: 'Ajedrez estándar en el que dar jaque tres veces también gana. Contadores de jaques, relojes, rendición y cuatro niveles de CPU.',
  },
  category: 'board',
  genre: { en: 'Chess variant', es: 'Variante de ajedrez' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 4,
  sessionMinutes: 15,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['three-check', '3check', 'chess variant', 'tres jaques'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Check Mark', es: 'Marca de jaque' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Triple Threat', es: 'Triple amenaza' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Check Machine', es: 'Máquina de jaques' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'beat-expert',
      title: { en: 'Third Time Lucky', es: 'A la tercera va la vencida' },
      description: { en: 'Beat Expert.', es: 'Vence al nivel Experto.' },
    },
    {
      id: 'untouchable',
      title: { en: 'Untouchable', es: 'Intocable' },
      description: {
        en: 'Beat the computer without receiving a single check.',
        es: 'Vence a la CPU sin recibir ni un jaque.',
      },
    },
    {
      id: 'mate-anyway',
      title: { en: 'Mate Anyway', es: 'Mate de todos modos' },
      description: {
        en: 'Win Three-Check by checkmate.',
        es: 'Gana al ajedrez de tres jaques por jaque mate.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Check Swap', es: 'Intercambio de jaques' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
