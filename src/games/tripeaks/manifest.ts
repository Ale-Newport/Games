import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'tripeaks',
  number: 78,
  title: { en: 'TriPeaks', es: 'Tres picos' },
  tagline: {
    en: 'Climb three peaks one rank at a time — up or down, king next to ace.',
    es: 'Sube a tres picos de rango en rango, arriba o abajo, con el rey junto al as.',
  },
  description: {
    en: 'Three overlapping peaks of cards stand over a single waste pile. Play any uncovered card one rank above or below the waste card to build long runs, turn hidden cards up as you go, and clear all three peaks before the stock runs out.',
    es: 'Tres picos de cartas superpuestas sobre un único descarte. Juega cualquier carta descubierta un rango por encima o por debajo de la del descarte para encadenar rachas, destapa cartas a tu paso y despeja los tres picos antes de que se acabe el mazo.',
  },
  category: 'cards',
  genre: { en: 'Solitaire', es: 'Solitario' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 1,
  sessionMinutes: 4,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Score', es: 'Puntos' } },
  tags: ['tripeaks', 'solitaire', 'patience', 'cards'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Summit', es: 'Cumbre' },
      description: { en: 'Clear all three peaks.', es: 'Despeja los tres picos.' },
    },
    {
      id: 'long-run',
      title: { en: 'Avalanche', es: 'Avalancha' },
      description: {
        en: 'Win with a run of ten plays or more without drawing.',
        es: 'Gana con una racha de diez jugadas o más sin robar.',
      },
    },
    {
      id: 'spare',
      title: { en: 'Light Pack', es: 'Mochila ligera' },
      description: {
        en: 'Win with five or more cards left in the stock.',
        es: 'Gana con cinco cartas o más en el mazo.',
      },
    },
    {
      id: 'clean',
      title: { en: 'Free Climb', es: 'Escalada libre' },
      description: { en: 'Win without undo or hints.', es: 'Gana sin deshacer ni pistas.' },
    },
  ],
};
