import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { Rng } from '../../../core/game-engine/random';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { defaultSetup, matchSaveSpec, newMatch } from '../../shared/two-player/match';
import { AGENT_PRESETS } from '../ai';
import { dotsEnv } from '../ai-adapter';
import { lineName } from '../DotsBoard';
import {
  BOX_LINES,
  LINES,
  LINE_BOXES,
  applyDotsAction,
  createDotsState,
  hLine,
  legalDotsActions,
  vLine,
  type DotsState,
} from '../engine';
import { DOTS } from '../Game';
import { DotsSearchAgent } from '../search';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();
const play = (moves: number[]) => moves.reduce((s, a) => applyDotsAction(s, a), createDotsState());

describeAdapterContract(dotsEnv, {
  configs: [undefined],
  playouts: 20,
  maxSteps: 60,
  illegalActions: (s) => [-1, 40, 1.5, NaN].concat(s.history.slice(0, 1)),
});

describe('Dots and Boxes rules', () => {
  it('has 40 lines and four per box; inner lines border two boxes', () => {
    expect(LINES).toBe(40);
    expect(BOX_LINES[0]).toEqual([hLine(0, 0), hLine(1, 0), vLine(0, 0), vLine(0, 1)]);
    expect(LINE_BOXES[hLine(0, 0)]).toEqual([0]);
    expect(LINE_BOXES[vLine(1, 2)]).toEqual([5, 6]);
    expect(lineName(hLine(0, 0))).toBe('a5–b5');
    expect(lineName(vLine(3, 4))).toBe('e2–e1');
  });

  it('closing a box scores and gives the same player another line', () => {
    // Orange: top, Blue: left, Orange: right, Blue: bottom closes box 0.
    const s = play([hLine(0, 0), vLine(0, 0), vLine(0, 1), hLine(1, 0)]);
    expect(s.boxes[0]).toBe(1);
    expect(s.scores).toEqual([0, 1]);
    expect(s.toMove).toBe(1);
    expect(s.movers).toEqual([0, 1, 0, 1]);
    expect(DOTS.match.rules.moverOfPly(s, 3)).toBe(1);
  });

  it('closes two boxes with one line and ends with the box count', () => {
    const shared = vLine(0, 1);
    const others = [...BOX_LINES[0]!, ...BOX_LINES[1]!].filter((l) => l !== shared);
    const s = play([...others, shared]);
    const closer = s.movers[s.movers.length - 1]!;
    expect(s.scores[closer]).toBe(2);
    // Play the rest out: every game ends with all 16 boxes claimed.
    let end = s;
    const rng = new Rng(4);
    while (!end.result) end = applyDotsAction(end, rng.pick(legalDotsActions(end)));
    expect(end.scores[0] + end.scores[1]).toBe(16);
  });

  it('the search double-deals at the end of a chain to keep control', () => {
    // Top row: a 4-box chain, opened on the left (box 0 can be taken). Rows 2–4: one 12-box snake
    // chain. Taking all four would force Orange to open the snake (4–12); taking two and handing the
    // last two over keeps control and wins the snake (14–2).
    const open = [
      ...[1, 2, 3, 4].map((c) => vLine(0, c)),
      vLine(1, 0),
      vLine(1, 1),
      vLine(1, 2),
      vLine(1, 3),
      hLine(2, 3),
      vLine(2, 3),
      vLine(2, 2),
      vLine(2, 1),
      hLine(3, 0),
      vLine(3, 1),
      vLine(3, 2),
      vLine(3, 3),
      vLine(3, 4),
    ];
    let s: DotsState = {
      ...createDotsState(),
      lines: Array.from({ length: LINES }, (_, l) => (open.includes(l) ? 0 : 2)),
    };
    const agent = new DotsSearchAgent('t', 't', { maxDepth: 60 });
    const ctx = { rng: new Rng(1) };
    while (s.toMove === 0 && !s.result)
      s = applyDotsAction(s, agent.selectAction(dotsEnv, s, 0, ctx));
    expect(s.scores).toEqual([2, 0]);
    // Its last decision (the double-deal): hand two boxes over, then collect the 12-box snake.
    expect(agent.lastStats?.value).toBe(10);
  });

  it('levels are ordered by strength (seeded)', () => {
    const easy = evaluateAgents(dotsEnv, preset('easy'), preset('random'), {
      games: 6,
      seed: 5,
      maxSteps: 60,
    }).agents[0];
    expect(easy.wins).toBeGreaterThanOrEqual(5);
    const medium = evaluateAgents(dotsEnv, preset('medium'), preset('easy'), {
      games: 6,
      seed: 5,
      maxSteps: 60,
    }).agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses);
  }, 120_000);

  it('round-trips saves and rejects tampered games', () => {
    const cfg = DOTS.match;
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const played = { ...m, round: applyDotsAction(m.round, 5) };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    const scores: [number, number] = [1, 0];
    expect(unwrap(spec, wrap(spec, { ...played, round: { ...played.round, scores } })).ok).toBe(
      false,
    );
  });
});
