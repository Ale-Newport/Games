/** Breakout on the shared brick core and arcade shell. */
import { bricksDef } from '../shared/bricks/definition';
import { BREAKOUT } from '../shared/bricks/rules';

export const DEF = bricksDef(BREAKOUT, {
  id: 'breakout',
  prefix: 'bo',
  achievements(s, unlock) {
    if (s.small || s.wall > 0) unlock('first');
    if (s.wall > 0 || (s.over && s.lives > 0)) unlock('wall');
    if (s.over && s.lives > 0) unlock('both');
    if (s.score >= 896) unlock('perfect');
  },
  strings: {
    en: {
      title: 'Breakout',
      'menu.subtitle':
        'Knock down the wall brick by brick: keep the ball in play with your paddle, and clear the wall twice. Higher rows are worth more — and the ball speeds up when you reach them.',
      'hud.score': 'Score',
      'hud.lives': 'Balls',
      'hud.wall': 'Wall',
      'end.cleared': 'Every wall cleared — {n} points!',
      'end.over': 'Game over on wall {w}: {n} points.',
    },
    es: {
      title: 'Breakout',
      'menu.subtitle':
        'Derriba el muro ladrillo a ladrillo: mantén la pelota en juego con tu pala y limpia el muro dos veces. Las filas altas valen más, y la pelota acelera al alcanzarlas.',
      'hud.score': 'Puntos',
      'hud.lives': 'Pelotas',
      'hud.wall': 'Muro',
      'end.cleared': '¡Todos los muros limpios: {n} puntos!',
      'end.over': 'Fin de la partida en el muro {w}: {n} puntos.',
    },
  },
});
