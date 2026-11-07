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

describe('Bridges UI', () => {
  it('explains hints, undoes, and records a solve', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { deal: '7' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('hashi-start'));
    await settle(50);
    fireEvent.click(screen.getByTestId('hashi-hint'));
    expect(screen.getByTestId('hashi-message').textContent).toMatch(/R\dC\d/);
    fireEvent.click(screen.getByTestId('hashi-fill'));
    const drawn = () =>
      [...screen.getByTestId('hashi-board').querySelectorAll('[data-pair]')].filter(
        (g) => g.getAttribute('data-value') !== '0',
      ).length;
    expect(drawn()).toBe(1);
    fireEvent.click(screen.getByTestId('hashi-undo'));
    expect(drawn()).toBe(0);
    for (let i = 0; i < 80 && !screen.queryByTestId('hashi-again'); i++) {
      fireEvent.click(screen.getByTestId('hashi-hint'));
      fireEvent.click(screen.getByTestId('hashi-fill'));
    }
    expect(screen.getByTestId('hashi-message').textContent).toMatch(/^Solved in/);
    expect(calls.results).toEqual([expect.objectContaining({ outcome: 'complete', mode: 'easy' })]);
  });
});
