import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'flow',
  number: 130,
  title: { en: 'Color Links', es: 'Une los colores' },
  tagline: {
    en: 'Join matching dots with paths that never cross and fill the whole grid.',
    es: 'Une los puntos iguales con caminos que nunca se cruzan y llenan toda la cuadrícula.',
  },
  description: {
    en: 'A path-drawing puzzle in the Numberlink family with generated grids from 5×5 to 9×9. Drag paths between lettered colored dots, shorten or cut them by drawing over them, and fill every cell. Any full solution counts; hints reveal a whole path from a guaranteed solution.',
    es: 'Un puzle de trazar caminos de la familia Numberlink con cuadrículas generadas de 5×5 a 9×9. Arrastra caminos entre puntos de colores con letra, acórtalos o córtalos dibujando encima y llena todas las casillas. Vale cualquier solución completa; las pistas revelan un camino entero de una solución garantizada.',
  },
  category: 'puzzle',
  genre: { en: 'Path', es: 'Caminos' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 1,
  sessionMinutes: 3,
  inputs: ['mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Time', es: 'Tiempo' }, lowerIsBetter: true },
  tags: ['paths', 'colors', 'logic', 'grid', 'daily'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Connected', es: 'Conectado' },
      description: { en: 'Solve a puzzle.', es: 'Resuelve un puzle.' },
    },
    {
      id: 'perfect',
      title: { en: 'One Stroke Each', es: 'Un trazo por color' },
      description: {
        en: 'Solve with one stroke per color and no hints.',
        es: 'Resuelve con un trazo por color y sin pistas.',
      },
    },
    {
      id: 'hard',
      title: { en: 'Grand Network', es: 'Gran red' },
      description: { en: 'Solve a 9×9 without hints.', es: 'Resuelve un 9×9 sin pistas.' },
    },
    {
      id: 'daily',
      title: { en: 'Daily Link', es: 'Enlace diario' },
      description: { en: "Solve today's puzzle.", es: 'Resuelve el puzle del día.' },
    },
  ],
};
