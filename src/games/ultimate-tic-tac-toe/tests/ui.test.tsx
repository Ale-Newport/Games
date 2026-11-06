// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const cell = (i: number) => document.querySelector(`[data-cell="${i}"]`) as HTMLButtonElement;
const board = () => screen.getByTestId('uttt-board');
const playableBoards = () =>
  [...document.querySelectorAll('[data-playable="true"]')].map((el) =>
    Number(el.getAttribute('data-board')),
  );

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('Ultimate Tic-Tac-Toe UI', () => {
  it('highlights the forced board and rejects moves elsewhere', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    expect(document.querySelectorAll('[data-cell]')).toHaveLength(81);
    expect(playableBoards()).toHaveLength(9);
    fireEvent.click(cell(4 * 9 + 2)); // center board, top-right cell → O goes to board 2
    expect(board().getAttribute('data-forced')).toBe('2');
    expect(playableBoards()).toEqual([2]);
    fireEvent.click(cell(5 * 9 + 0)); // illegal: board 5
    expect(cell(5 * 9 + 0).getAttribute('aria-label')).toContain('empty');
    fireEvent.click(cell(2 * 9 + 4));
    expect(cell(2 * 9 + 4).getAttribute('aria-label')).toMatch(/O$/);
    expect(board().getAttribute('data-forced')).toBe('4');
  });

  it('keypad digits play in the forced board; undo works', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    fireEvent.keyDown(window, { key: '5' }); // free choice: digits do nothing
    expect(cell(4).getAttribute('aria-label')).toContain('empty');
    fireEvent.keyDown(document.body, { key: 'Enter' }); // cursor starts at the center cell (40)
    expect(cell(40).getAttribute('aria-label')).toMatch(/X$/);
    fireEvent.keyDown(window, { key: '9' }); // forced board 4, keypad 9 = cell 2
    expect(cell(4 * 9 + 2).getAttribute('aria-label')).toMatch(/O$/);
    fireEvent.keyDown(window, { key: 'u' });
    expect(cell(4 * 9 + 2).getAttribute('aria-label')).toContain('empty');
  });

  it('the CPU replies inside the board it was sent to', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('difficulty-easy'));
    fireEvent.click(screen.getByTestId('start-match'));
    fireEvent.click(cell(0 * 9 + 7)); // X → O must play in board 7
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    const oMarks = [...document.querySelectorAll('[data-cell]')].filter((b) =>
      b.getAttribute('aria-label')!.endsWith('O'),
    );
    expect(oMarks).toHaveLength(1);
    expect(Math.floor(Number(oMarks[0]!.getAttribute('data-cell')) / 9)).toBe(7);
  });
});
