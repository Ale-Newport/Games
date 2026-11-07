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

describe('Cribbage UI', () => {
  it('throws to the crib with the hint and lays a card', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { deal: '1' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('cribbage-start'));
    expect(screen.getByTestId('cribbage-status').textContent).toBe(
      'Pick two cards for the opponent’s crib',
    );
    fireEvent.click(screen.getByTestId('cribbage-hint'));
    expect(screen.getByTestId('cribbage-hint-text').textContent).toMatch(/^Hard would throw: /);
    fireEvent.keyDown(window, { key: 't' });
    for (let k = 0; k < 3; k++) await settle(1000);
    expect(screen.getByTestId('cribbage-status').textContent).toBe('Your card');
    const cards = [
      ...screen.getByTestId('cribbage-hand').querySelectorAll('button:not([disabled])'),
    ];
    fireEvent.click(cards[0]!);
    expect(screen.getByTestId('cribbage-log').textContent).toMatch(/^You: .+ → \d+/);
    expect(screen.getByTestId('cribbage-hand').querySelectorAll('button')).toHaveLength(3);
    expect(calls.saves.length).toBeGreaterThan(0);
  });
});
