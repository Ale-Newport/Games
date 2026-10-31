import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'shut-the-box',
  number: 154,
  title: { en: 'Shut the Box', es: 'Cierra la caja' },
  tagline: {
    en: 'The pub dice game of nine wooden tiles: match each throw, leave as little open as you can.',
    es: 'El juego de dados de taberna con nueve fichas de madera: iguala cada tirada y deja abierto lo mínimo.',
  },
  description: {
    en: 'Shut tiles from 1 to 9 that add up to each throw of the dice — one die once the rest add up to 6 or less — until you are stuck; the tiles left open are your score, and shutting them all wins outright. The game is solved over all 512 boxes, so the Perfect opponent and the hints play for the lowest expected score and show it. Solo, against the computer or with friends on one device.',
    es: 'Cierra fichas del 1 al 9 que sumen cada tirada de los dados —un dado cuando las demás suman 6 o menos— hasta quedarte sin jugada; las fichas abiertas son tu puntuación y cerrarlas todas gana. El juego está resuelto sobre las 512 cajas posibles, así que el rival Perfecto y las pistas buscan la menor puntuación esperada y la muestran. En solitario, contra el ordenador o con amigos en un dispositivo.',
  },
  category: 'dice',
  genre: { en: 'Dice game', es: 'Juego de dados' },
  players: { min: 1, max: 4 },
  vsComputer: true,
  complexity: 1,
  sessionMinutes: 4,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Tiles left open', es: 'Fichas abiertas' }, lowerIsBetter: true },
  tags: ['dice', 'solved', 'pub', 'solo', 'vs-ai'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Lid Down', es: 'Tapa cerrada' },
      description: { en: 'Finish a game.', es: 'Termina una partida.' },
    },
    {
      id: 'shut',
      title: { en: 'Shut the Box!', es: '¡Caja cerrada!' },
      description: { en: 'Shut every tile.', es: 'Cierra todas las fichas.' },
    },
    {
      id: 'low',
      title: { en: 'Nearly Shut', es: 'Casi cerrada' },
      description: {
        en: 'Finish with 5 or less left open.',
        es: 'Termina con 5 o menos abiertos.',
      },
    },
    {
      id: 'beat',
      title: { en: 'Lowest Box', es: 'La caja más baja' },
      description: {
        en: 'Win a game against the computer.',
        es: 'Gana una partida contra el ordenador.',
      },
    },
  ],
};
