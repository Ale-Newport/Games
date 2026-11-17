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

describe('Peg Solitaire UI', () => {
  it('selects a peg, jumps, undoes and finishes the English board with hints', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices();
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('pg-start'));
    await settle(10);
    const hole = (h: number) => screen.getByTestId('pg-board').querySelector(`[data-hole="${h}"]`)!;
    // Hole 4 jumps over 9 into the empty centre (16).
    fireEvent.click(hole(4));
    fireEvent.click(hole(16));
    expect(screen.getByTestId('pg-left').textContent).toBe('Pegs 31');
    fireEvent.click(screen.getByTestId('pg-undo'));
    expect(screen.getByTestId('pg-left').textContent).toBe('Pegs 32');
    for (let i = 0; i < 40 && screen.queryByTestId('pg-hint'); i++) {
      fireEvent.click(screen.getByTestId('pg-hint'));
      fireEvent.click(screen.getByTestId('pg-apply'));
    }
    expect(screen.getByTestId('pg-message').textContent).toMatch(/One peg left/);
    expect(calls.results).toEqual([
      expect.objectContaining({ outcome: 'complete', mode: 'english' }),
    ]);
  });

  it('offers every board and finishes the German board by following hints to its goal', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices();
    render(<Game services={services} />);
    await settle(0);
    for (const b of ['english', 'european', 'german', 'asymmetric', 'diamond', 'triangle'])
      expect(screen.getByTestId(`pg-board-${b}`)).toBeTruthy();
    fireEvent.click(screen.getByTestId('pg-board-hexagon'));
    fireEvent.click(screen.getByTestId('pg-start'));
    await settle(10);
    expect(screen.getByTestId('pg-board').querySelectorAll('[data-hole]')).toHaveLength(37);
    expect(screen.getByTestId('pg-left').textContent).toBe('Pegs 36');
    fireEvent.click(screen.getByTestId('pg-menu-btn'));
    await settle(10);
    fireEvent.click(screen.getByTestId('pg-board-german'));
    fireEvent.click(screen.getByTestId('pg-start'));
    await settle(10);
    const board = screen.getByTestId('pg-board');
    expect(board.querySelectorAll('[data-hole]')).toHaveLength(45);
    expect(board.querySelector('[data-hole="22"]')!.getAttribute('aria-label')).toMatch(/goal/);
    for (let i = 0; i < 50 && screen.queryByTestId('pg-hint'); i++) {
      fireEvent.click(screen.getByTestId('pg-hint'));
      fireEvent.click(screen.getByTestId('pg-apply'));
    }
    expect(screen.getByTestId('pg-message').textContent).toMatch(/One peg left/);
    expect(calls.results).toEqual([
      expect.objectContaining({ outcome: 'complete', mode: 'german' }),
    ]);
  });
});
