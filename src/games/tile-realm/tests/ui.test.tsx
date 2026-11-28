// @vitest-environment jsdom
import { act as rtlAct, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Rng } from '../../../core/game-engine/random';
import { decide } from '../ai';
import { type Action, type Realm } from '../engine';
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
  (s.getSaved() as { state: Realm | null } | undefined)?.state ?? null;

/** Places a tile the way a player would: rotate, pick the square, pick a warden spot, confirm. */
function perform(a: Action) {
  // Turn the tile in hand to the wanted rotation, then click the square.
  const hand = () => screen.getByTestId('tr-current').querySelector('g')!.getAttribute('transform');
  for (let k = 0; k < 4 && hand() !== `rotate(${a.r * 90} 50 50)`; k++) click('tr-rot-right');
  click(`tr-cell-${a.x}-${a.y}`);
  const ghost = screen
    .getByTestId('tr-ghost')
    .querySelector('[transform^="rotate"]')!
    .getAttribute('transform');
  expect(ghost).toBe(`rotate(${a.r * 90} 50 50)`);
  if (a.warden === null) click('tr-no-warden');
  else {
    click(`tr-spot-${a.warden}`);
    click('tr-confirm');
  }
}

describe('Tile Realm UI', () => {
  it('plays a whole game against an apprentice through the table', async () => {
    vi.useFakeTimers();
    const svc = createTestServices({ launchParams: { deal: '9' } });
    render(<Game services={svc.services} />);
    await settle(0);
    click('tr-level-apprentice');
    click('tr-count-2');
    click('tr-start');
    await settle(10);
    const rng = new Rng(4);
    let mine = 0;
    for (let i = 0; i < 400 && !screen.queryByTestId('tr-over'); i++) {
      const g = savedState(svc);
      if (g && g.phase === 'place' && g.turn === 0) {
        const a = decide(g, 'master', rng);
        perform(a);
        mine++;
        const after = savedState(svc)!;
        expect(after.board.length).toBeGreaterThan(g.board.length);
        expect(after.board[g.board.length]).toMatchObject({ x: a.x, y: a.y, rot: a.r });
      }
      await settle(800);
    }
    expect(screen.getByTestId('tr-over')).toBeTruthy();
    expect(mine).toBeGreaterThan(25);
    expect(svc.calls.results).toHaveLength(1);
    const saved = svc.getSaved() as { state: Realm | null; record: { played: number } };
    expect(saved.state).toBeNull();
    expect(saved.record.played).toBe(1);
  }, 120_000);

  it('rotates, cancels, hints, places by keyboard and resumes after a reload', async () => {
    vi.useFakeTimers();
    const first = createTestServices({ launchParams: { deal: '3' } });
    const view = render(<Game services={first.services} />);
    await settle(0);
    click('tr-level-humans');
    click('tr-start');
    await settle(10);
    const g = savedState(first)!;
    // The hint puts a tile down where the master would.
    click('tr-hint');
    const a = decide(g, 'master', new Rng(g.bag.length * 31 + g.turn));
    expect(screen.getByTestId('tr-ghost').getAttribute('transform')).toBe(
      `translate(${a.x * 100} ${a.y * 100})`,
    );
    expect(screen.getByTestId('tr-hint-text').textContent).toMatch(/Hint: the highlighted spot/);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByTestId('tr-ghost')).toBeNull();
    // Keyboard: R turns the tile, the square takes it, N places it without a warden.
    fireEvent.keyDown(window, { key: 'r' });
    click(`tr-cell-${a.x}-${a.y}`);
    fireEvent.keyDown(window, { key: 'n' });
    const after = savedState(first)!;
    expect(after.board).toHaveLength(2);
    expect(after.wardens).toEqual([]);
    expect(after.turn).toBe(1);
    view.unmount();
    const again = createTestServices({}, first.getSaved());
    render(<Game services={again.services} />);
    await settle(0);
    click('tr-resume');
    await settle(10);
    expect(screen.getByTestId(`tr-tile-${after.board[1]!.x}-${after.board[1]!.y}`)).toBeTruthy();
    expect(screen.getByTestId('tr-prompt').textContent).toMatch(/Place your tile/);
  });
});
