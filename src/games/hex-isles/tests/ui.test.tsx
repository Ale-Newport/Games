// @vitest-environment jsdom
import { act as rtlAct, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Rng } from '../../../core/game-engine/random';
import { decide } from '../ai';
import { act, currentPlayer, none, total, type Action, type Cards, type IsleGame } from '../engine';
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

/** Performs an action the way a player would: buttons, then the highlighted board spot. */
function perform(g: IsleGame, a: Action, rng: Rng) {
  const ph = g.phase;
  switch (a.t) {
    case 'hut':
      if (ph.k === 'main') click('hi-build-hut');
      return click(`hi-corner-${a.v}`);
    case 'town':
      click('hi-build-town');
      return click(`hi-corner-${a.v}`);
    case 'path':
      if (ph.k === 'main') click('hi-build-path');
      return click(`hi-edge-${a.e}`);
    case 'roll':
      return click('hi-roll');
    case 'captain':
      return click(ph.k === 'roll' ? 'hi-captain-first' : 'hi-play-captain');
    case 'roadworks':
      return click('hi-play-roadworks');
    case 'bounty':
      click('hi-play-bounty');
      click(`hi-pick-${a.r}`);
      click(`hi-pick-${a.r2}`);
      return click('hi-choose-go');
    case 'embargo':
      click('hi-play-embargo');
      click(`hi-pick-${a.r}`);
      return click('hi-choose-go');
    case 'buy':
      return click('hi-build-chart');
    case 'bank':
      click('hi-trade');
      click(`hi-give-${a.give}`);
      return click(`hi-get-${a.get}`);
    case 'offer':
      click('hi-trade');
      a.give.forEach((n, r) => {
        for (let k = 0; k < n; k++) click(`hi-og-plus-${r}`);
      });
      a.get.forEach((n, r) => {
        for (let k = 0; k < n; k++) click(`hi-ow-plus-${r}`);
      });
      return click(`hi-offer-${a.to}`);
    case 'answer':
      return click(a.accept ? 'hi-accept' : 'hi-decline');
    case 'storm':
      return click(`hi-hex-${a.h}`);
    case 'steal':
      return click(`hi-steal-${a.p}`);
    case 'discard': {
      // The agent discards one card at a time; the table takes the whole set at once.
      let s = g;
      const all: Cards = none();
      const p = currentPlayer(g);
      while (s.phase.k === 'discard' && currentPlayer(s) === p) {
        const d = decide(s, 'strategist', rng) as { t: 'discard'; cards: Cards };
        d.cards.forEach((n, r) => (all[r]! += n));
        s = act(s, d);
      }
      all.forEach((n, r) => {
        for (let k = 0; k < n; k++) click(`hi-dis-plus-${r}`);
      });
      return click('hi-discard-go');
    }
    case 'end':
      return click('hi-end');
  }
}

describe('Hex Isles UI', () => {
  it('plays a whole game against three settlers through the table', async () => {
    vi.useFakeTimers();
    const { services, calls, getSaved } = createTestServices({ launchParams: { deal: '7' } });
    render(<Game services={services} />);
    await settle(0);
    click('hi-level-settler');
    click('hi-count-4');
    click('hi-start');
    await settle(10);
    const rng = new Rng(3);
    let mine = 0;
    for (let i = 0; i < 8000 && !screen.queryByTestId('hi-over'); i++) {
      const g = (getSaved() as { state: IsleGame | null } | undefined)?.state;
      if (g && currentPlayer(g) === 0 && g.phase.k !== 'over') {
        const a = decide(g, 'strategist', rng);
        perform(g, a, rng);
        mine++;
        const after = (getSaved() as { state: IsleGame | null }).state;
        // Every move made through the table changed the game.
        expect(after).not.toEqual(g);
      }
      await settle(700);
    }
    expect(screen.getByTestId('hi-over')).toBeTruthy();
    expect(mine).toBeGreaterThan(30);
    expect(calls.results).toHaveLength(1);
    expect(screen.getByTestId('hi-prompt').textContent).toMatch(/won with \d+ points/);
    const saved = getSaved() as { state: IsleGame | null; record: { played: number } };
    expect(saved.state).toBeNull();
    expect(saved.record.played).toBe(1);
    click('hi-menu-btn');
    expect(screen.getByTestId('hi-record').textContent).toContain('1');
  }, 120_000);

  it('all human: a hand-off screen hides the hand; the game resumes after a reload', async () => {
    vi.useFakeTimers();
    const first = createTestServices({ launchParams: { deal: '4' } });
    const view = render(<Game services={first.services} />);
    await settle(0);
    click('hi-level-humans');
    click('hi-count-3');
    click('hi-start');
    await settle(10);
    expect(screen.getByTestId('hi-pass').textContent).toContain('Pass the device to Red');
    expect(screen.queryByTestId('hi-hand')).toBeNull();
    expect(screen.queryByTestId('hi-corner-0')).toBeNull();
    click('hi-pass-go');
    // Red places a hut and a path; then it is Blue's turn behind a hand-off screen.
    const g0 = (first.getSaved() as { state: IsleGame }).state;
    const rng = new Rng(1);
    const hut = decide(g0, 'settler', rng) as { t: 'hut'; v: number };
    click(`hi-corner-${hut.v}`);
    const g1 = (first.getSaved() as { state: IsleGame }).state;
    const path = decide(g1, 'settler', rng) as { t: 'path'; e: number };
    click(`hi-edge-${path.e}`);
    expect(screen.getByTestId('hi-pass').textContent).toContain('Blue');
    expect(screen.getByTestId(`hi-site-${hut.v}`)).toBeTruthy();
    view.unmount();
    const again = createTestServices({}, first.getSaved());
    render(<Game services={again.services} />);
    await settle(0);
    click('hi-resume');
    await settle(10);
    expect(screen.getByTestId(`hi-site-${hut.v}`)).toBeTruthy();
    expect(screen.getByTestId(`hi-path-${path.e}`)).toBeTruthy();
    expect(screen.getByTestId('hi-pass').textContent).toContain('Blue');
    expect(total((again.getSaved() as { state: IsleGame }).state.hands[0]!.hand)).toBe(0);
  });
});
