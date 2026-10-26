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

describe('Seven Card Stud UI', () => {
  it('shows antes and the bring-in, hides only the down cards, and plays to fourth street', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { deal: '5' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('poker-opponents-2'));
    fireEvent.click(screen.getByTestId('poker-start'));
    expect(screen.getByTestId('poker').textContent).toContain('Ante 2 · Bring-in 10 · Bets 20/40');
    expect(screen.getByTestId('poker-phase').textContent).toBe('Third street');
    // Each opponent shows one card and hides two; the player's two down cards are marked.
    expect(screen.getAllByRole('img', { name: 'face-down card' })).toHaveLength(4);
    expect(screen.getAllByRole('img', { name: /only you see it/ })).toHaveLength(2);
    for (
      let k = 0;
      k < 10 && screen.getByTestId('poker-phase').textContent === 'Third street';
      k++
    ) {
      const call = screen.queryByTestId('poker-call');
      if (call) fireEvent.click(call);
      await settle(1000);
    }
    expect(screen.getByTestId('poker-phase').textContent).toBe('Fourth street');
    expect(screen.getAllByRole('img', { name: 'face-down card' })).toHaveLength(4);
  });

  it('offers to complete the bring-in', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { deal: '5' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('poker-opponents-1'));
    fireEvent.click(screen.getByTestId('poker-start'));
    for (let k = 0; k < 4 && !screen.queryByTestId('poker-raise'); k++) await settle(1000);
    expect(screen.getByTestId('poker-raise').textContent).toMatch(/Complete to 20|Raise to 40/);
  });
});
