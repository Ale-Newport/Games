import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'pyramid-solitaire',
  number: 77,
  title: { en: 'Pyramid', es: 'Pirámide' },
  tagline: {
    en: 'Pair cards that add up to 13 and take the pyramid apart from the bottom up.',
    es: 'Empareja cartas que sumen 13 y desmonta la pirámide desde abajo.',
  },
  description: {
    en: 'Twenty-eight cards form a pyramid. Remove two uncovered cards that add up to 13 — a queen with an ace, a jack with a two — or a king on its own, turn cards from the stock for more partners, and clear the whole pyramid within three passes.',
    es: 'Veintiocho cartas forman una pirámide. Quita dos cartas descubiertas que sumen 13 (una reina con un as, una jota con un dos) o un rey solo, gira cartas del mazo para encontrar parejas y despeja la pirámide en tres vueltas.',
  },
  category: 'cards',
  genre: { en: 'Solitaire', es: 'Solitario' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 1,
  sessionMinutes: 5,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Score', es: 'Puntos' } },
  tags: ['pyramid', 'solitaire', 'patience', 'cards'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Tomb Raider', es: 'Saqueador de tumbas' },
      description: { en: 'Clear the pyramid.', es: 'Despeja la pirámide.' },
    },
    {
      id: 'one-pass',
      title: { en: 'Straight Through', es: 'De una tirada' },
      description: {
        en: 'Clear the pyramid without turning the waste back.',
        es: 'Despeja la pirámide sin dar la vuelta al descarte.',
      },
    },
    {
      id: 'clean',
      title: { en: 'Sharp Eye', es: 'Ojo de lince' },
      description: {
        en: 'Clear it without undo or hints.',
        es: 'Despéjala sin deshacer ni pistas.',
      },
    },
    {
      id: 'quick',
      title: { en: 'Sandstorm', es: 'Tormenta de arena' },
      description: { en: 'Clear it in under 3 minutes.', es: 'Despéjala en menos de 3 minutos.' },
    },
  ],
};
