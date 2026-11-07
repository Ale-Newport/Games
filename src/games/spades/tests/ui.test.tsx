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

describe('Spades UI', () => {
  it('bids with the hint and plays a legal card', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { deal: '1' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('spades-difficulty-easy'));
    fireEvent.click(screen.getByTestId('spades-start'));
    expect(screen.getByTestId('spades-status').textContent).toBe(
      'Your bid: how many tricks will you take?',
    );
    fireEvent.click(screen.getByTestId('spades-hint'));
    expect(screen.getByTestId('spades-hint-text').textContent).toMatch(/^Medium would bid /);
    fireEvent.keyDown(window, { key: '3' });
    expect(screen.queryByTestId('spades-bids')).toBeNull();
    for (let k = 0; k < 6; k++) await settle(1000);
    expect(screen.getByTestId('trick-seat-0').textContent).toContain('Bid 3');
    const playable = [
      ...screen.getByTestId('trick-hand').querySelectorAll('button:not([disabled])'),
    ];
    expect(playable.length).toBeGreaterThan(0);
    fireEvent.click(playable[0]!);
    expect(screen.getByTestId('trick-hand').querySelectorAll('button')).toHaveLength(12);
    expect(calls.saves.length).toBeGreaterThan(0);
  });

  it('watches four AI players', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { mode: 'watch', deal: '2' } });
    render(<Game services={services} />);
    for (let k = 0; k < 8; k++) await settle(1000);
    expect(screen.getByTestId('spades-us').textContent).toMatch(/^Elena .* \/ Bruno/);
    expect(screen.getByTestId('trick-seat-1').textContent).toMatch(/Bid|Nil/);
  });
});
