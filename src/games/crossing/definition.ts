/** Hedgehog Crossing on the shared crossing core and arcade shell. */
import { crossingDef } from '../shared/crossing/definition';
import { CLASSIC } from '../shared/crossing/sim';

export const DEF = crossingDef(CLASSIC, {
  prefix: 'cr',
  achievements(s, unlock) {
    if (s.events.includes('home')) unlock('home');
    if (s.events.includes('beetle')) unlock('beetle');
    if (s.level >= 2) unlock('level');
    if (s.score >= 5000) unlock('score');
  },
  strings: {
    en: {
      title: 'Hedgehog Crossing',
      'menu.subtitle':
        'Hop across five lanes of traffic and a river of logs and turtles to reach the five burrows.',
      'hud.score': 'Score',
      'hud.lives': 'Lives',
      'hud.level': 'Level',
      'end.over': 'Game over on level {l}: {n} points.',
    },
    es: {
      title: 'El cruce del erizo',
      'menu.subtitle':
        'Salta cinco carriles de tráfico y un río de troncos y tortugas para llegar a las cinco madrigueras.',
      'hud.score': 'Puntos',
      'hud.lives': 'Vidas',
      'hud.level': 'Nivel',
      'end.over': 'Fin de la partida en el nivel {l}: {n} puntos.',
    },
  },
});
