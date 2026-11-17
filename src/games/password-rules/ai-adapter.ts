/**
 * The AI environment: one game per episode, with a fixed clock (2026-01-01 12:00) so episodes are
 * reproducible. The password has a cursor. Actions: type a character at the cursor (`t:X`), delete
 * before it (`del`), move it (`left`, `right`, `home`, `end`), format the character before it
 * (`bold`, `italic`, `font:F`, `size:N`), let a second pass (`tick`), ask for a new captcha or
 * colour (`captcha`, `colour`) and confirm the final retype (`confirm`). Reward: rules met, plus one for winning. Episodes stop after 2,000 actions.
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
import {
  BUG,
  CHICKEN,
  charOf,
  confirm,
  edit,
  EGG,
  FIRE,
  FONTS,
  isPw,
  metCount,
  MOONS,
  newCaptcha,
  newColour,
  newPw,
  plain,
  SIZES,
  STRONG,
  tick,
  type Clock,
  type PChar,
  type Pw,
} from './rules';
import { RULES_VERSION, RULESET_ID } from './rules-meta';
import { solution, styled } from './solver';

export interface Session {
  pw: Pw;
  cursor: number;
  steps: number;
}

export const ENV_CLOCK: Clock = { y: 2026, mo: 1, d: 1, h: 12, mi: 0 };
const LIMIT = 2000;
const TYPEABLE = [
  ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 !:#',
  EGG,
  CHICKEN,
  BUG,
  STRONG,
  ...MOONS,
];
export const ACTIONS: string[] = [
  ...TYPEABLE.map((c) => `t:${c}`),
  'del',
  'left',
  'right',
  'home',
  'end',
  'bold',
  'italic',
  ...FONTS.map((f) => `font:${f}`),
  ...SIZES.map((n) => `size:${n}`),
  'tick',
  'captcha',
  'colour',
  'confirm',
];

const done = (s: Session) => s.pw.won || s.pw.lost !== null || s.steps >= LIMIT;

export function applySession(s: Session, a: string): Session {
  const { pw } = s;
  const step = { ...s, steps: s.steps + 1 };
  const restyle = (f: (c: PChar) => PChar) => {
    if (s.cursor === 0) return step;
    const chars = pw.chars.map((c, i) => (i === s.cursor - 1 ? f(c) : c));
    return { ...step, pw: edit(pw, chars) };
  };
  if (a.startsWith('t:')) {
    const chars = [...pw.chars.slice(0, s.cursor), charOf(a.slice(2)), ...pw.chars.slice(s.cursor)];
    return { ...step, pw: edit(pw, chars), cursor: s.cursor + 1 };
  }
  if (a === 'del') {
    if (s.cursor === 0) return step;
    const chars = pw.chars.filter((_, i) => i !== s.cursor - 1);
    return { ...step, pw: edit(pw, chars), cursor: s.cursor - 1 };
  }
  if (a === 'left') return { ...step, cursor: Math.max(0, s.cursor - 1) };
  if (a === 'right') return { ...step, cursor: Math.min(pw.chars.length, s.cursor + 1) };
  if (a === 'home') return { ...step, cursor: 0 };
  if (a === 'end') return { ...step, cursor: pw.chars.length };
  if (a === 'bold') return restyle((c) => ({ ...c, b: !c.b }));
  if (a === 'italic') return restyle((c) => ({ ...c, i: !c.i }));
  if (a.startsWith('font:')) return restyle((c) => ({ ...c, f: a.slice(5) as PChar['f'] }));
  if (a.startsWith('size:')) return restyle((c) => ({ ...c, s: Number(a.slice(5)) }));
  if (a === 'captcha') return { ...step, pw: newCaptcha(pw) };
  if (a === 'colour') return { ...step, pw: newColour(pw) };
  if (a === 'tick') {
    const next = tick(pw, ENV_CLOCK);
    return { ...step, pw: next, cursor: Math.min(s.cursor, next.chars.length) };
  }
  return { ...step, pw: confirm(pw, plain(pw)) };
}

function outcome(s: Session): Outcome | null {
  if (!done(s)) return null;
  const r = metCount(s.pw) + (s.pw.won ? 1 : 0);
  return {
    returns: [r],
    winners: s.pw.won ? [0] : [],
    draw: false,
    scores: [metCount(s.pw)],
    reason: s.pw.won ? 'won' : (s.pw.lost ?? 'limit'),
  };
}

export const env: GameEnvironment<Session, string, Session, Record<string, never>> = {
  id: 'password-rules',
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
  createInitialState: (_c, seed) => ({ pw: newPw(seed >>> 0, ENV_CLOCK), cursor: 0, steps: 0 }),
  reset: (seed) => ({ pw: newPw(seed >>> 0, ENV_CLOCK), cursor: 0, steps: 0 }),
  getObservation: (s) => s,
  getLegalActions: (s) =>
    done(s) ? [] : s.pw.final ? ACTIONS : ACTIONS.filter((a) => a !== 'confirm'),
  applyAction: (s, a) => {
    if (done(s) || !ACTIONS.includes(a) || (a === 'confirm' && !s.pw.final))
      throw new IllegalActionError(`Illegal action ${a}`);
    return applySession(s, a);
  },
  getCurrentPlayer: (s) => (done(s) ? NO_PLAYER : 0),
  isTerminal: done,
  getOutcome: outcome,
  getReward: (s) => outcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed = JSON.parse(data) as Session;
    if (!parsed || !isPw(parsed.pw) || typeof parsed.cursor !== 'number')
      throw new Error('Invalid Password Rules session');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a,
};

const same = (a: PChar | undefined, b: PChar | undefined) =>
  !!a && !!b && a.c === b.c && a.b === b.b && a.i === b.i && a.f === b.f && a.s === b.s;

/** Edits the password towards the constructive solution, fixing fire damage in place. */
export function solverAction(s: Session): string {
  const { pw } = s;
  if (pw.final) return 'confirm';
  if (pw.chars.some((c) => c.c === FIRE)) {
    const at = pw.chars.findIndex((c) => c.c === FIRE);
    if (s.cursor !== at + 1) return s.cursor < at + 1 ? 'right' : 'left';
    return 'del';
  }
  const text = solution(pw, pw.paul === 'chicken' ? CHICKEN : EGG);
  // When the digits cannot add up, ask for another colour or captcha.
  if (!text) return s.steps % 2 ? 'captcha' : 'colour';
  const target = styled(text);
  const cur = pw.chars;
  let k = 0;
  while (k < cur.length && k < target.length && same(cur[k], target[k])) k++;
  if (k === cur.length && k === target.length) return 'tick';
  const moveTo = (pos: number) => (s.cursor < pos ? 'right' : 'left');
  // A character only needs formatting.
  if (k < cur.length && k < target.length && cur[k]!.c === target[k]!.c) {
    if (s.cursor !== k + 1) return moveTo(k + 1);
    const want = target[k]!;
    const have = cur[k]!;
    if (have.b !== want.b) return 'bold';
    if (have.i !== want.i) return 'italic';
    if (have.f !== want.f) return `font:${want.f}`;
    return `size:${want.s}`;
  }
  // A character is missing here: insert it (then it gets formatted).
  const missing = cur.slice(k).every((c, j) => target[k + 1 + j]?.c === c.c);
  if (k < target.length && missing) {
    if (s.cursor !== k) return moveTo(k);
    return `t:${target[k]!.c}`;
  }
  // Otherwise remove the character in the way (never Paul, unless he is the extra one).
  if (s.cursor !== k + 1) return moveTo(k + 1);
  return 'del';
}

class Solver implements Agent<Session, string> {
  readonly id = 'solver';
  readonly label = 'Constructive solver';
  selectAction(
    _e: GameEnvironment<Session, string>,
    s: Session,
    _p: number,
    _ctx: DecisionContext,
  ) {
    return solverAction(s);
  }
}

export const AGENT_PRESETS: AgentPreset<Session, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Random keys and formatting.', es: 'Teclas y formato al azar.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'solver',
    kind: 'heuristic',
    label: { en: 'Constructive solver', es: 'Solucionador constructivo' },
    description: {
      en: 'Builds a password that meets every rule for this deal and types it, putting out the fire and keeping Paul safe.',
      es: 'Construye una contraseña que cumple todas las reglas de esta partida y la escribe, apagando el fuego y cuidando a Paul.',
    },
    create: () => new Solver(),
  },
];

export const bundle: AiBundle<Session, string> = {
  env: env as unknown as AiBundle<Session, string>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
