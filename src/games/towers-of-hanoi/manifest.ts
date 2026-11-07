import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'towers-of-hanoi',
  number: 133,
  title: { en: 'Towers of Hanoi', es: 'Torres de Hanói' },
  tagline: {
    en: 'Move the tower one disk at a time, never a big disk on a small one — on three pegs or four.',
    es: 'Traslada la torre disco a disco, nunca uno grande sobre uno pequeño, con tres varillas o cuatro.',
  },
  description: {
    en: 'The classic recursive puzzle with 3, 5 or 7 disks on three pegs and 6 disks on four. The counter shows the fewest moves, hints are exact from any position, and the solver can show how it is done.',
    es: 'El clásico puzle recursivo con 3, 5 o 7 discos en tres varillas y 6 discos en cuatro. El marcador muestra el mínimo de movimientos, las pistas son exactas desde cualquier posición y el solucionador puede enseñarte cómo se hace.',
  },
  category: 'puzzle',
  genre: { en: 'Recursive', es: 'Recursivo' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 1,
  sessionMinutes: 3,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Moves', es: 'Movimientos' }, lowerIsBetter: true },
  tags: ['hanoi', 'disks', 'classic', 'logic', 'recursion'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Tower Moved', es: 'Torre trasladada' },
      description: { en: 'Move a tower.', es: 'Traslada una torre.' },
    },
    {
      id: 'optimal',
      title: { en: 'Not a Move Wasted', es: 'Ni un movimiento de más' },
      description: {
        en: 'Move a tower in the fewest moves, without hints.',
        es: 'Traslada una torre con el mínimo de movimientos, sin pistas.',
      },
    },
    {
      id: 'seven',
      title: { en: 'One Hundred Twenty-Seven', es: 'Ciento veintisiete' },
      description: {
        en: 'Move seven disks in exactly 127 moves, without hints.',
        es: 'Traslada siete discos en exactamente 127 movimientos, sin pistas.',
      },
    },
    {
      id: 'four',
      title: { en: 'The Fourth Peg', es: 'La cuarta varilla' },
      description: {
        en: 'Move six disks on four pegs in 17 moves, without hints.',
        es: 'Traslada seis discos en cuatro varillas en 17 movimientos, sin pistas.',
      },
    },
  ],
};
