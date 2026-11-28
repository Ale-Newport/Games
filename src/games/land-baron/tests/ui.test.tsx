// @vitest-environment jsdom
import { act as rtlAct, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Rng } from '../../../core/game-engine/random';
import { decide } from '../ai';
import { currentPlayer, type Action, type Baron } from '../engine';
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
const select = (at: number) => {
  const el = screen.getByTestId(`lb-space-${at}`);
  if (el.getAttribute('aria-pressed') !== 'true') fireEvent.click(el);
};

/** Makes a move the way a player would: the panel's buttons, spaces and the trade builder. */
function perform(g: Baron, a: Action) {
  switch (a.t) {
    case 'roll':
    case 'bail':
    case 'pardon':
    case 'buy':
    case 'decline':
    case 'pass':
    case 'end':
      return click(`lb-${a.t}`);
    case 'bid':
      return click(`lb-bid-${a.n - (g.phase.k === 'auction' ? g.phase.bid : 0)}`);
    case 'build':
    case 'sell':
    case 'mortgage':
    case 'redeem':
      select(a.at);
      return click(`lb-${a.t}`);
    case 'answer':
      return click(a.accept ? 'lb-accept' : 'lb-refuse');
    case 'offer':
      click(`lb-partner-${a.to}`);
      for (const s of a.give) click(`lb-give-${s}`);
      for (const s of a.get) click(`lb-get-${s}`);
      fireEvent.change(screen.getByTestId('lb-cash'), { target: { value: String(a.cash) } });
      return click('lb-offer');
  }
}

const savedState = (s: ReturnType<typeof createTestServices>) =>
  (s.getSaved() as { state: Baron | null } | undefined)?.state ?? null;

describe('Land Baron UI', () => {
  it('plays a whole timed game against speculators through the table', async () => {
    vi.useFakeTimers();
    const svc = createTestServices({ launchParams: { deal: '21' } });
    render(<Game services={svc.services} />);
    await settle(0);
    click('lb-level-speculator');
    click('lb-count-3');
    click('lb-length-30');
    click('lb-start');
    await settle(10);
    const rng = new Rng(8);
    let mine = 0;
    const kinds = new Set<string>();
    for (let i = 0; i < 30_000 && !screen.queryByTestId('lb-over'); i++) {
      const g = savedState(svc);
      if (g && g.phase.k !== 'over' && currentPlayer(g) === 0) {
        const a = decide(g, 'baron', rng);
        perform(g, a);
        kinds.add(a.t);
        mine++;
        expect(savedState(svc)).not.toEqual(g);
      }
      await settle(700);
    }
    expect(screen.getByTestId('lb-over')).toBeTruthy();
    expect(mine).toBeGreaterThan(40);
    expect([...kinds]).toEqual(expect.arrayContaining(['roll', 'end']));
    expect(svc.calls.results).toHaveLength(1);
    const saved = svc.getSaved() as { state: Baron | null; record: { played: number } };
    expect(saved.state).toBeNull();
    expect(saved.record.played).toBe(1);
  }, 120_000);

  it('auctions, space details, a trade proposal, and resume after a reload', async () => {
    vi.useFakeTimers();
    const first = createTestServices({ launchParams: { deal: '8' } });
    const view = render(<Game services={first.services} />);
    await settle(0);
    click('lb-level-humans');
    click('lb-count-2');
    click('lb-start');
    await settle(10);
    click('lb-roll');
    let g = savedState(first)!;
    expect(g.phase.k).toBe('buy');
    const at = (g.phase as { at: number }).at;
    click('lb-decline');
    click('lb-bid-1'); // Red opens at 1
    click('lb-bid-10'); // Blue raises to 11
    click('lb-pass'); // Red passes: Blue wins
    g = savedState(first)!;
    expect(g.owner[at]).toBe(1);
    expect(g.cash[1]).toBe(1500 - 11);
    // Space details.
    fireEvent.click(screen.getByTestId(`lb-space-${at}`));
    expect(screen.getByTestId('lb-info').textContent).toContain('Owner: Blue');
    // Red proposes to buy it for 150.
    expect(g.phase.k).toBe('main');
    expect(g.turn).toBe(0);
    click('lb-partner-1');
    click(`lb-get-${at}`);
    fireEvent.change(screen.getByTestId('lb-cash'), { target: { value: '150' } });
    click('lb-offer');
    expect(savedState(first)!.phase).toMatchObject({ k: 'offer', to: 1, cash: 150 });
    click('lb-refuse');
    expect(savedState(first)!.owner[at]).toBe(1);
    view.unmount();
    const again = createTestServices({}, first.getSaved());
    render(<Game services={again.services} />);
    await settle(0);
    click('lb-resume');
    await settle(10);
    expect(screen.getByTestId(`lb-space-${at}`).dataset.owned).toBe('true');
    expect(screen.getByTestId('lb-player-1').textContent).toContain('1489');
  });
});
