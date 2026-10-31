import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'tile-rummy',
  number: 161,
  title: { en: 'Tile Rummy', es: 'Rummy de fichas' },
  tagline: {
    en: 'Runs and groups of numbered tiles — rearrange the whole table to empty your rack first.',
    es: 'Escaleras y grupos de fichas numeradas: reorganiza toda la mesa para vaciar tu atril antes.',
  },
  description: {
    en: 'The numbered-tile rummy for 2–4 players: 106 tiles in four colours with two jokers, a 30-point first play, and a table you may rearrange freely as long as every set stays valid. Play against computer players that lay down their own sets, or ones that add to the table, split long runs and borrow tiles — and ask the hint to lay a play out for you.',
    es: 'El rummy de fichas numeradas para 2–4 jugadores: 106 fichas en cuatro colores con dos comodines, una primera jugada de 30 puntos y una mesa que puedes reorganizar a tu gusto mientras todos los juegos sigan siendo válidos. Juega contra rivales que bajan sus propios juegos o que añaden a la mesa, parten escaleras largas y toman fichas prestadas, y pide a la pista que te coloque una jugada.',
  },
  category: 'dice',
  genre: { en: 'Tile game', es: 'Juego de fichas' },
  players: { min: 2, max: 4 },
  vsComputer: true,
  complexity: 3,
  sessionMinutes: 20,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Points', es: 'Puntos' } },
  tags: ['tiles', 'rummy', 'hidden-information', 'multiplayer', 'vs-ai'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Rack Cleared', es: 'Atril vacío' },
      description: {
        en: 'Win a game against the computer.',
        es: 'Gana una partida contra el ordenador.',
      },
    },
    {
      id: 'hard',
      title: { en: 'Table Master', es: 'Dueño de la mesa' },
      description: { en: 'Beat hard computer players.', es: 'Vence a rivales difíciles.' },
    },
    {
      id: 'out',
      title: { en: 'Going Out', es: 'Sin fichas' },
      description: { en: 'Win by emptying your rack.', es: 'Gana vaciando tu atril.' },
    },
    {
      id: 'four',
      title: { en: 'Full Table', es: 'Mesa completa' },
      description: { en: 'Win a four-player game.', es: 'Gana una partida a cuatro.' },
    },
  ],
};
