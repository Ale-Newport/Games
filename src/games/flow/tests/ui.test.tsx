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

describe('Color Links UI', () => {
  it('reveals paths with hints until solved, and clears', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { deal: '3' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('fl-start'));
    await settle(50);
    expect(screen.getByTestId('fl-linked').textContent).toBe('Pairs 0/5');
    fireEvent.click(screen.getByTestId('fl-hint'));
    expect(screen.getByTestId('fl-linked').textContent).toBe('Pairs 1/5');
    fireEvent.click(screen.getByTestId('fl-clear'));
    expect(screen.getByTestId('fl-linked').textContent).toBe('Pairs 0/5');
    for (let i = 0; i < 8 && !screen.queryByTestId('fl-again'); i++)
      fireEvent.click(screen.getByTestId('fl-hint'));
    expect(screen.getByTestId('fl-message').textContent).toMatch(/^All linked/);
    expect(calls.results).toEqual([expect.objectContaining({ outcome: 'complete', mode: 'easy' })]);
  });
});
