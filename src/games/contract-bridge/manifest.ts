import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'contract-bridge',
  number: 95,
  title: { en: 'Contract Bridge', es: 'Bridge' },
  tagline: {
    en: 'Bid with an AI partner, declare with dummy face up, and play a Chicago of four deals.',
    es: 'Subasta con un compañero de IA, declara con el muerto a la vista y juega un Chicago de cuatro manos.',
  },
  description: {
    en: 'The great partnership card game: an auction to a contract, then thirteen tricks with dummy face up. Duplicate scoring with games, slams, doubles and Chicago vulnerability. The AI uses a natural bidding system; the Hard players play by simulating layouts of the hidden hands.',
    es: 'El gran juego de cartas por parejas: una subasta hasta un contrato y trece bazas con el muerto a la vista. Puntuación de duplicado con mangas, slams, doblos y la vulnerabilidad del Chicago. La IA usa un sistema de subasta natural; los jugadores difíciles juegan simulando distribuciones de las manos ocultas.',
  },
  category: 'cards',
  genre: { en: 'Trick-taking', es: 'Bazas' },
  players: { min: 1, max: 1 },
  vsComputer: true,
  complexity: 5,
  sessionMinutes: 30,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Points ahead', es: 'Puntos de ventaja' } },
  tags: ['bridge', 'trick-taking', 'partnership', 'auction', 'cards'],
  achievements: [
    {
      id: 'game',
      title: { en: 'Game On', es: 'Manga' },
      description: { en: 'Make a game contract.', es: 'Cumple un contrato de manga.' },
    },
    {
      id: 'slam',
      title: { en: 'Slam', es: 'Slam' },
      description: { en: 'Make a slam.', es: 'Cumple un slam.' },
    },
    {
      id: 'doubled',
      title: { en: 'Doubled and Made', es: 'Doblado y cumplido' },
      description: { en: 'Make a doubled contract.', es: 'Cumple un contrato doblado.' },
    },
    {
      id: 'defeat',
      title: { en: 'Down They Go', es: 'Multa' },
      description: { en: 'Defeat the opponents’ contract.', es: 'Haz fallar el contrato rival.' },
    },
    {
      id: 'chicago',
      title: { en: 'Chicago', es: 'Chicago' },
      description: { en: 'Win a Chicago.', es: 'Gana un Chicago.' },
    },
    {
      id: 'win-hard',
      title: { en: 'Grand Master', es: 'Gran maestro' },
      description: { en: 'Win a Chicago at Hard.', es: 'Gana un Chicago en Difícil.' },
    },
  ],
};
