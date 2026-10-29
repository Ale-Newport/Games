import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { chaseMove, lightsActions, solverMove } from '../ai';
import { lightsEnv } from '../ai-adapter';
import {
  SPECS,
  isValidLightsState,
  newLights,
  press,
  pressCell,
  solveLights,
  toggled,
  undoPress,
} from '../engine';

describe('Lights Out', () => {
  it('toggles plus and cross neighbourhoods', () => {
    expect(toggled(5, 'plus', 0).sort((a, b) => a - b)).toEqual([0, 1, 5]);
    expect(toggled(5, 'plus', 12)).toHaveLength(5);
    expect(toggled(5, 'cross', 12).sort((a, b) => a - b)).toEqual([6, 8, 12, 16, 18]);
  });

  it('solves the all-on 5×5 board in the known minimum of 15 presses', () => {
    const plan = solveLights(Array(25).fill(true), 5, 'plus')!;
    expect(plan).toHaveLength(15);
    let l: boolean[] = Array(25).fill(true);
    for (const c of plan) l = press(l, 5, 'plus', c);
    expect(l.some(Boolean)).toBe(false);
  });

  it('knows unsolvable 5×5 boards (a single light in a corner)', () => {
    const l = Array(25).fill(false);
    l[0] = true;
    expect(solveLights(l, 5, 'plus')).toBeNull();
  });

  it('scrambles solvable boards and reaches the optimum by following the solver', () => {
    for (const level of Object.keys(SPECS)) {
      let s = newLights(level, 3);
      expect(s.lights.some(Boolean)).toBe(true);
      while (!s.solved) s = pressCell(s, Number(solverMove(s).slice(2)));
      expect(s.presses).toHaveLength(s.optimal);
    }
  });

  it('light chasing finishes, undo reverses a press, saves validate', () => {
    let s = newLights('classic', 8);
    for (let i = 0; i < 60 && !s.solved; i++) s = pressCell(s, Number(chaseMove(s).slice(2)));
    expect(s.solved).toBe(true);
    const t = pressCell(newLights('classic', 8), 4);
    expect(undoPress(t).lights).toEqual(t.start);
    expect(isValidLightsState(t)).toBe(true);
    expect(isValidLightsState({ ...t, lights: t.start })).toBe(false);
    expect(isValidLightsState({ ...t, optimal: t.optimal + 1 })).toBe(false);
  });
});

describeAdapterContract(lightsEnv, {
  configs: [undefined, { level: 'diagonal' }],
  playouts: 4,
  maxSteps: 130,
  illegalActions: (s) => ['p:99', 'p:-1', 'x'].filter((a) => !lightsActions(s).includes(a)),
});
