/** Enhanced Brick Breaker on the shared brick core and arcade shell. */
import { bricksDef } from '../shared/bricks/definition';
import { ENHANCED } from '../shared/bricks/rules';

export const DEF = bricksDef(ENHANCED, {
  id: 'brick-breaker',
  prefix: 'bb',
  achievements(s, unlock) {
    if (s.wall > 0 || (s.over && s.lives > 0)) unlock('first');
    if (s.caught > 0) unlock('capsules');
    if (s.over && s.lives > 0) unlock('all');
    if (s.score >= 1500) unlock('score');
  },
  strings: {
    en: {
      title: 'Enhanced Brick Breaker',
      'menu.subtitle':
        'Five walls of tough bricks, gold blocks that never break, and falling capsules: a wider paddle, three balls, slow motion, a laser and extra lives.',
      'hud.score': 'Score',
      'hud.lives': 'Balls',
      'hud.wall': 'Wall',
      'end.cleared': 'Every wall cleared — {n} points!',
      'end.over': 'Game over on wall {w}: {n} points.',
    },
    es: {
      title: 'Rompeladrillos mejorado',
      'menu.subtitle':
        'Cinco muros de ladrillos duros, bloques de oro que nunca se rompen y cápsulas que caen: pala ancha, tres pelotas, cámara lenta, láser y vidas extra.',
      'hud.score': 'Puntos',
      'hud.lives': 'Pelotas',
      'hud.wall': 'Muro',
      'end.cleared': '¡Todos los muros limpios: {n} puntos!',
      'end.over': 'Fin de la partida en el muro {w}: {n} puntos.',
    },
  },
});
