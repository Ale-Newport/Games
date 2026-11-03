import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'rescue-walkers',
  number: 200,
  title: { en: 'Wanderer Rescue', es: 'Rescate de caminantes' },
  tagline: {
    en: 'They walk on their own. You hand out the skills that get them home.',
    es: 'Caminan solos. Tú repartes las habilidades que los llevan a casa.',
  },
  description: {
    en: 'A puzzle platformer in the style of the classic lead-the-walkers-home games, with an original name, look and six original levels. Little wanderers drop from a hatch and walk on their own — turning at walls, climbing small steps, and falling off edges (a long fall or water is fatal). Hand out a limited number of skills — climber, floater, blocker, digger, basher, builder — to get enough of them to the exit. Tap a wanderer to give it the chosen skill, or use the keys; three tries in all. Watch an AI that searches for its plan with the real rules.',
    es: 'Un juego de plataformas y puzles al estilo de los clásicos de guiar a los caminantes a casa, con nombre, aspecto y seis niveles originales. Pequeños caminantes caen de una trampilla y andan solos: se dan la vuelta en las paredes, suben escalones pequeños y caen por los bordes (una caída larga o el agua son mortales). Reparte un número limitado de habilidades —trepador, flotador, bloqueador, excavador, perforador, constructor— para que lleguen suficientes a la salida. Toca a un caminante para darle la habilidad elegida o usa las teclas; hay tres intentos en total. Mira a una IA que busca su plan con las reglas reales.',
  },
  category: 'arcade',
  genre: { en: 'Puzzle platformer', es: 'Plataformas y puzles' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 3,
  sessionMinutes: 10,
  inputs: ['keyboard', 'touch', 'mouse'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Score', es: 'Puntos' } },
  tags: ['arcade', 'puzzle', 'platformer', 'levels'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Home Safe', es: 'A salvo' },
      description: { en: 'Clear a level.', es: 'Supera un nivel.' },
    },
    {
      id: 'everyone',
      title: { en: 'Nobody Left Behind', es: 'Nadie se queda atrás' },
      description: {
        en: 'Bring every wanderer home on a level.',
        es: 'Lleva a casa a todos los caminantes de un nivel.',
      },
    },
    {
      id: 'half',
      title: { en: 'Halfway Home', es: 'A mitad de camino' },
      description: { en: 'Clear level 3.', es: 'Supera el nivel 3.' },
    },
    {
      id: 'all',
      title: { en: 'Master Guide', es: 'Guía maestro' },
      description: { en: 'Clear all six levels.', es: 'Supera los seis niveles.' },
    },
  ],
};
