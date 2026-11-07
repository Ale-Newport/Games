// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const settle = async (ms: number) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
};

/** Plays the human side by tapping: the first movable checker, then its first target. */
async function playByTaps() {
  const board = screen.getByTestId('rb-board');
  for (let k = 0; k < 4; k++) {
    const from = board.querySelector<SVGGElement>('[data-movable]');
    if (!from) return;
    fireEvent.click(from);
    const to = board.querySelector<SVGGElement>('[data-target]');
    if (!to) return;
    fireEvent.click(to);
    await settle(10);
  }
}

describe('Backgammon UI', () => {
  it('plays turns by taps and hints against the computer, which answers', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { deal: '11' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('bg-len-1'));
    fireEvent.click(screen.getByTestId('bg-start'));
    await settle(10);
    expect(screen.getByTestId('rb-board')).toBeTruthy();
    let humanTurns = 0;
    for (let i = 0; i < 40 && humanTurns < 4; i++) {
      if (screen.queryByTestId('bg-roll')) {
        fireEvent.click(screen.getByTestId('bg-roll'));
        await settle(10);
      }
      if (screen.queryByTestId('bg-hint')) {
        if (humanTurns % 2 === 0) await playByTaps();
        else {
          fireEvent.click(screen.getByTestId('bg-hint'));
          expect(screen.getByTestId('bg-message').textContent).toMatch(/Suggested/);
          fireEvent.click(screen.getByTestId('bg-apply'));
        }
        humanTurns++;
      }
      await settle(1500);
    }
    expect(humanTurns).toBe(4);
    // Pips have moved on from the start for both sides.
    expect(screen.getByText(/^Pips/).textContent).not.toBe('Pips 167 · 167');
  });

  it('offers the cube in a match and the computer answers a double', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { deal: '3' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('bg-len-3'));
    fireEvent.click(screen.getByTestId('bg-start'));
    await settle(10);
    for (let i = 0; i < 20 && !screen.queryByTestId('bg-double'); i++) {
      if (screen.queryByTestId('bg-hint')) {
        fireEvent.click(screen.getByTestId('bg-hint'));
        fireEvent.click(screen.getByTestId('bg-apply'));
      }
      await settle(1500);
    }
    fireEvent.click(screen.getByTestId('bg-double'));
    await settle(1000);
    expect(screen.getByTestId('bg-message').textContent).toMatch(/takes|Double dropped/);
  });

  it('watch mode plays both sides', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { mode: 'watch' } });
    render(<Game services={services} />);
    await settle(10);
    await settle(8000);
    expect(screen.getByText(/^Pips/).textContent).not.toBe('Pips 167 · 167');
  });
});
