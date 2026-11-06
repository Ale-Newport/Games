import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'connect-five-gravity',
  number: 6,
  title: { en: 'Connect Five Gravity', es: 'Cinco en línea con gravedad' },
  tagline: {
    en: 'A wider board, a longer line: connect five falling discs.',
    es: 'Tablero más ancho, línea más larga: conecta cinco fichas que caen.',
  },
  description: {
    en: 'A 9×7 gravity board where only five in a row wins. Deeper plans, more traps, three computer levels or a friend.',
    es: 'Un tablero con gravedad de 9×7 donde solo gana el cinco en línea. Planes más profundos, más trampas, tres niveles de CPU o un amigo.',
  },
  category: 'board',
  genre: { en: 'Abstract strategy', es: 'Estrategia abstracta' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 3,
  sessionMinutes: 10,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['connect five', 'five in a row', 'cinco en raya', 'gravity', 'discs', '9x7'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'High Five', es: 'Choca esos cinco' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Wide Thinker', es: 'Visión amplia' },
      description: { en: 'Beat the Medium computer.', es: 'Vence a la CPU en nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Gravity Master', es: 'Maestro de la gravedad' },
      description: { en: 'Beat the Hard computer.', es: 'Vence a la CPU en nivel Difícil.' },
    },
    {
      id: 'six-run',
      title: { en: 'Overkill', es: 'Exceso' },
      description: {
        en: 'Win with a run of six or more.',
        es: 'Gana con una línea de seis o más.',
      },
    },
    {
      id: 'diagonal',
      title: { en: 'Long Slope', es: 'Pendiente larga' },
      description: { en: 'Win with a diagonal line.', es: 'Gana con una línea diagonal.' },
    },
    {
      id: 'hot-seat',
      title: { en: 'Five-Disc Rivals', es: 'Rivales de cinco' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
