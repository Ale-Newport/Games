// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';
import { newNurikabe } from '../engine';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const settle = async (ms: number) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
};

describe('Nurikabe UI', () => {
  it('cycles marks, explains hints and records a solve', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { deal: '7' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('nuri-start'));
    await settle(50);
    const p = newNurikabe('easy', 7).puzzle;
    const free = p.numbers.findIndex((n) => !n);
    const cell = () => screen.getByTestId('nuri-board').querySelector(`[data-cell="${free}"]`)!;
    fireEvent.click(cell());
    expect(cell().getAttribute('data-mark')).toBe('2');
    fireEvent.click(cell());
    expect(cell().getAttribute('data-mark')).toBe('1');
    fireEvent.click(screen.getByTestId('nuri-undo'));
    fireEvent.click(screen.getByTestId('nuri-undo'));
    expect(cell().getAttribute('data-mark')).toBe('0');
    fireEvent.click(screen.getByTestId('nuri-hint'));
    expect(screen.getByTestId('nuri-message').textContent).toMatch(/R\dC\d/);
    for (let i = 0; i < 40 && !screen.queryByTestId('nuri-again'); i++) {
      fireEvent.click(screen.getByTestId('nuri-hint'));
      fireEvent.click(screen.getByTestId('nuri-fill'));
    }
    expect(screen.getByTestId('nuri-message').textContent).toMatch(/^Solved in/);
    expect(calls.results).toEqual([expect.objectContaining({ outcome: 'complete', mode: 'easy' })]);
  });
});
