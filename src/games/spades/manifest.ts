import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'spades',
  number: 94,
  title: { en: 'Spades', es: 'Picas' },
  tagline: {
    en: 'Bid your tricks with an AI partner, make the contract, dodge the bags — first to 500.',
    es: 'Puja tus bazas con un compañero de IA, cumple el contrato y esquiva los sacos: el primero a 500.',
  },
  description: {
    en: 'The partnership trick-taking game where spades are always trump. Each player bids the tricks they expect to take (or nil); your side scores for making its contract and loses for falling short, while overtricks pile up as bags. The Hard players bid and play by simulating possible deals of the cards they cannot see.',
    es: 'El juego de bazas por parejas donde las picas siempre son triunfo. Cada jugador puja las bazas que espera hacer (o nil); tu pareja suma si cumple el contrato y resta si no, y las bazas de más se acumulan como sacos. Los jugadores difíciles pujan y juegan simulando repartos posibles de las cartas que no ven.',
  },
  category: 'cards',
  genre: { en: 'Trick-taking', es: 'Bazas' },
  players: { min: 1, max: 1 },
  vsComputer: true,
  complexity: 3,
  sessionMinutes: 25,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Final score', es: 'Puntuación final' } },
  tags: ['spades', 'trick-taking', 'partnership', 'cards'],
  achievements: [
    {
      id: 'contract',
      title: { en: 'Made It', es: 'Cumplido' },
      description: { en: 'Make your side’s contract.', es: 'Cumple el contrato de tu pareja.' },
    },
    {
      id: 'set',
      title: { en: 'Set Them', es: 'Hundidos' },
      description: {
        en: 'Make the other side fall short.',
        es: 'Haz que la otra pareja no cumpla.',
      },
    },
    {
      id: 'nil',
      title: { en: 'Nothing Doing', es: 'Nada de nada' },
      description: { en: 'Bid nil and take no trick.', es: 'Puja nil y no hagas ninguna baza.' },
    },
    {
      id: 'win-game',
      title: { en: 'Five Hundred', es: 'Quinientos' },
      description: { en: 'Win a game.', es: 'Gana una partida.' },
    },
    {
      id: 'win-hard',
      title: { en: 'Ace of Spades', es: 'As de picas' },
      description: { en: 'Win a game at Hard.', es: 'Gana una partida en Difícil.' },
    },
  ],
};
