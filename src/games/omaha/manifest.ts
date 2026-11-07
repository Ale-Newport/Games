import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'omaha',
  number: 89,
  title: { en: "Omaha Hold'em", es: "Omaha Hold'em" },
  tagline: {
    en: 'Four hole cards, exactly two of them in your hand, pot-limit betting — a sit-and-go against AI.',
    es: 'Cuatro cartas propias, exactamente dos en tu jugada y apuestas al límite del bote: un torneo contra la IA.',
  },
  description: {
    en: "Like Texas Hold'em with four hole cards: your hand is exactly two of them plus exactly three of the five community cards, which makes big hands common and draws plentiful. Raises are capped at the size of the pot. Everyone starts with 1500 chips and the blinds rise every ten hands. Play chips only — no real money.",
    es: "Como el Texas Hold'em pero con cuatro cartas propias: tu jugada usa exactamente dos de ellas y exactamente tres de las cinco comunitarias, así que abundan las manos grandes y los proyectos. Las subidas se limitan al tamaño del bote. Todos empiezan con 1500 fichas y las ciegas suben cada diez manos. Solo fichas de juego, sin dinero real.",
  },
  category: 'cards',
  genre: { en: 'Poker', es: 'Póker' },
  players: { min: 1, max: 1 },
  vsComputer: true,
  complexity: 4,
  sessionMinutes: 25,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Finish place', es: 'Puesto final' }, lowerIsBetter: true },
  tags: ['poker', 'omaha', 'pot-limit', 'tournament', 'cards'],
  achievements: [
    {
      id: 'first-pot',
      title: { en: 'First Pot', es: 'Primer bote' },
      description: { en: 'Win a pot.', es: 'Gana un bote.' },
    },
    {
      id: 'steal',
      title: { en: 'Daylight Robbery', es: 'Robo a plena luz' },
      description: {
        en: 'Win a pot by raising and making everyone fold.',
        es: 'Gana un bote subiendo y haciendo que todos se retiren.',
      },
    },
    {
      id: 'double-up',
      title: { en: 'Double Up', es: 'Doblar fichas' },
      description: { en: 'Win an all-in showdown.', es: 'Gana un enfrentamiento yendo con todo.' },
    },
    {
      id: 'monster',
      title: { en: 'Monster Hand', es: 'Mano monstruo' },
      description: {
        en: 'Win a showdown with a full house or better.',
        es: 'Gana un enfrentamiento con full o mejor.',
      },
    },
    {
      id: 'champion',
      title: { en: 'Champion', es: 'Campeón' },
      description: { en: 'Win a sit-and-go tournament.', es: 'Gana un torneo.' },
    },
    {
      id: 'shark',
      title: { en: 'Shark', es: 'Tiburón' },
      description: {
        en: 'Win a full table of five Hard opponents.',
        es: 'Gana una mesa completa contra cinco rivales difíciles.',
      },
    },
  ],
};
