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

describe('Traffic Jam UI', () => {
  it('moves the selected vehicle with the keys, undoes, and solves with hints', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { deal: '11' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('tj-start'));
    await settle(10);
    expect(screen.getByTestId('tj-moves').textContent).toBe('Moves 0');
    for (let i = 0; i < 12 && screen.getByTestId('tj-moves').textContent === 'Moves 0'; i++) {
      for (const key of ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'])
        if (screen.getByTestId('tj-moves').textContent === 'Moves 0')
          fireEvent.keyDown(window, { key });
      if (screen.getByTestId('tj-moves').textContent === 'Moves 0')
        fireEvent.keyDown(window, { key: 'Tab' });
    }
    expect(screen.getByTestId('tj-moves').textContent).toBe('Moves 1');
    fireEvent.click(screen.getByTestId('tj-undo'));
    expect(screen.getByTestId('tj-moves').textContent).toBe('Moves 2');
    for (let i = 0; i < 40 && !screen.queryByTestId('tj-again'); i++) {
      fireEvent.click(screen.getByTestId('tj-hint'));
      expect(screen.getByTestId('tj-message').textContent).toMatch(/^Slide the/);
      fireEvent.click(screen.getByTestId('tj-apply'));
    }
    expect(screen.getByTestId('tj-message').textContent).toMatch(/^Out in/);
    expect(calls.results).toEqual([expect.objectContaining({ outcome: 'complete', mode: 'easy' })]);
  });

  it('picks a numbered expert puzzle, records its best and marks it solved', async () => {
    vi.useFakeTimers();
    const { services, getSaved } = createTestServices();
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('tj-level-expert'));
    expect(screen.getByTestId('tj-puzzles').children.length).toBeGreaterThanOrEqual(50);
    fireEvent.click(screen.getByTestId('tj-puzzle-0'));
    await settle(10);
    expect(screen.getByTestId('tj-number').textContent).toBe('Puzzle 1');
    for (let i = 0; i < 120 && !screen.queryByTestId('tj-again'); i++) {
      fireEvent.click(screen.getByTestId('tj-hint'));
      fireEvent.click(screen.getByTestId('tj-apply'));
    }
    expect(screen.getByTestId('tj-message').textContent).toMatch(/^Out in/);
    const moves = (getSaved() as { best: Record<string, number> }).best['expert:0'];
    expect(moves).toBeGreaterThanOrEqual(30);
    fireEvent.click(screen.getByTestId('tj-next'));
    await settle(10);
    expect(screen.getByTestId('tj-number').textContent).toBe('Puzzle 2');
    fireEvent.click(screen.getByTestId('tj-menu-btn'));
    await settle(10);
    expect(screen.getByTestId('tj-puzzle-0').getAttribute('aria-label')).toBe(
      `Puzzle 1, solved in ${moves} moves at best`,
    );
    expect(screen.getByTestId('tj-puzzle-0').className).toMatch(/cleared/);
    expect(screen.getByTestId('tj-resume')).toBeTruthy();
  });
});
