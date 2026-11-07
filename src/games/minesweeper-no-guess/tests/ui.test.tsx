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

const tap = (cell: Element) => {
  fireEvent.pointerDown(cell, { button: 0 });
  fireEvent.pointerUp(cell, { button: 0 });
};

describe('No-Guess Minesweeper UI', () => {
  it('opens a safe start, flags, and clears the board through hints alone', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { deal: '11' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('mines-start'));
    const board = screen.getByTestId('mines-board');
    tap(board.querySelector('[data-cell="40"]')!);
    expect(board.querySelectorAll('[data-state="open"]').length).toBeGreaterThan(1);
    const closed = board.querySelector('[data-state="closed"]')!;
    fireEvent.pointerDown(closed, { button: 0 });
    await settle(500);
    fireEvent.pointerUp(closed, { button: 0 });
    expect(closed.getAttribute('data-state')).toBe('flag');
    fireEvent.contextMenu(closed);
    expect(closed.getAttribute('data-state')).toBe('closed');
    for (let i = 0; i < 120 && !screen.queryByTestId('mines-again'); i++) {
      fireEvent.click(screen.getByTestId('mines-hint'));
      const apply = screen.queryByTestId('mines-apply');
      if (apply) fireEvent.click(apply);
    }
    expect(screen.getByTestId('mines-message').textContent).toMatch(/^Cleared in/);
    expect(calls.results).toHaveLength(1);
  });
});
