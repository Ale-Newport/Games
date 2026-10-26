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

describe('Gin rummy UI', () => {
  it('draws, selects a card with the hint, throws it and waits for the opponent', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { deal: '1' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('gin-start'));
    expect(screen.getByTestId('gin-status').textContent).toBe(
      'Draw from the stock or the discard pile',
    );
    fireEvent.click(screen.getByTestId('gin-stock'));
    expect(screen.getByTestId('gin-hand').querySelectorAll('button')).toHaveLength(11);
    fireEvent.keyDown(window, { key: 'h' });
    expect(screen.getByTestId('gin-hint-text').textContent).toMatch(/^Hard would (throw|knock)/);
    expect(screen.getByTestId('gin-status').textContent).toMatch(/^Throw the /);
    fireEvent.click(screen.getByTestId('gin-throw'));
    expect(screen.getByTestId('gin-hand').querySelectorAll('button')).toHaveLength(10);
    // The opponent draws, then throws.
    for (let k = 0; k < 3; k++) await settle(1000);
    expect(screen.getByTestId('gin-status').textContent).toBe(
      'Draw from the stock or the discard pile',
    );
    expect(calls.saves.length).toBeGreaterThan(0);
  });
});
