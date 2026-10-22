import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'kayles',
  number: 46,
  title: { en: 'Kayles', es: 'Kayles' },
  tagline: {
    en: 'Topple one pin or two side by side — and take the last one.',
    es: 'Derriba un bolo o dos juntos, y llévate el último.',
  },
  description: {
    en: 'A row of 10 to 20 pins. Each turn knock down one pin, or two pins standing next to each other; the gaps split the row into groups. Whoever knocks down the last pin wins. Hard plays perfectly using Grundy values.',
    es: 'Una fila de 10 a 20 bolos. En cada turno derriba un bolo, o dos bolos que estén juntos; los huecos dividen la fila en grupos. Quien derriba el último bolo gana. Difícil juega perfecto con los valores de Grundy.',
  },
  category: 'strategy',
  genre: { en: 'Mathematical game', es: 'Juego matemático' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 1,
  sessionMinutes: 3,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['kayles', 'combinatorial', 'math', 'pins'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Strike', es: 'Pleno' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Splitting the Row', es: 'Partiendo la fila' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Grundy Master', es: 'Maestro de Grundy' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'full-lane',
      title: { en: 'Full Lane', es: 'Pista completa' },
      description: {
        en: 'Win on a row of 20 pins.',
        es: 'Gana en una fila de 20 bolos.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Arcade Night', es: 'Noche de arcade' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
