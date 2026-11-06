import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'dots-and-boxes',
  number: 40,
  title: { en: 'Dots and Boxes', es: 'Puntos y cajas' },
  tagline: {
    en: 'Close a box and draw again — but watch out for long chains.',
    es: 'Cierra una caja y vuelve a trazar, pero cuidado con las cadenas largas.',
  },
  description: {
    en: 'Take turns drawing lines between dots on a 4×4 grid of boxes. Completing a box claims it and earns another line. The most boxes wins. Three computer levels, from greedy to a chain-aware search.',
    es: 'Trazad líneas por turnos entre los puntos de una cuadrícula de 4×4 cajas. Completar una caja la gana y da otra línea. Gana quien tenga más cajas. Tres niveles de CPU, desde codicioso hasta una búsqueda que entiende las cadenas.',
  },
  category: 'board',
  genre: { en: 'Pencil and paper', es: 'Lápiz y papel' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 6,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['dots and boxes', 'pencil and paper', 'chains', 'abstract'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Boxed In', es: 'Encajonado' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Chain Reaction', es: 'Reacción en cadena' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Double Dealer', es: 'Doble cesión' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'landslide',
      title: { en: 'Landslide', es: 'Arrollador' },
      description: {
        en: 'Win with 12 or more boxes.',
        es: 'Gana con 12 cajas o más.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Arcade Night', es: 'Noche de arcade' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
