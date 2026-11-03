import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'top-down-racing',
  number: 195,
  title: { en: 'Circuit Sprint', es: 'Sprint en circuito' },
  tagline: {
    en: 'Three laps, three rivals, three circuits seen from above.',
    es: 'Tres vueltas, tres rivales y tres circuitos vistos desde arriba.',
  },
  description: {
    en: 'A top-down racing game with an original name and circuits: race three laps against three computer drivers on an oval, a kidney or a twisting loop. Accelerate, brake before the bends — the car steers more sharply the faster it goes — and stay off the grass, which slows you right down. Bump past rivals and take the flag first. Arrows, the touch pad, or point a finger where to go; watch an AI driver.',
    es: 'Un juego de carreras visto desde arriba con nombre y circuitos originales: corre tres vueltas contra tres pilotos del ordenador en un óvalo, un riñón o un lazo lleno de curvas. Acelera, frena antes de las curvas (el coche gira más cuanto más rápido va) y no pises la hierba, que te frena mucho. Adelanta a los rivales y cruza la meta el primero. Flechas, el panel táctil o señala con el dedo hacia dónde ir; mira a un piloto de la IA.',
  },
  category: 'arcade',
  genre: { en: 'Racing', es: 'Carreras' },
  players: { min: 1, max: 1 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 3,
  inputs: ['keyboard', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Score', es: 'Puntos' } },
  tags: ['arcade', 'real-time', 'racing', 'versus'],
  achievements: [
    {
      id: 'lap',
      title: { en: 'Round We Go', es: 'Una vuelta' },
      description: { en: 'Complete a lap.', es: 'Completa una vuelta.' },
    },
    {
      id: 'finish',
      title: { en: 'Chequered Flag', es: 'Bandera a cuadros' },
      description: { en: 'Finish a race.', es: 'Termina una carrera.' },
    },
    {
      id: 'win',
      title: { en: 'First Past the Post', es: 'El primero en llegar' },
      description: { en: 'Win a race.', es: 'Gana una carrera.' },
    },
    {
      id: 'loop',
      title: { en: 'Master of the Loop', es: 'Maestro del lazo' },
      description: { en: 'Win on the Loop circuit.', es: 'Gana en el circuito del Lazo.' },
    },
  ],
};
