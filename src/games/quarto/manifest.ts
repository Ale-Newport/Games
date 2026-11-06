import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'quarto',
  number: 33,
  title: { en: 'Quarto', es: 'Quarto' },
  tagline: {
    en: 'You place what your opponent gives you.',
    es: 'Colocas lo que tu rival te entrega.',
  },
  description: {
    en: 'Sixteen unique pieces, four traits, one 4×4 board: line up four pieces sharing a trait — but your opponent picks every piece you play. Three computer levels.',
    es: 'Dieciséis piezas únicas, cuatro características y un tablero de 4×4: alinea cuatro piezas que compartan una característica, pero tu rival elige cada pieza que juegas. Tres niveles de CPU.',
  },
  category: 'board',
  genre: { en: 'Abstract strategy', es: 'Estrategia abstracta' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 8,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['quarto', 'four in a row', 'traits', 'abstract'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Quarto!', es: '¡Quarto!' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Careful Giver', es: 'Entrega cuidadosa' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Trait Master', es: 'Maestro de rasgos' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'early-quarto',
      title: { en: 'Early Quarto', es: 'Quarto temprano' },
      description: {
        en: 'Win with at most eight pieces on the board.',
        es: 'Gana con ocho piezas o menos en el tablero.',
      },
    },
    {
      id: 'stalemate-hard',
      title: { en: 'Nothing to Give', es: 'Nada que entregar' },
      description: {
        en: 'Fill the board against Hard without anyone making a Quarto.',
        es: 'Llena el tablero contra el nivel Difícil sin que nadie haga Quarto.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Coffee Table', es: 'Mesa del café' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
