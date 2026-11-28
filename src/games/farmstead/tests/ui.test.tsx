// @vitest-environment jsdom
import { act as rtlAct, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Rng } from '../../../core/game-engine/random';
import { decide } from '../ai';
import { currentPlayer, newFarm, type Action, type Farm } from '../engine';
import { Game } from '../Game';
import { IMPROVEMENTS, SPACES, spaceIndex } from '../world';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const settle = async (ms: number) => {
  await rtlAct(async () => {
    vi.advanceTimersByTime(ms);
  });
};
const click = (id: string) => fireEvent.click(screen.getByTestId(id));
const savedState = (s: ReturnType<typeof createTestServices>) =>
  (s.getSaved() as { state: Farm | null } | undefined)?.state ?? null;

/** Makes a move the way a player would: the action spaces, the mode buttons, the farm. */
function perform(a: Action) {
  switch (a.t) {
    case 'place':
      return click(`fs-space-${SPACES[a.space]!.id}`);
    case 'room':
    case 'stable':
      click(`fs-mode-${a.t}`);
      return click(`fs-cell-${a.cell}`);
    case 'plough':
    case 'pasture':
      return click(`fs-cell-${a.cell}`);
    case 'sow':
      click(`fs-crop-${a.crop}`);
      return click(`fs-cell-${a.cell}`);
    case 'bake':
      return click(`fs-bake-${a.n}`);
    case 'improve':
      return click(`fs-imp-${IMPROVEMENTS[a.imp]!.id}`);
    case 'done':
      return click('fs-done');
  }
}

describe('Farmstead UI', () => {
  it('plays past the first harvest against farmhands through the table', async () => {
    vi.useFakeTimers();
    const svc = createTestServices({ launchParams: { deal: '4' } });
    render(<Game services={svc.services} />);
    await settle(0);
    click('fs-count-2');
    click('fs-level-farmhand');
    click('fs-start');
    await settle(10);
    const rng = new Rng(3);
    const kinds = new Set<string>();
    for (let i = 0; i < 2000; i++) {
      const g = savedState(svc)!;
      if (g.round >= 5 || g.phase === 'over') break;
      if (currentPlayer(g) === 0) {
        const a = decide(g, 'farmhand', rng);
        perform(a);
        kinds.add(a.t);
        expect(savedState(svc)).not.toEqual(g);
      }
      await settle(700);
    }
    const g = savedState(svc)!;
    expect(g.round).toBeGreaterThanOrEqual(5);
    expect(g.log.some((e) => e.k === 'harvest')).toBe(true);
    expect([...kinds]).toContain('place');
    expect(screen.getByTestId('fs-round').textContent).toMatch(/Round 5 of 12/);
  }, 120_000);

  it('building a room and a stable by clicking the farm, then resume', async () => {
    vi.useFakeTimers();
    const g = newFarm(2, 4);
    g.ps[0]!.goods.timber = 9;
    g.ps[0]!.goods.reed = 2;
    const first = createTestServices(
      {},
      { state: g, level: 'humans', record: { played: 0, won: 0, best: 0 } },
    );
    const view = render(<Game services={first.services} />);
    await settle(0);
    click('fs-resume');
    await settle(10);
    expect(screen.getByTestId('fs-prompt').textContent).toMatch(/Farm 1: place a family member/);
    click('fs-space-builder');
    expect(screen.getByTestId('fs-prompt').textContent).toMatch(/Build rooms and stables/);
    // Only cells next to a room can take a room.
    expect(screen.getByTestId('fs-cell-0').getAttribute('data-target')).toBe('true');
    expect(screen.getByTestId('fs-cell-4').getAttribute('data-target')).toBe('false');
    click('fs-cell-0');
    click('fs-mode-stable');
    click('fs-cell-4');
    const after = savedState(first)!;
    expect(after.ps[0]!.cells[0]!.kind).toBe('room');
    expect(after.ps[0]!.cells[4]!.stable).toBe(true);
    expect(after.ps[0]!.goods.timber).toBe(2);
    click('fs-done');
    expect(savedState(first)!.turn).toBe(1);
    expect(screen.getByTestId('fs-log').textContent).toMatch(/Farm 1 built a stable/);
    view.unmount();
    const again = createTestServices({}, first.getSaved());
    render(<Game services={again.services} />);
    await settle(0);
    click('fs-resume');
    await settle(10);
    expect(screen.getByTestId('fs-prompt').textContent).toMatch(/Farm 2: place/);
    expect(screen.getByTestId(`fs-space-builder`).textContent).toMatch(/taken by Farm 1/);
    expect(spaceIndex('builder')).toBeGreaterThan(0);
  });
});
