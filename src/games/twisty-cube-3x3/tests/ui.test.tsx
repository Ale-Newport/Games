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

describe('Twisty cube 3×3 UI', () => {
  it('turns faces with buttons and keys, undoes, and solves an easy scramble with hints', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { deal: '4' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('cu-level-easy'));
    fireEvent.click(screen.getByTestId('cu-start'));
    await settle(10);
    fireEvent.click(screen.getByTestId('cu-turn-R'));
    await settle(300);
    expect(screen.getByTestId('cu-moves').textContent).toBe('Turns 1');
    fireEvent.keyDown(window, { key: 'U' });
    await settle(300);
    expect(screen.getByTestId('cu-moves').textContent).toBe('Turns 2');
    fireEvent.click(screen.getByTestId('cu-undo'));
    await settle(300);
    fireEvent.click(screen.getByTestId('cu-undo'));
    await settle(300);
    expect(screen.getByTestId('cu-moves').textContent).toBe('Turns 0');
    for (let i = 0; i < 12 && !screen.queryByTestId('cu-again'); i++) {
      fireEvent.click(screen.getByTestId('cu-hint'));
      fireEvent.click(screen.getByTestId('cu-apply'));
      await settle(300);
    }
    expect(screen.getByTestId('cu-message').textContent).toMatch(/^Solved in/);
    expect(calls.results).toEqual([expect.objectContaining({ outcome: 'complete', mode: 'easy' })]);
  });
});
