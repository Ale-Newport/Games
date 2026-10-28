// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';
import { newTrail } from '../engine';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const settle = async (ms: number) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
};

describe('Number Trail UI', () => {
  it('extends the trail by tapping, cuts it back, and solves with hints', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { deal: '6' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('zp-start'));
    await settle(50);
    const p = newTrail('easy', 6).puzzle;
    const cell = (c: number) => screen.getByTestId('zp-board').querySelector(`[data-cell="${c}"]`)!;
    for (const c of p.solution.slice(1, 4)) fireEvent.pointerDown(cell(c));
    expect(screen.getByTestId('zp-covered').textContent).toBe(`4/${p.size ** 2}`);
    fireEvent.pointerDown(cell(p.solution[1]!));
    expect(screen.getByTestId('zp-covered').textContent).toBe(`2/${p.size ** 2}`);
    fireEvent.click(screen.getByTestId('zp-undo'));
    expect(screen.getByTestId('zp-covered').textContent).toBe(`1/${p.size ** 2}`);
    for (let i = 0; i < 40 && !screen.queryByTestId('zp-again'); i++) {
      fireEvent.click(screen.getByTestId('zp-hint'));
      fireEvent.click(screen.getByTestId('zp-fill'));
    }
    expect(screen.getByTestId('zp-message').textContent).toMatch(/^Solved in/);
    expect(calls.results).toEqual([expect.objectContaining({ outcome: 'complete', mode: 'easy' })]);
  });

  it('sends the player back when the trail leaves the solution', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { deal: '6' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('zp-start'));
    await settle(50);
    const p = newTrail('easy', 6).puzzle;
    const n = p.size;
    const start = p.solution[0]!;
    const wrong = [start - n, start + n, start - 1, start + 1].find(
      (c) =>
        c >= 0 &&
        c < n * n &&
        c !== p.solution[1] &&
        !p.numbers[c] &&
        Math.abs((c % n) - (start % n)) + Math.abs(Math.floor(c / n) - Math.floor(start / n)) ===
          1 &&
        !p.walls.includes(`${Math.min(c, start)}-${Math.max(c, start)}`),
    );
    if (wrong === undefined) return;
    fireEvent.pointerDown(screen.getByTestId('zp-board').querySelector(`[data-cell="${wrong}"]`)!);
    fireEvent.click(screen.getByTestId('zp-hint'));
    expect(screen.getByTestId('zp-message').textContent).toMatch(/leaves the solution/);
    fireEvent.click(screen.getByTestId('zp-fill'));
    expect(screen.getByTestId('zp-covered').textContent).toBe(`1/${n * n}`);
  });
});
