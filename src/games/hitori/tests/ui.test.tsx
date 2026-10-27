// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';
import { newHitori } from '../engine';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const settle = async (ms: number) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
};

describe('Hitori UI', () => {
  it('cycles marks, explains a hint and records a solve', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { deal: '7' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('hitori-start'));
    await settle(50);
    const p = newHitori('easy', 7).puzzle;
    const cell = () => screen.getByTestId('hitori-board').querySelector('[data-cell="0"]')!;
    fireEvent.click(cell());
    expect(cell().getAttribute('data-mark')).toBe('2');
    fireEvent.click(cell());
    expect(cell().getAttribute('data-mark')).toBe('1');
    fireEvent.click(cell());
    expect(cell().getAttribute('data-mark')).toBe('0');
    fireEvent.click(screen.getByTestId('hitori-tap-shade'));
    fireEvent.click(cell());
    expect(cell().getAttribute('data-mark')).toBe('2');
    fireEvent.click(screen.getByTestId('hitori-undo'));
    expect(cell().getAttribute('data-mark')).toBe('0');
    fireEvent.click(screen.getByTestId('hitori-hint'));
    expect(screen.getByTestId('hitori-message').textContent).toMatch(/R\dC\d/);
    for (let i = 0; i < 40 && !screen.queryByTestId('hitori-again'); i++) {
      fireEvent.click(screen.getByTestId('hitori-hint'));
      fireEvent.click(screen.getByTestId('hitori-fill'));
    }
    expect(screen.getByTestId('hitori-message').textContent).toMatch(/^Solved in/);
    expect(calls.results).toEqual([expect.objectContaining({ outcome: 'complete', mode: 'easy' })]);
    expect(p.size).toBe(5);
  });
});
