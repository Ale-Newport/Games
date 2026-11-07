import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'precision-platformer',
  number: 182,
  title: { en: 'Spike Hop', es: 'Salto preciso' },
  tagline: {
    en: 'Eight rooms of spikes: jump, wall-jump and dash your way to every door.',
    es: 'Ocho salas de pinchos: salta, rebota en las paredes y haz dash hasta cada puerta.',
  },
  description: {
    en: 'A precision platformer with an original hero and eight single-screen rooms: run, jump higher by holding, slide down and kick off walls, dash once in mid-air in any of eight directions (it comes back on landing), and ride springs — while spikes on floors and ceilings mean instant death and a quick restart of the room. Clear all eight within ten minutes, with as few deaths as you can. Arrows, Space to jump and X or Shift to dash, or the touch pad; watch a planning AI.',
    es: 'Un juego de plataformas de precisión con un héroe original y ocho salas de una pantalla: corre, salta más alto manteniendo el botón, deslízate por las paredes y rebota en ellas, haz un dash en el aire en cualquiera de ocho direcciones (vuelve al aterrizar) y aprovecha los muelles, mientras los pinchos del suelo y del techo suponen muerte instantánea y volver a empezar la sala. Supera las ocho en diez minutos con las menos muertes posibles. Flechas, Espacio para saltar y X o Mayúsculas para el dash, o el panel táctil; mira a una IA que planifica.',
  },
  category: 'arcade',
  genre: { en: 'Platformer', es: 'Plataformas' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 3,
  sessionMinutes: 10,
  inputs: ['keyboard', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Score', es: 'Puntos' } },
  tags: ['arcade', 'real-time', 'platformer', 'precision'],
  achievements: [
    {
      id: 'wall',
      title: { en: 'Off the Wall', es: 'Rebote en la pared' },
      description: { en: 'Kick off a wall.', es: 'Impúlsate en una pared.' },
    },
    {
      id: 'dash',
      title: { en: 'Mind the Gap', es: 'Cuidado con el hueco' },
      description: { en: 'Clear the dash-gap room.', es: 'Supera la sala del hueco.' },
    },
    {
      id: 'win',
      title: { en: 'All Doors Open', es: 'Todas las puertas' },
      description: { en: 'Clear all eight rooms.', es: 'Supera las ocho salas.' },
    },
    {
      id: 'flawless',
      title: { en: 'Flawless', es: 'Impecable' },
      description: {
        en: 'Clear all eight rooms without dying.',
        es: 'Supera las ocho salas sin morir.',
      },
    },
  ],
};
