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

describe('Sokoban UI', () => {
  it('opens a level, steps with the keys, undoes and solves it with hints', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices();
    render(<Game services={services} />);
    await settle(10);
    fireEvent.click(screen.getByTestId('sk-level-0'));
    await settle(10);
    for (const key of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'])
      fireEvent.keyDown(window, { key });
    expect(screen.getByTestId('sk-moves').textContent).not.toBe('Moves 0');
    fireEvent.click(screen.getByTestId('sk-restart'));
    expect(screen.getByTestId('sk-moves').textContent).toBe('Moves 0');
    for (let i = 0; i < 30 && !screen.queryByTestId('sk-next'); i++) {
      fireEvent.click(screen.getByTestId('sk-hint'));
      expect(screen.getByTestId('sk-message').textContent).toMatch(/^Push the crate/);
      fireEvent.click(screen.getByTestId('sk-apply'));
    }
    expect(screen.getByTestId('sk-message').textContent).toMatch(/^Done in/);
    expect(calls.results).toEqual([expect.objectContaining({ outcome: 'complete', mode: 'easy' })]);
    fireEvent.click(screen.getByTestId('sk-menu-btn'));
    expect(screen.getByTestId('sk-level-0').className).toMatch(/cleared/);
  });
});
