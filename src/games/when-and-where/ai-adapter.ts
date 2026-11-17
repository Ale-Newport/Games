/**
 * The AI environment: five scenes per episode. The observation is what the picture shows — the
 * scene's clues and its era cues, never the place or year. Each round takes two actions: a pin on
 * a 15° grid (`at:LAT:LON`) and a decade (`year:Y`). Reward: total points / 10,000.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext } from '../../ai/agents/types';
import type { AgentPreset, AiBundle } from '../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { currentScene, finished, isPlay, newPlay, submit, total, type Play } from './engine';
import { eraOf, VEHICLE_YEARS, type EraCues } from './era';
import { RULES_VERSION, RULESET_ID } from './rules-meta';
import type { Scene } from './scenes';

export interface Round {
  play: Play;
  /** The pin chosen this round, waiting for a year. */
  pin: [number, number] | null;
}

const PINS: string[] = [];
for (let lat = -45; lat <= 60; lat += 15)
  for (let lon = -180; lon < 180; lon += 15) PINS.push(`at:${lat}:${lon}`);
const YEARS: string[] = [];
for (let y = 1850; y <= 2020; y += 10) YEARS.push(`year:${y + 5}`);

export const clueActions = (r: Round) => (finished(r.play) ? [] : r.pin ? YEARS : PINS);

/** The clues on screen. */
export function clues(
  r: Round,
): (Omit<Scene, 'id' | 'en' | 'es' | 'lat' | 'lon' | 'year' | 'iso2'> & { era: EraCues }) | null {
  const s = currentScene(r.play);
  if (!s) return null;
  const { id: _i, en: _e, es: _s, lat: _la, lon: _lo, year, iso2: _c, ...rest } = s;
  return { ...rest, era: eraOf(year) };
}

function outcome(r: Round): Outcome | null {
  if (!finished(r.play)) return null;
  const n = total(r.play);
  return { returns: [n / 10000], winners: [0], draw: false, scores: [n], reason: 'rounds' };
}

export const env: GameEnvironment<Round, string, unknown, Record<string, never>> = {
  id: 'when-and-where',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'puzzle',
    minPlayers: 1,
    maxPlayers: 1,
    stochastic: false,
    hiddenInformation: true,
    zeroSum: false,
  },
  createInitialState: (_c, seed) => ({ play: newPlay(seed, 0), pin: null }),
  reset: (seed) => ({ play: newPlay(seed, 0), pin: null }),
  getObservation: (r) => ({ round: r.play.results.length, pin: r.pin, clues: clues(r) }),
  getLegalActions: clueActions,
  applyAction: (r, a) => {
    if (!clueActions(r).includes(a)) throw new IllegalActionError(`Illegal action ${a}`);
    const parts = a.split(':');
    if (parts[0] === 'at') return { ...r, pin: [Number(parts[1]), Number(parts[2])] };
    return {
      play: submit(r.play, { lat: r.pin![0], lon: r.pin![1], year: Number(parts[1]) }),
      pin: null,
    };
  },
  getCurrentPlayer: (r) => (finished(r.play) ? NO_PLAYER : 0),
  isTerminal: (r) => finished(r.play),
  getOutcome: outcome,
  getReward: (r) => outcome(r)?.returns[0] ?? 0,
  serializeState: (r) => JSON.stringify(r),
  deserializeState: (data) => {
    const r = JSON.parse(data) as Round;
    if (!r || !isPlay(r.play)) throw new Error('Invalid When & Where state');
    return r;
  },
  cloneState: (r) => structuredClone(r),
  actionToString: (a) => a,
};

/** Where each script (and some clues) usually points. */
const SCRIPT_PLACE: Record<Scene['script'], [number, number]> = {
  latin: [45, 0],
  cyrillic: [55, 37],
  arabic: [28, 32],
  han: [30, 114],
  japanese: [35, 137],
  korean: [37, 127],
  thai: [14, 100],
  devanagari: [20, 77],
  greek: [38, 23],
  hebrew: [31, 35],
};

/** Reads the clues like a player: script and climate for the place, vehicles for the decade. */
export function clueAction(r: Round): string {
  const c = clues(r);
  if (!c) return clueActions(r)[0]!;
  if (r.pin) {
    const [a, b] = VEHICLE_YEARS[c.era.vehicle];
    const mid =
      c.extras.includes('classic-cars') && c.era.vehicle === 'rounded' ? 1955 : (a + b) / 2;
    const decade = Math.max(1850, Math.min(2020, Math.floor(mid / 10) * 10));
    return `year:${decade + 5}`;
  }
  let [lat, lon] = SCRIPT_PLACE[c.script];
  if (c.script === 'latin') {
    if (c.climate === 'tropical') [lat, lon] = c.style === 'colonial' ? [20, -80] : [-20, -45];
    else if (c.climate === 'desert' || c.landmark === 'table-mountain') [lat, lon] = [-30, 20];
    else if (c.style === 'towers' && c.extras.includes('yellow-cabs')) [lat, lon] = [40, -75];
    else if (c.style === 'towers') [lat, lon] = c.hills === 'sea' ? [-30, 150] : [45, -80];
    else if (c.climate === 'cold') [lat, lon] = [60, -20];
    else if (c.style === 'colonial' && c.hills === 'mountains') [lat, lon] = [15, -100];
  }
  const snap = (v: number, lo: number, hi: number) =>
    Math.max(lo, Math.min(hi, Math.round(v / 15) * 15));
  return `at:${snap(lat, -45, 60)}:${snap(lon, -180, 165)}`;
}

class ClueReader implements Agent<Round, string> {
  readonly id = 'clue-reader';
  readonly label = 'Clue reader';
  selectAction(_e: GameEnvironment<Round, string>, r: Round, _p: number, _c: DecisionContext) {
    return clueAction(r);
  }
}

export const AGENT_PRESETS: AgentPreset<Round, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: {
      en: 'Pins anywhere, picks any decade.',
      es: 'Marca cualquier sitio y cualquier década.',
    },
    create: () => new RandomAgent(),
  },
  {
    id: 'clue-reader',
    kind: 'heuristic',
    label: { en: 'Clue reader', es: 'Lector de pistas' },
    description: {
      en: 'Reads the script, climate and skyline for the place and the vehicles for the decade.',
      es: 'Lee la escritura, el clima y el perfil urbano para el lugar, y los vehículos para la década.',
    },
    create: () => new ClueReader(),
  },
];

export const bundle: AiBundle<Round, string> = {
  env: env as unknown as AiBundle<Round, string>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
