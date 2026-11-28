// @vitest-environment jsdom
import { act as rtlAct, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Rng } from '../../../core/game-engine/random';
import { decide } from '../ai';
import { currentPlayer, homeOf, newIron, type Action, type Iron } from '../engine';
import { Game } from '../Game';
import { ADJ, FACTIONS } from '../world';

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
  (s.getSaved() as { state: Iron | null } | undefined)?.state ?? null;

/** Makes a move the way a player would: the sections, the map, the panels. */
function perform(g: Iron, a: Action) {
  switch (a.t) {
    case 'section':
      return click(`if-section-${a.i}`);
    case 'move': {
      const u = g.units.find((x) => x.id === a.unit)!;
      click(`if-space-${u.at}`);
      click(`if-unit-${u.id}`);
      return click(`if-space-${a.to}`);
    }
    case 'produce':
    case 'deploy':
      return click(`if-space-${a.hex}`);
    case 'build':
      click(`if-kind-${a.kind}`);
      return click(`if-space-${a.hex}`);
    case 'trade':
      return click(`if-trade-${a.a}-${a.b}`);
    case 'upgrade':
      return click(`if-upgrade-${a.top}-${a.bottom}`);
    case 'enlist':
      return click(`if-enlist-${a.recruit}`);
    case 'bid':
      return click(`if-bid-${a.n}`);
    case 'option':
      return click(`if-option-${a.k}`);
    case 'coin':
      return click('if-coin');
    case 'done':
      return click('if-done');
  }
}

describe('Iron Fields UI', () => {
  it('plays six turns against recruits through the table', async () => {
    vi.useFakeTimers();
    const svc = createTestServices({ launchParams: { deal: '4' } });
    render(<Game services={svc.services} />);
    await settle(0);
    click('if-count-2');
    click('if-level-recruit');
    click('if-faction-thorn');
    click('if-start');
    await settle(10);
    expect(FACTIONS[savedState(svc)!.ps[0]!.faction]!.id).toBe('thorn');
    const rng = new Rng(3);
    const kinds = new Set<string>();
    for (let i = 0; i < 1500; i++) {
      const g = savedState(svc)!;
      if (g.ps[0]!.turns >= 6 || g.phase === 'over') break;
      if (currentPlayer(g) === 0) {
        const a = decide(g, 'recruit', rng);
        perform(g, a);
        kinds.add(a.t);
        expect(savedState(svc)).not.toEqual(g);
      }
      await settle(500);
    }
    const g = savedState(svc)!;
    expect(g.ps[0]!.turns).toBeGreaterThanOrEqual(6);
    expect([...kinds]).toContain('section');
    expect(screen.getByTestId('if-turns').textContent).toMatch(/Turn \d+ of 30/);
  }, 120_000);

  it('moving by clicking the map, the bottom action, then resume', async () => {
    vi.useFakeTimers();
    const g = newIron(2, 4);
    const first = createTestServices(
      {},
      { state: g, level: 'humans', record: { played: 0, won: 0, best: 0 } },
    );
    const view = render(<Game services={first.services} />);
    await settle(0);
    click('if-resume');
    await settle(10);
    expect(screen.getByTestId('if-prompt').textContent).toMatch(/choose a section/);
    click('if-section-0');
    const home = homeOf(g, 0);
    click(`if-space-${home}`);
    const ch = g.units.find((u) => u.kind === 'char' && u.owner === 0)!;
    expect(screen.getByTestId(`if-unit-${ch.id}`).getAttribute('aria-pressed')).toBe('true');
    const to = ADJ[home]!.find(
      (s) => screen.getByTestId(`if-space-${s}`).getAttribute('data-target') === 'true',
    )!;
    click(`if-space-${to}`);
    expect(savedState(first)!.units.find((u) => u.id === ch.id)!.at).toBe(to);
    click('if-done');
    // Then the bottom action (or the next player if it cannot be paid).
    const after = savedState(first)!;
    if (after.turn === 0) click('if-done');
    expect(savedState(first)!.turn).toBe(1);
    view.unmount();
    const again = createTestServices({}, first.getSaved());
    render(<Game services={again.services} />);
    await settle(0);
    click('if-resume');
    await settle(10);
    expect(screen.getByTestId('if-log').textContent).toMatch(/moved a character/);
  });
});
