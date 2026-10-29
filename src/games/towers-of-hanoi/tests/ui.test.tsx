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

describe('Towers of Hanoi UI', () => {
  it('moves disks by tapping pegs, refuses a big disk on a small one, and solves optimally', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices();
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('th-start'));
    await settle(10);
    const peg = (i: number) => screen.getByTestId('th-pegs').querySelector(`[data-peg="${i}"]`)!;
    fireEvent.click(peg(0));
    fireEvent.click(peg(2));
    expect(screen.getByTestId('th-moves').textContent).toBe('Moves 1');
    fireEvent.click(peg(0));
    fireEvent.click(peg(2));
    expect(screen.getByTestId('th-message').textContent).toMatch(/bigger disk/);
    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.click(screen.getByTestId('th-restart'));
    const solution: [number, number][] = [
      [0, 2],
      [0, 1],
      [2, 1],
      [0, 2],
      [1, 0],
      [1, 2],
      [0, 2],
    ];
    for (const [a, b] of solution) {
      fireEvent.keyDown(window, { key: String(a + 1) });
      fireEvent.keyDown(window, { key: String(b + 1) });
    }
    expect(screen.getByTestId('th-message').textContent).toMatch(/fewest possible/);
    expect(calls.results).toEqual([expect.objectContaining({ outcome: 'complete', score: 7 })]);
  });
});
