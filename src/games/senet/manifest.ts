import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'senet',
  number: 144,
  title: { en: 'Senet', es: 'Senet' },
  tagline: {
    en: 'The game of the pharaohs: throw sticks, swap lone pieces, and get past the Water to the end of the road.',
    es: 'El juego de los faraones: tira los palos, intercambia piezas solas y supera el Agua hasta el final del camino.',
  },
  description: {
    en: "Ancient Egypt's race game on thirty squares, with Timothy Kendall's reconstructed rules: four throw sticks, extra throws on 1, 4 and 5, swaps with lone pieces, protective pairs and blocking threes, and the special houses of the last row — Happiness, the Water, the Three Truths, Re-Atoum and Ra. Play the computer at two strengths or a friend on the same device.",
    es: 'El juego de carrera del antiguo Egipto en treinta casillas, con las reglas reconstruidas por Timothy Kendall: cuatro palos de tirar, tiradas extra con 1, 4 y 5, intercambios con piezas solas, parejas que protegen y tríos que bloquean, y las casas especiales de la última fila: la Felicidad, el Agua, las Tres Verdades, Re-Atum y Ra. Juega contra el ordenador en dos niveles o contra alguien en el mismo dispositivo.',
  },
  category: 'dice',
  genre: { en: 'Race game', es: 'Juego de carrera' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 12,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Pieces ahead', es: 'Piezas de ventaja' } },
  tags: ['dice', 'race', 'ancient', 'two-player', 'vs-ai'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Justified', es: 'Justificado' },
      description: {
        en: 'Win a game against the computer.',
        es: 'Gana una partida contra el ordenador.',
      },
    },
    {
      id: 'hard',
      title: { en: 'Scribe of the Two Lands', es: 'Escriba de las Dos Tierras' },
      description: { en: 'Beat the hard computer.', es: 'Vence al ordenador difícil.' },
    },
    {
      id: 'shutout',
      title: { en: 'Five to None', es: 'Cinco a cero' },
      description: {
        en: 'Win before the computer bears off a single piece.',
        es: 'Gana antes de que el ordenador saque una sola pieza.',
      },
    },
    {
      id: 'swapper',
      title: { en: 'Changing Places', es: 'Cambio de sitio' },
      description: {
        en: 'Win after swapping places with opposing pieces at least three times.',
        es: 'Gana tras intercambiar el sitio con piezas rivales al menos tres veces.',
      },
    },
  ],
};
