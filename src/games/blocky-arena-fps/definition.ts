/** The simulation side for the AI environment and the menu options. */
import type { ArcadeSim } from '../shared/arcade/environment';
import type { Level, Match } from './sim';
import {
  ACTIONS,
  actionInput,
  isMatch,
  newMatch,
  place,
  stepMatch,
  think,
  toAction,
  won,
} from './sim';
import type { Loadout } from './weapons';

export const OPTIONS = [
  { id: 'map', label: 'menu.map', values: ['courtyard', 'docks'], initial: 'courtyard' },
  { id: 'loadout', label: 'menu.loadout', values: ['rifleman', 'marksman'], initial: 'rifleman' },
  { id: 'bots', label: 'menu.bots', values: ['3', '5', '7'], initial: '5' },
  { id: 'level', label: 'menu.level', values: ['easy', 'normal', 'hard'], initial: 'normal' },
  { id: 'length', label: 'menu.length', values: ['short', 'long'], initial: 'short' },
];

export function create(seed: number, o: Record<string, string>): Match {
  const long = o.length === 'long';
  return newMatch(seed, {
    map: o.map ?? 'courtyard',
    loadout: (o.loadout ?? 'rifleman') as Loadout,
    bots: Number(o.bots ?? 5),
    level: (o.level ?? 'normal') as Level,
    goal: long ? 25 : 15,
    minutes: long ? 6 : 3,
  });
}

export const SIM: ArcadeSim<Match, string> = {
  id: 'blocky-arena-fps',
  hz: 60,
  actions: ACTIONS,
  options: OPTIONS,
  init: create,
  step: (m, a) => stepMatch(m, actionInput(a)),
  over: (m) => m.over,
  score: (m) => m.fighters[0]!.kills,
  result: (m, o) => ({
    outcome: won(m) ? 'win' : place(m) === 1 ? 'draw' : 'loss',
    score: m.fighters[0]!.kills,
    mode: `${o.map ?? 'courtyard'}-${o.level ?? 'normal'}`,
  }),
  validate: isMatch,
  policies: { soldier: (m) => toAction(think(m, 0, 'hard')[0]) },
};
