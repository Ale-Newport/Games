/** Endless Crossing on the shared crossing core and arcade shell. */
import { crossingDef } from '../shared/crossing/definition';
import { ENDLESS } from '../shared/crossing/sim';

export const DEF = crossingDef(ENDLESS, {
  prefix: 'ec',
  achievements(s, unlock) {
    if (s.score >= 20) unlock('twenty');
    if (s.score >= 100) unlock('hundred');
    if (s.score >= 250) unlock('twofifty');
    if (s.score >= 500) unlock('fivehundred');
  },
  strings: {
    en: {
      title: 'Endless Crossing',
      'menu.subtitle':
        'Roads, rivers, railways and meadows that never end. Keep hopping — the hawk is watching.',
      'hud.rows': 'Rows',
      'end.road': 'Run over after {n} rows.',
      'end.train': 'Hit by a train after {n} rows.',
      'end.water': 'Fell in the river after {n} rows.',
      'end.edge': 'Swept away after {n} rows.',
      'end.hawk': 'The hawk got you after {n} rows.',
    },
    es: {
      title: 'Cruce sin fin',
      'menu.subtitle':
        'Carreteras, ríos, vías y prados que no se acaban. Sigue saltando: el halcón vigila.',
      'hud.rows': 'Filas',
      'end.road': 'Atropellado tras {n} filas.',
      'end.train': 'Arrollado por un tren tras {n} filas.',
      'end.water': 'Caíste al río tras {n} filas.',
      'end.edge': 'Arrastrado por la corriente tras {n} filas.',
      'end.hawk': 'Te atrapó el halcón tras {n} filas.',
    },
  },
});
