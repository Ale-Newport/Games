import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'qwixx',
  number: 155,
  title: { en: 'Colour Rows', es: 'Filas de colores' },
  tagline: {
    en: 'Six dice, four coloured rows: cross left to right, skip little, and lock rows first.',
    es: 'Seis dados, cuatro filas de colores: tacha de izquierda a derecha, salta poco y cierra filas antes.',
  },
  description: {
    en: 'A fast roll-and-cross dice game in which every throw is everyone’s turn: all players may use the sum of the white dice, and the thrower may add a white and a coloured die too. Numbers are crossed left to right, so each skip costs you, and five crosses let you lock a row. Play alone for a high score or against computer players that weigh every skip.',
    es: 'Un juego rápido de tirar y tachar en el que cada tirada es el turno de todos: todos pueden usar la suma de los dados blancos y quien tira puede sumar además un blanco y uno de color. Se tacha de izquierda a derecha, así que cada salto cuesta, y con cinco cruces puedes cerrar una fila. Juega en solitario por una buena puntuación o contra rivales que sopesan cada salto.',
  },
  category: 'dice',
  genre: { en: 'Dice game', es: 'Juego de dados' },
  players: { min: 1, max: 4 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 15,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Points', es: 'Puntos' } },
  tags: ['dice', 'roll-and-write', 'multiplayer', 'solo', 'vs-ai'],
  achievements: [
    {
      id: 'first',
      title: { en: 'First Sheet', es: 'Primera hoja' },
      description: { en: 'Finish a game.', es: 'Termina una partida.' },
    },
    {
      id: 'century',
      title: { en: 'Century', es: 'Centenario' },
      description: { en: 'Score 100 points or more.', es: 'Consigue 100 puntos o más.' },
    },
    {
      id: 'lock',
      title: { en: 'Locksmith', es: 'Cerrajero' },
      description: { en: 'Lock a row yourself.', es: 'Cierra una fila tú mismo.' },
    },
    {
      id: 'beat',
      title: { en: 'Top Sheet', es: 'La mejor hoja' },
      description: {
        en: 'Win a game against the computer.',
        es: 'Gana una partida contra el ordenador.',
      },
    },
  ],
};
