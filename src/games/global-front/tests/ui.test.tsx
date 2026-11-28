// @vitest-environment jsdom
import { act as rtlAct, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Rng } from '../../../core/game-engine/random';
import { decide } from '../ai';
import { currentPlayer, type Action, type Front } from '../engine';
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
  (s.getSaved() as { state: Front | null } | undefined)?.state ?? null;
const select = (loc: number) => {
  const el = screen.getByTestId(`gf-loc-${loc}`);
  if (el.getAttribute('data-selected') !== 'true') fireEvent.click(el);
};

/** Makes a move the way a player would: the buy panel, the map, the place panel, the buttons. */
function perform(a: Action) {
  switch (a.t) {
    case 'buy':
      return click(`gf-buy-${a.kind}`);
    case 'unbuy':
      return click(`gf-unbuy-${a.kind}`);
    case 'move': {
      select(a.from);
      // Bring the count down to n.
      for (
        let k = 0;
        k < 40 &&
        Number(
          screen.getByTestId(`gf-send-${a.kind}`).parentElement!.querySelector('b')!.textContent,
        ) > a.n;
        k++
      )
        click(`gf-less-${a.kind}`);
      click(`gf-send-${a.kind}`);
      return click(`gf-loc-${a.to}`);
    }
    case 'sail':
      select(a.from);
      click(`gf-sail-${a.kinds.join('+')}`);
      return click(`gf-loc-${a.to}`);
    case 'roll':
      return click('gf-roll');
    case 'retreat':
      return click('gf-retreat');
    case 'place':
      click(`gf-place-${a.kind}`);
      return click(`gf-loc-${a.loc}`);
    case 'next':
      return click('gf-next');
  }
}

describe('Global Front UI', () => {
  it('plays two rounds of the Northern Pact against colonels through the table', async () => {
    vi.useFakeTimers();
    const svc = createTestServices({ launchParams: { deal: '4' } });
    render(<Game services={svc.services} />);
    await settle(0);
    click('gf-side-0');
    click('gf-level-colonel');
    click('gf-start');
    await settle(10);
    const rng = new Rng(3);
    const kinds = new Set<string>();
    for (let i = 0; i < 6000; i++) {
      const g = savedState(svc)!;
      if (g.round >= 3 || g.phase === 'over') break;
      if (currentPlayer(g) === 0) {
        const a = decide(g, 'general', rng);
        perform(a);
        kinds.add(a.t);
        expect(savedState(svc)).not.toEqual(g);
      }
      await settle(500);
    }
    const g = savedState(svc)!;
    expect(g.round).toBeGreaterThanOrEqual(3);
    expect([...kinds]).toEqual(expect.arrayContaining(['buy', 'move', 'next', 'place', 'roll']));
    expect(screen.getByTestId('gf-status').textContent).toMatch(/Round 3 of 15/);
  }, 120_000);

  it('buying, the place panel, the battle panel and resume', async () => {
    vi.useFakeTimers();
    const first = createTestServices({ launchParams: { deal: '4' } });
    const view = render(<Game services={first.services} />);
    await settle(0);
    click('gf-level-humans');
    click('gf-start');
    await settle(10);
    click('gf-buy-infantry');
    click('gf-buy-armor');
    expect(screen.getByTestId('gf-prompt').textContent).toMatch(/\(7 to spend\)/);
    click('gf-unbuy-armor');
    click('gf-next');
    const g = savedState(first)!;
    expect(g.treasury[0]).toBe(13);
    expect(g.phase).toBe('combat');
    // Tarsk's infantry attacks Dunrow.
    const tarsk = 5;
    const dunrow = 9;
    fireEvent.click(screen.getByTestId(`gf-loc-${tarsk}`));
    expect(screen.getByTestId('gf-units').textContent).toContain('1 Infantry');
    click('gf-send-infantry');
    expect(screen.getByTestId(`gf-loc-${dunrow}`).getAttribute('data-target')).toBe('true');
    fireEvent.click(screen.getByTestId(`gf-loc-${dunrow}`));
    click('gf-next');
    expect(screen.getByTestId('gf-battle').textContent).toMatch(
      /Attacking1 Infantry.*Defending1 Infantry/,
    );
    click('gf-roll');
    expect(screen.getByTestId('gf-dice').textContent).toMatch(/Dice: \d against \d/);
    view.unmount();
    const again = createTestServices({}, first.getSaved());
    render(<Game services={again.services} />);
    await settle(0);
    click('gf-resume');
    await settle(10);
    expect(screen.getByTestId('gf-phase').textContent).toMatch(/Varn Dominion · (Battle|Moves)/);
  });
});
