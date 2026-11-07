import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'five-card-draw',
  number: 88,
  title: { en: 'Five Card Draw Poker', es: 'Póker de descarte' },
  tagline: {
    en: 'Five cards, one draw, fixed-limit betting — a sit-and-go against up to five AI opponents.',
    es: 'Cinco cartas, un descarte y apuestas de límite fijo: un torneo contra hasta cinco rivales de IA.',
  },
  description: {
    en: 'Everyone is dealt five cards face down. Bet, throw away up to three cards and draw replacements, then bet again; the best hand takes the pot. Bets are fixed (one big blind before the draw, two after), so reading how many cards each opponent took matters. Play chips only — no real money.',
    es: 'Cada jugador recibe cinco cartas tapadas. Se apuesta, se descartan hasta tres cartas para recibir otras y se vuelve a apostar; gana la mejor mano. Las apuestas son fijas (una ciega grande antes del descarte, dos después), así que importa fijarse en cuántas cartas cambió cada rival. Solo fichas de juego, sin dinero real.',
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
  tags: ['poker', 'draw', 'tournament', 'cards'],
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
      id: 'pat-hand',
      title: { en: 'Pat Hand', es: 'Mano servida' },
      description: {
        en: 'Win a showdown without drawing a card.',
        es: 'Gana un enfrentamiento sin cambiar ninguna carta.',
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
