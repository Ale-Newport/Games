import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'sos',
  number: 50,
  title: { en: 'SOS', es: 'SOS' },
  tagline: {
    en: 'Write S or O, spell S-O-S, and keep the pen.',
    es: 'Escribe S u O, forma S-O-S y sigue escribiendo.',
  },
  description: {
    en: 'Take turns writing an S or an O on a 6×6 grid. Every S-O-S you complete — across, down or diagonally — scores a point and gives you another turn. When the grid is full, the most SOS wins.',
    es: 'Escribid por turnos una S o una O en una cuadrícula de 6×6. Cada S-O-S que completas (en horizontal, vertical o diagonal) suma un punto y te da otro turno. Con la cuadrícula llena, gana quien tenga más SOS.',
  },
  category: 'strategy',
  genre: { en: 'Pencil and paper', es: 'Lápiz y papel' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 1,
  sessionMinutes: 5,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['sos', 'pencil and paper', 'letters', 'scoring'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Signal Received', es: 'Señal recibida' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Careful Writer', es: 'Escritura cuidadosa' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Mayday Master', es: 'Maestro del SOS' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'wordsmith',
      title: { en: 'Wordsmith', es: 'Escritor prolífico' },
      description: {
        en: 'Win with 8 or more SOS.',
        es: 'Gana con 8 SOS o más.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Arcade Night', es: 'Noche de arcade' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
