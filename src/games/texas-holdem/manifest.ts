import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'texas-holdem',
  number: 87,
  title: { en: "Texas Hold'em", es: "Texas Hold'em" },
  tagline: {
    en: 'A no-limit sit-and-go against up to five AI opponents that only see their own cards.',
    es: 'Un torneo sin límite contra hasta cinco rivales de IA que solo ven sus propias cartas.',
  },
  description: {
    en: 'Two hole cards, five community cards, four betting rounds. Everyone starts with 1500 chips and the blinds rise every ten hands until one player holds them all. Opponents estimate their chances by simulation and weigh them against the pot odds; a coach can do the same for you. Play chips only — no real money.',
    es: 'Dos cartas propias, cinco comunitarias y cuatro rondas de apuestas. Todos empiezan con 1500 fichas y las ciegas suben cada diez manos hasta que un jugador las tiene todas. Los rivales estiman sus opciones simulando y las comparan con las probabilidades del bote; un entrenador puede hacer lo mismo por ti. Solo fichas de juego, sin dinero real.',
  },
  category: 'cards',
  genre: { en: 'Poker', es: 'Póker' },
  players: { min: 1, max: 1 },
  vsComputer: true,
  complexity: 3,
  sessionMinutes: 25,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Finish place', es: 'Puesto final' }, lowerIsBetter: true },
  tags: ['poker', 'holdem', 'tournament', 'cards'],
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
