import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'bomber-arena',
  number: 189,
  title: { en: 'Blast Arena', es: 'Arena explosiva' },
  tagline: {
    en: 'Four blasters, one arena, a lot of bombs. Be the last one standing.',
    es: 'Cuatro robots, una arena y muchas bombas. Sé el último en pie.',
  },
  description: {
    en: 'A bomb-laying arena game with an original name and look: you and three computer blasters start in the corners of an arena of pillars and crates. Drop bombs to blast crates (some hide an extra bomb, a longer flame or more speed) and catch your rivals in the flames — chains set off other bombs. The last blaster standing wins the round; in the final 40 seconds the arena closes in. First to two rounds takes the match. Arrows and Space, or the touch pad; the computer players use the same tactics as the AI you can watch.',
    es: 'Un juego de bombas en una arena con nombre y aspecto originales: tú y tres robots del ordenador empezáis en las esquinas de una arena de pilares y cajas. Pon bombas para volar cajas (algunas esconden una bomba extra, una llama más larga o más velocidad) y atrapar a tus rivales en las llamas: las cadenas hacen estallar otras bombas. El último en pie gana la ronda; en los últimos 40 segundos la arena se cierra. Quien gane dos rondas se lleva la partida. Flechas y Espacio, o el panel táctil; los rivales usan la misma táctica que la IA que puedes mirar.',
  },
  category: 'arcade',
  genre: { en: 'Arcade', es: 'Arcade' },
  players: { min: 1, max: 1 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 5,
  inputs: ['keyboard', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Score', es: 'Puntos' } },
  tags: ['arcade', 'real-time', 'versus', 'bombs'],
  achievements: [
    {
      id: 'round',
      title: { en: 'Last One Standing', es: 'El último en pie' },
      description: { en: 'Win a round.', es: 'Gana una ronda.' },
    },
    {
      id: 'kill',
      title: { en: 'Caught in the Blast', es: 'Atrapado en la explosión' },
      description: { en: 'Catch a rival in your flames.', es: 'Atrapa a un rival con tus llamas.' },
    },
    {
      id: 'match',
      title: { en: 'Arena Champion', es: 'Campeón de la arena' },
      description: { en: 'Win a match.', es: 'Gana una partida.' },
    },
    {
      id: 'sweep',
      title: { en: 'Clean Sweep', es: 'Sin dar opción' },
      description: {
        en: 'Win a match two rounds to none.',
        es: 'Gana una partida por dos rondas a cero.',
      },
    },
  ],
};
