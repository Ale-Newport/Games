// @vitest-environment jsdom
import { act as rtlAct, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Rng } from '../../../core/game-engine/random';
import { decide } from '../ai';
import { owned, type Action, type WarGame } from '../engine';
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
const isSelected = (t: number) => screen.getByTestId(`wc-terr-${t}`).dataset.selected === 'true';
const range = (id: string, n: number) =>
  fireEvent.change(screen.getByTestId(`wc-${id}-range`), { target: { value: String(n) } });

/** Makes a move the way a player would: territory clicks, the dice and the move sliders. */
function perform(a: Action) {
  switch (a.t) {
    case 'place':
      return click(`wc-terr-${a.at}`);
    case 'trade':
      return click(`wc-trade-${a.cards.join('-')}`);
    case 'attack':
      click(`wc-dice-${a.dice}`);
      if (!isSelected(a.from)) click(`wc-terr-${a.from}`);
      return click(`wc-terr-${a.to}`);
    case 'advance':
      range('advance', a.n);
      return click('wc-advance-go');
    case 'endAttack':
      return click('wc-end-attack');
    case 'fortify':
      click(`wc-terr-${a.from}`);
      range('fortify', a.n);
      return click(`wc-terr-${a.to}`);
    case 'end':
      return click('wc-end');
  }
}

const savedState = (s: ReturnType<typeof createTestServices>) =>
  (s.getSaved() as { state: WarGame | null } | undefined)?.state ?? null;

describe('World Conquest UI', () => {
  it('plays a whole three-player game against generals through the table', async () => {
    vi.useFakeTimers();
    const svc = createTestServices({ launchParams: { deal: '11' } });
    render(<Game services={svc.services} />);
    await settle(0);
    click('wc-level-general');
    click('wc-count-3');
    click('wc-start');
    await settle(10);
    const rng = new Rng(5);
    let mine = 0;
    for (let i = 0; i < 20_000 && !screen.queryByTestId('wc-over'); i++) {
      const g = savedState(svc);
      if (g && g.phase.k !== 'over' && g.turn === 0) {
        const a = decide(g, 'marshal', rng);
        perform(a);
        mine++;
        expect(savedState(svc)).not.toEqual(g);
      }
      await settle(400);
    }
    expect(screen.getByTestId('wc-over')).toBeTruthy();
    expect(mine).toBeGreaterThan(40);
    expect(svc.calls.results).toHaveLength(1);
    const saved = svc.getSaved() as { state: WarGame | null; record: { played: number } };
    expect(saved.state).toBeNull();
    expect(saved.record.played).toBe(1);
    expect(screen.getByTestId('wc-prompt').textContent).toMatch(/conquered the world|wins on/);
  }, 120_000);

  it('places one, five or all armies a click; all human games hand over and resume', async () => {
    vi.useFakeTimers();
    const first = createTestServices({ launchParams: { deal: '4' } });
    const view = render(<Game services={first.services} />);
    await settle(0);
    click('wc-level-humans');
    click('wc-count-2');
    click('wc-start');
    await settle(10);
    expect(screen.getByTestId('wc-pass').textContent).toContain('Red');
    expect(screen.queryByTestId('wc-cards')).toBeNull();
    click('wc-pass-go');
    const g = savedState(first)!;
    const t = owned(g, 0)[0]!;
    const before = g.armies[t]!;
    click('wc-amount-0');
    click(`wc-terr-${t}`);
    // "All" places the whole batch of three.
    expect(savedState(first)!.armies[t]).toBe(before + 3);
    expect(screen.getByTestId('wc-pass').textContent).toContain('Blue');
    view.unmount();
    const again = createTestServices({}, first.getSaved());
    render(<Game services={again.services} />);
    await settle(0);
    click('wc-resume');
    await settle(10);
    expect(screen.getByTestId(`wc-terr-${t}`).dataset.armies).toBe(String(before + 3));
    expect(screen.getByTestId('wc-pass').textContent).toContain('Blue');
  });
});
