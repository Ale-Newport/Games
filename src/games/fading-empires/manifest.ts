import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'fading-empires',
  number: 251,
  title: { en: 'Fading Empires', es: 'Imperios menguantes' },
  tagline: {
    en: 'Sweep the valley with a people and a trait, let the empire fade, rise again with another.',
    es: 'Arrasa el valle con un pueblo y un rasgo, deja que el imperio decline y álzate con otro.',
  },
  description: {
    en: 'A conquest game for 2 to 5 players on an invented valley of 26 regions. Pick one of six pairings of a people and a trait (ten peoples, twelve traits, all our own), take regions for two bands plus their defenders, gamble on the reinforcement die for the last one, spread your bands, and earn a coin for every region each turn plus your pairing’s bonuses. When your empire runs out of bands, let it decline — it keeps a band on each region and keeps earning — and pick a new one. The richest after the last round wins. Play against raiders or warlords, or everyone on one device.',
    es: 'Un juego de conquista para 2 a 5 jugadores en un valle inventado de 26 regiones. Elige una de seis parejas de pueblo y rasgo (diez pueblos y doce rasgos, todos propios), toma regiones por dos bandas más sus defensores, juégate la última al dado de refuerzo, reparte tus bandas y gana una moneda por región en cada turno más los bonos de tu pareja. Cuando tu imperio se quede sin bandas, deja que decline —conserva una banda en cada región y sigue ganando— y elige otro. Gana el más rico tras la última ronda. Juega contra saqueadores o caudillos, o todos en un mismo dispositivo.',
  },
  category: 'tabletop',
  genre: { en: 'Conquest and decline', es: 'Conquista y declive' },
  players: { min: 1, max: 5 },
  vsComputer: true,
  complexity: 3,
  sessionMinutes: 30,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Coins', es: 'Monedas' } },
  tags: ['board', 'war', 'area-control', 'multiplayer', 'vs-ai'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Empire Builder', es: 'Constructor de imperios' },
      description: {
        en: 'Win a game against the computer.',
        es: 'Gana una partida contra el ordenador.',
      },
    },
    {
      id: 'warlord-win',
      title: { en: 'Kingmaker', es: 'Hacedor de reyes' },
      description: { en: 'Beat the warlords.', es: 'Vence a los caudillos.' },
    },
    {
      id: 'sprawl',
      title: { en: 'Sprawling', es: 'Expansión' },
      description: {
        en: 'Hold eight regions with one active empire.',
        es: 'Ten ocho regiones con un mismo imperio activo.',
      },
    },
    {
      id: 'decline',
      title: { en: 'Graceful Decline', es: 'Declive con elegancia' },
      description: { en: 'Let an empire decline.', es: 'Deja declinar un imperio.' },
    },
    {
      id: 'lucky',
      title: { en: 'Roll of Fortune', es: 'Golpe de suerte' },
      description: {
        en: 'Take a region with the reinforcement die.',
        es: 'Toma una región con el dado de refuerzo.',
      },
    },
  ],
};
