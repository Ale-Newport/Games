// @vitest-environment jsdom
import { act as rtlAct, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Rng } from '../../../core/game-engine/random';
import { decide } from '../ai';
import { card, currentPlayer, type Action, type Shapers } from '../engine';
import { Game } from '../Game';
import { AWARDS, MILESTONES } from '../world';

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
  (s.getSaved() as { state: Shapers | null } | undefined)?.state ?? null;

/** Makes a move the way a player would: the panels, the offer toggles, the map. */
function perform(g: Shapers, a: Action) {
  switch (a.t) {
    case 'corp':
      return click(`ps-corp-${a.i}`);
    case 'buy': {
      const p = currentPlayer(g);
      g.ps[p]!.offer.forEach((_, k) => {
        if (a.mask & (1 << k)) click(`ps-offer-${k}`);
      });
      return click('ps-buy');
    }
    case 'play':
      return click(`ps-play-${card(a.card).id}`);
    case 'sell':
      return click(`ps-sell-${card(a.card).id}`);
    case 'use':
      return click(`ps-use-${card(a.card).id}`);
    case 'std':
      return click(`ps-std-${a.id}`);
    case 'convert':
      return click(`ps-convert-${a.what}`);
    case 'claim':
      return click(`ps-claim-${MILESTONES[a.m]!}`);
    case 'fund':
      return click(`ps-fund-${AWARDS[a.a]!}`);
    case 'tile':
      return click(`ps-space-${a.space}`);
    case 'pass':
      return click('ps-pass');
  }
}

describe('Planet Shapers UI', () => {
  it('plays two generations against cadets through the table', async () => {
    vi.useFakeTimers();
    const svc = createTestServices({ launchParams: { deal: '5' } });
    render(<Game services={svc.services} />);
    await settle(0);
    click('ps-count-2');
    click('ps-level-cadet');
    click('ps-start');
    await settle(10);
    const rng = new Rng(3);
    const kinds = new Set<string>();
    for (let i = 0; i < 3000; i++) {
      const g = savedState(svc)!;
      if (g.gen >= 3 || g.phase === 'over') break;
      if (currentPlayer(g) === 0) {
        const a = decide(g, 'architect', rng);
        perform(g, a);
        kinds.add(a.t);
        expect(savedState(svc)).not.toEqual(g);
      }
      await settle(700);
    }
    const g = savedState(svc)!;
    expect(g.gen).toBeGreaterThanOrEqual(3);
    expect([...kinds]).toEqual(expect.arrayContaining(['corp', 'buy', 'play', 'pass']));
    expect(screen.getByTestId('ps-gen').textContent).toMatch(/Generation 3/);
    expect(screen.getByTestId('ps-param-heat').textContent).toMatch(/\d+ \/ 10/);
  }, 120_000);

  it('everyone on one device: hands stay hidden behind the hand-off; resume', async () => {
    vi.useFakeTimers();
    const first = createTestServices({ launchParams: { deal: '5' } });
    const view = render(<Game services={first.services} />);
    await settle(0);
    click('ps-count-2');
    click('ps-level-humans');
    click('ps-start');
    await settle(10);
    expect(screen.getByTestId('ps-prompt').textContent).toMatch(/Pass the device to Player 1/);
    expect(screen.queryByTestId('ps-corps')).toBeNull();
    click('ps-ready');
    click('ps-corp-0');
    click('ps-offer-0');
    click('ps-offer-1');
    expect(screen.getByTestId('ps-buy').textContent).toMatch(/Buy 2 for 6/);
    click('ps-buy');
    // Player 2's turn: player 1's cards are hidden again.
    expect(screen.getByTestId('ps-handoff')).toBeTruthy();
    expect(screen.queryByTestId('ps-offer')).toBeNull();
    click('ps-ready');
    click('ps-corp-1');
    click('ps-buy');
    expect(screen.getByTestId('ps-prompt').textContent).toMatch(/Pass the device to/);
    const g = savedState(first)!;
    expect(g.phase).toBe('action');
    expect(g.ps[0]!.hand).toHaveLength(2);
    view.unmount();
    const again = createTestServices({}, first.getSaved());
    render(<Game services={again.services} />);
    await settle(0);
    click('ps-resume');
    await settle(10);
    click('ps-ready');
    expect(screen.getByTestId('ps-hand').querySelectorAll('li')).toHaveLength(2);
    click('ps-std-power');
    expect(savedState(again)!.ps[0]!.prod.power).toBe(1);
  });
});
