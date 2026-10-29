import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'lights-out',
  number: 129,
  title: { en: 'Lights Out', es: 'Apaga las luces' },
  tagline: {
    en: 'Each press flips a light and its neighbours — switch the whole grid off.',
    es: 'Cada pulsación cambia una luz y sus vecinas: apaga toda la cuadrícula.',
  },
  description: {
    en: 'The light-switching puzzle on 4×4, 5×5 and 7×7 grids plus a diagonal variant. Every board is solvable, the counter shows the fewest presses (found by linear algebra over two values), and hints point at a press of an optimal solution.',
    es: 'El puzle de interruptores en cuadrículas de 4×4, 5×5 y 7×7 y una variante diagonal. Todos los tableros tienen solución, el marcador muestra el mínimo de pulsaciones (calculado con álgebra lineal de dos valores) y las pistas señalan una pulsación de una solución óptima.',
  },
  category: 'puzzle',
  genre: { en: 'Switches', es: 'Interruptores' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 1,
  sessionMinutes: 3,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Presses', es: 'Pulsaciones' }, lowerIsBetter: true },
  tags: ['lights', 'switches', 'logic', 'grid', 'daily'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Lights Out', es: 'Luces fuera' },
      description: { en: 'Switch a grid off.', es: 'Apaga una cuadrícula.' },
    },
    {
      id: 'optimal',
      title: { en: 'Efficient Electrician', es: 'Electricista eficiente' },
      description: {
        en: 'Solve in the fewest presses, without hints.',
        es: 'Resuelve con el mínimo de pulsaciones, sin pistas.',
      },
    },
    {
      id: 'large',
      title: { en: 'Big Switchboard', es: 'Gran cuadro' },
      description: { en: 'Solve a 7×7 grid without hints.', es: 'Resuelve un 7×7 sin pistas.' },
    },
    {
      id: 'diagonal',
      title: { en: 'Sideways Thinking', es: 'Pensar en diagonal' },
      description: {
        en: 'Solve a diagonal grid without hints.',
        es: 'Resuelve una cuadrícula diagonal sin pistas.',
      },
    },
    {
      id: 'daily',
      title: { en: 'Nightly Round', es: 'Ronda nocturna' },
      description: { en: "Solve today's puzzle.", es: 'Resuelve el puzle del día.' },
    },
  ],
};
