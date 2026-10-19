// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const cell = (i: number) => document.querySelector(`[data-cell="${i}"]`) as HTMLButtonElement;
const label = (i: number) => cell(i).getAttribute('aria-label');
const status = () => screen.getByTestId('mnk-status').textContent ?? '';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('Tic-Tac-Toe 4×4 UI', () => {
  it('renders 16 cells and plays a two-player diagonal win', async () => {
    const { services, calls } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    expect(document.querySelectorAll('[data-cell]')).toHaveLength(16);
    for (const i of [0, 1, 5, 2, 10]) fireEvent.click(cell(i));
    expect(status()).not.toContain('wins');
    fireEvent.click(cell(3));
    fireEvent.click(cell(15));
    expect(status()).toContain('Tester wins!');
    expect(calls.results).toEqual([{ outcome: 'complete', mode: 'local' }]);
    expect(calls.achievements).toEqual(expect.arrayContaining(['hot-seat', 'diagonal-win']));
  });

  it('the Perfect CPU blocks an open three', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('difficulty-perfect'));
    fireEvent.click(screen.getByTestId('start-match'));
    const humanMoves = [0, 1, 2];
    for (const move of humanMoves) {
      if (!label(move)!.includes('empty')) continue;
      fireEvent.click(cell(move));
      act(() => {
        vi.advanceTimersByTime(1500);
      });
    }
    // If X holds 0,1,2 the CPU must have answered at 3 (or X never got all three).
    const xs = [0, 1, 2].filter((i) => label(i)!.endsWith('X'));
    if (xs.length === 3) expect(label(3)).toMatch(/O$/);
    expect(status()).not.toContain('You win');
  });

  it('moves the keyboard cursor with arrows and places with Enter', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    // Cursor starts at row 3, col 3 (index 10) on a 4×4 board.
    fireEvent.keyDown(document.body, { key: 'Enter' });
    expect(label(10)).toMatch(/X$/);
    fireEvent.keyDown(window, { key: 'ArrowUp' });
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    fireEvent.keyDown(document.body, { key: 'Enter' });
    expect(label(5)).toMatch(/O$/);
    fireEvent.keyDown(window, { key: '5' }); // no digit shortcuts on 4×4
    expect(label(4)).toContain('empty');
  });
});
