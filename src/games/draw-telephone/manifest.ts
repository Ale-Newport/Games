import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'draw-telephone',
  number: 214,
  title: { en: 'Draw Telephone', es: 'Teléfono dibujado' },
  tagline: {
    en: 'Write, draw, describe, repeat — then laugh at how far every message drifted.',
    es: 'Escribe, dibuja, describe y repite; luego ríete de lo lejos que llegó cada mensaje.',
  },
  description: {
    en: 'The drawing telephone party game: everyone writes a sentence, then the sentences travel round the table, alternately drawn and described by the next player, who sees only the previous step. Play with up to four people passing one device and bots that draw real human doodles and describe drawings with a recognizer; the album replays every chain step by step. English or Spanish.',
    es: 'El juego del teléfono con dibujos: todos escriben una frase y las frases dan la vuelta a la mesa, dibujadas y descritas por turnos por el siguiente jugador, que solo ve el paso anterior. Juega con hasta cuatro personas en un dispositivo y bots que dibujan garabatos humanos reales y describen dibujos con un reconocedor; el álbum repasa cada cadena paso a paso. En inglés o español.',
  },
  category: 'viral',
  genre: { en: 'Drawing / party', es: 'Dibujo / fiesta' },
  players: { min: 1, max: 4 },
  vsComputer: true,
  complexity: 1,
  sessionMinutes: 10,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['gartic phone', 'telephone', 'drawing', 'party', 'pictionary', 'spanish'],
  achievements: [
    {
      id: 'first-album',
      title: { en: 'Album Night', es: 'Noche de álbum' },
      description: {
        en: 'Finish a game and open the album.',
        es: 'Termina una partida y abre el álbum.',
      },
    },
    {
      id: 'party',
      title: { en: 'Party Line', es: 'Línea de fiesta' },
      description: {
        en: 'Play with three or more people on one device.',
        es: 'Juega con tres o más personas en un dispositivo.',
      },
    },
    {
      id: 'long-line',
      title: { en: 'Long Line', es: 'Línea larga' },
      description: {
        en: 'Play a game of eight players.',
        es: 'Juega una partida de ocho jugadores.',
      },
    },
  ],
};
