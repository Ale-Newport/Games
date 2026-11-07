// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';
import { KILLER, newSudoku } from '../engine';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const settle = async (ms: number) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
};

describe('Killer Sudoku UI', () => {
  it('places digits and notes, explains a hint, and records a solve', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { deal: '7' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('sudoku-difficulty-easy'));
    fireEvent.click(screen.getByTestId('sudoku-start'));
    await settle(50);
    const puzzle = newSudoku(KILLER, 'easy', 7);
    const empty = puzzle.puzzle.findIndex((x) => !x);
    const cell = () => screen.getByTestId('sudoku-board').querySelector(`[data-cell="${empty}"]`)!;
    fireEvent.click(cell());
    fireEvent.click(screen.getByTestId('sudoku-notes'));
    fireEvent.click(screen.getByTestId('sudoku-digit-1'));
    expect(cell().getAttribute('aria-label')).toMatch(/notes 1/);
    fireEvent.click(screen.getByTestId('sudoku-notes'));
    fireEvent.click(screen.getByTestId(`sudoku-digit-${puzzle.solution[empty]}`));
    expect(cell().textContent).toBe(String(puzzle.solution[empty]));
    fireEvent.click(screen.getByTestId('sudoku-undo'));
    expect(cell().textContent).toBe('1');
    fireEvent.click(screen.getByTestId('sudoku-hint'));
    expect(screen.getByTestId('sudoku-message').textContent).toMatch(/R\dC\d/);
    // Fill every cell from hints until solved.
    for (let i = 0; i < 81 && !screen.queryByTestId('sudoku-again'); i++) {
      fireEvent.click(screen.getByTestId('sudoku-hint'));
      fireEvent.click(screen.getByTestId('sudoku-fill'));
    }
    expect(screen.getByTestId('sudoku-message').textContent).toMatch(/^Solved in/);
    expect(calls.results).toEqual([expect.objectContaining({ outcome: 'complete', mode: 'easy' })]);
    expect(calls.achievements).toContain('first');
  });

  it('pauses the clock and hides the board', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { deal: '3' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('sudoku-start'));
    await settle(50);
    await settle(3000);
    expect(screen.getByTestId('sudoku-time').textContent).toMatch(/0:0[23]/);
    fireEvent.click(screen.getByTestId('sudoku-pause'));
    await settle(5000);
    expect(screen.getByTestId('sudoku-time').textContent).toMatch(/0:0[23]/);
    expect(screen.getByTestId('sudoku-board').textContent).toMatch(/Paused/);
  });
});
