// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';
import { newKakuro } from '../engine';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const settle = async (ms: number) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
};

describe('Kakuro UI', () => {
  it('places digits and notes, shows combinations, explains a hint and records a solve', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { deal: '7' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('kakuro-start'));
    await settle(50);
    const puzzle = newKakuro('easy', 7).puzzle;
    const empty = puzzle.white.findIndex((w, c) => w && !puzzle.given[c]);
    const cell = () => screen.getByTestId('kakuro-board').querySelector(`[data-cell="${empty}"]`)!;
    fireEvent.click(cell());
    expect(screen.getByTestId('kakuro-combos').textContent).toMatch(/across \d+ in \d/);
    fireEvent.click(screen.getByTestId('kakuro-notes'));
    fireEvent.click(screen.getByTestId('kakuro-digit-1'));
    expect(cell().getAttribute('aria-label')).toMatch(/notes 1/);
    fireEvent.click(screen.getByTestId('kakuro-notes'));
    fireEvent.click(screen.getByTestId(`kakuro-digit-${puzzle.solution[empty]}`));
    expect(cell().textContent).toBe(String(puzzle.solution[empty]));
    fireEvent.click(screen.getByTestId('kakuro-undo'));
    expect(cell().textContent).toBe('1');
    fireEvent.click(screen.getByTestId('kakuro-hint'));
    expect(screen.getByTestId('kakuro-message').textContent).toMatch(/R\dC\d/);
    for (let i = 0; i < 60 && !screen.queryByTestId('kakuro-again'); i++) {
      fireEvent.click(screen.getByTestId('kakuro-hint'));
      fireEvent.click(screen.getByTestId('kakuro-fill'));
    }
    expect(screen.getByTestId('kakuro-message').textContent).toMatch(/^Solved in/);
    expect(calls.results).toEqual([expect.objectContaining({ outcome: 'complete', mode: 'easy' })]);
  });
});
