/** Maze Chase on the shared maze core and arcade shell. */
import { mazeDef } from '../shared/maze/definition';
import { CLASSIC_RULES } from '../shared/maze/sim';

export const DEF = mazeDef(CLASSIC_RULES, {
  prefix: 'mc',
  achievements(s, unlock) {
    if (s.events.includes('chaser-eaten')) unlock('hunt');
    if (s.combo >= 4) unlock('combo');
    if (s.level >= 2) unlock('clear');
    if (s.score >= 10000) unlock('score');
  },
  strings: {
    en: {
      title: 'Maze Chase',
      'menu.subtitle':
        'Collect every seed while four sentinels hunt you. Power cells turn the tables.',
      'hud.score': 'Score',
      'hud.lives': 'Lives',
      'hud.level': 'Level',
      'end.over': 'Game over on level {l}: {n} points.',
    },
    es: {
      title: 'Persecución en el laberinto',
      'menu.subtitle':
        'Recoge todas las semillas mientras cuatro centinelas te persiguen. Las celdas de energía dan la vuelta a la caza.',
      'hud.score': 'Puntos',
      'hud.lives': 'Vidas',
      'hud.level': 'Nivel',
      'end.over': 'Fin de la partida en el nivel {l}: {n} puntos.',
    },
  },
});
