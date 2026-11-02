/** Shifting Mazes on the shared maze core and arcade shell. */
import { mazeDef } from '../shared/maze/definition';
import { ADVANCED_RULES } from '../shared/maze/sim';

export const DEF = mazeDef(ADVANCED_RULES, {
  prefix: 'mx',
  achievements(s, unlock) {
    if (s.events.includes('chaser-eaten')) unlock('hunt');
    if (s.events.includes('fruit-eaten')) unlock('gem');
    if (s.level >= 3) unlock('mazes');
    if (s.score >= 20000) unlock('score');
  },
  strings: {
    en: {
      title: 'Shifting Mazes',
      'menu.subtitle':
        'A new maze every two levels, less predictable sentinels and a wandering gem.',
      'hud.score': 'Score',
      'hud.lives': 'Lives',
      'hud.level': 'Level',
      'end.over': 'Game over on level {l}: {n} points.',
    },
    es: {
      title: 'Laberintos cambiantes',
      'menu.subtitle':
        'Un laberinto nuevo cada dos niveles, centinelas menos previsibles y una gema que se pasea.',
      'hud.score': 'Puntos',
      'hud.lives': 'Vidas',
      'hud.level': 'Nivel',
      'end.over': 'Fin de la partida en el nivel {l}: {n} puntos.',
    },
  },
});
