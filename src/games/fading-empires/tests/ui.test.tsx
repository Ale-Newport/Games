// @vitest-environment jsdom
import { act as rtlAct, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Rng } from '../../../core/game-engine/random';
import { decide } from '../ai';
import { type Action, type Fading } from '../engine';
import { Game } from '../Game';

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
  (s.getSaved() as { state: Fading | null } | undefined)?.state ?? null;

/** Makes a move the way a player would: the panel's buttons and the valley's regions. */
function perform(a: Action) {
  switch (a.t) {
    case 'pick':
      return click(`fe-pick-${a.i}`);
    case 'march':
    case 'decline':
    case 'stop':
    case 'done':
      return click(`fe-${a.t}`);
    case 'take':
      return click(`fe-region-${a.r}`);
    case 'gamble':
      click(`fe-region-${a.r}`);
      return click('fe-gamble');
    case 'abandon':
      click(`fe-region-${a.r}`);
      return click('fe-abandon');
    case 'place':
      click('fe-amount-1');
      return click(`fe-region-${a.r}`);
  }
}

describe('Fading Empires UI', () => {
  it('plays a whole game against raiders through the table', async () => {
    vi.useFakeTimers();
    const svc = createTestServices({ launchParams: { deal: '6' } });
    render(<Game services={svc.services} />);
    await settle(0);
    click('fe-level-raider');
    click('fe-count-3');
    click('fe-start');
    await settle(10);
    const rng = new Rng(2);
    const kinds = new Set<string>();
    for (let i = 0; i < 20_000 && !screen.queryByTestId('fe-over'); i++) {
      const g = savedState(svc);
      if (g && g.phase.k !== 'over' && g.turn === 0) {
        const a = decide(g, 'warlord', rng);
        perform(a);
        kinds.add(a.t);
        expect(savedState(svc)).not.toEqual(g);
      }
      await settle(500);
    }
    expect(screen.getByTestId('fe-over')).toBeTruthy();
    expect([...kinds]).toEqual(
      expect.arrayContaining(['pick', 'take', 'place', 'done', 'march', 'decline']),
    );
    expect(svc.calls.results).toHaveLength(1);
    const saved = svc.getSaved() as { state: Fading | null; record: { played: number } };
    expect(saved.state).toBeNull();
    expect(saved.record.played).toBe(1);
  }, 120_000);

  it('costs on the map, all bands in one click, keyboard end of turn, resume', async () => {
    vi.useFakeTimers();
    const first = createTestServices({ launchParams: { deal: '6' } });
    const view = render(<Game services={first.services} />);
    await settle(0);
    click('fe-level-humans');
    click('fe-count-2');
    click('fe-start');
    await settle(10);
    click('fe-pick-0');
    let g = savedState(first)!;
    const hand = g.ps[0]!.hand;
    // Edge regions are offered with their cost.
    const offered = [...document.querySelectorAll('[data-target="true"]')];
    expect(offered.length).toBeGreaterThan(8);
    const r = Number(offered[0]!.getAttribute('data-testid')!.split('-').at(-1));
    fireEvent.click(offered[0]!);
    g = savedState(first)!;
    expect(g.holds[r]).toEqual({ p: 0, declined: false });
    click('fe-stop');
    click('fe-amount-0');
    click(`fe-region-${r}`);
    g = savedState(first)!;
    expect(g.bands[r]).toBe(hand);
    const earn = Number(/\+(\d+) coins/.exec(screen.getByTestId('fe-done').textContent!)![1]);
    expect(earn).toBeGreaterThanOrEqual(1);
    fireEvent.keyDown(window, { key: 'e' });
    expect(savedState(first)!.turn).toBe(1);
    expect(savedState(first)!.ps[0]!.coins).toBe(g.ps[0]!.coins + earn);
    view.unmount();
    const again = createTestServices({}, first.getSaved());
    render(<Game services={again.services} />);
    await settle(0);
    click('fe-resume');
    await settle(10);
    expect(screen.getByTestId(`fe-region-${r}`).getAttribute('data-owner')).toBe('0');
    expect(screen.getByTestId('fe-prompt').textContent).toMatch(/Pick a people/);
  });
});
