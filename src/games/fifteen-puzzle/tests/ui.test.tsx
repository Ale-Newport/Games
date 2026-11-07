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

describe('15-Puzzle UI', () => {
  it('plays a 4×4 board and solves an easy scramble with hints', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { deal: '3' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('sl-start'));
    await settle(50);
    expect(screen.getByTestId('sl-board').querySelectorAll('[data-tile]')).toHaveLength(15);
    for (let i = 0; i < 60 && !screen.queryByTestId('sl-again'); i++) {
      fireEvent.click(screen.getByTestId('sl-hint'));
      fireEvent.click(screen.getByTestId('sl-apply'));
    }
    expect(screen.getByTestId('sl-message').textContent).toMatch(/^Solved in/);
    expect(calls.results).toEqual([expect.objectContaining({ outcome: 'complete', mode: 'easy' })]);
  });
});
