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

describe('Bridge UI', () => {
  it('bids with the box, passes the auction out to a contract and plays a card', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { deal: '2' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('bridge-start'));
    expect(screen.getByTestId('bridge-status').textContent).toBe('Your call');
    fireEvent.click(screen.getByTestId('bridge-hint'));
    expect(screen.getByTestId('bridge-hint-text').textContent).toBe('Medium would call 1♦.');
    expect(screen.getByTestId('bridge-bid:1C')).toHaveProperty('disabled', false);
    fireEvent.click(screen.getByTestId('bridge-bid:1D'));
    for (let k = 0; k < 4; k++) await settle(1000);
    // Partner jumped to game; pass it out.
    fireEvent.keyDown(window, { key: 'p' });
    for (let k = 0; k < 4; k++) await settle(1000);
    expect(screen.getByTestId('bridge-contract').textContent).toContain('4♥ by North');
    // North declares: the player plays dummy (south) and north.
    const mine = [...screen.getByTestId('trick-hand').querySelectorAll('button:not([disabled])')];
    expect(mine.length).toBeGreaterThan(0);
    fireEvent.click(mine[0]!);
    await settle(1000);
    const north = [
      ...screen.getByTestId('trick-seat-2').querySelectorAll('button:not([disabled])'),
    ];
    expect(north.length).toBeGreaterThan(0);
    fireEvent.click(north[0]!);
    expect(screen.getByTestId('trick-cards').querySelectorAll('[role="img"]')).toHaveLength(4);
    expect(calls.saves.length).toBeGreaterThan(0);
  });
});
