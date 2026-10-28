// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';
import { newQueens } from '../engine';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const settle = async (ms: number) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
};

describe('Royal Regions UI', () => {
  it('cycles ✕ and queen, shows clashes, and solves with hints', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { deal: '9' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('qn-start'));
    await settle(50);
    const s = newQueens('easy', 9);
    const n = s.puzzle.size;
    const cell = (c: number) => screen.getByTestId('qn-board').querySelector(`[data-cell="${c}"]`)!;
    fireEvent.pointerDown(cell(0));
    fireEvent.pointerUp(cell(0));
    expect(cell(0).getAttribute('data-mark')).toBe('1');
    fireEvent.pointerDown(cell(0));
    fireEvent.pointerUp(cell(0));
    expect(cell(0).getAttribute('data-mark')).toBe('2');
    fireEvent.click(screen.getByTestId('qn-tap-queen'));
    fireEvent.pointerDown(cell(n + 1));
    fireEvent.pointerUp(cell(n + 1));
    expect(screen.getByTestId('qn-message').textContent).toMatch(/clash/);
    fireEvent.click(screen.getByTestId('qn-undo'));
    fireEvent.click(screen.getByTestId('qn-undo'));
    fireEvent.click(screen.getByTestId('qn-undo'));
    expect(cell(0).getAttribute('data-mark')).toBe('0');
    fireEvent.click(screen.getByTestId('qn-hint'));
    expect(screen.getByTestId('qn-message').textContent).toMatch(/R\dC\d|row|column|region/);
    for (let i = 0; i < 80 && !screen.queryByTestId('qn-again'); i++) {
      fireEvent.click(screen.getByTestId('qn-hint'));
      fireEvent.click(screen.getByTestId('qn-fill'));
    }
    expect(screen.getByTestId('qn-message').textContent).toMatch(/^Solved in/);
    expect(calls.results).toEqual([expect.objectContaining({ outcome: 'complete', mode: 'easy' })]);
  });

  it('auto-crosses around a queen', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { deal: '4' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('qn-start'));
    await settle(50);
    fireEvent.click(screen.getByTestId('qn-auto'));
    fireEvent.click(screen.getByTestId('qn-tap-queen'));
    const board = screen.getByTestId('qn-board');
    const c = board.querySelector('[data-cell="7"]')!;
    fireEvent.pointerDown(c);
    fireEvent.pointerUp(c);
    expect(board.querySelectorAll('[data-mark="1"]').length).toBeGreaterThan(8);
  });
});
