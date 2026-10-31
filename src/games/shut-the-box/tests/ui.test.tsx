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

describe('Shut the Box UI', () => {
  it('plays a solo game to the end by hints and tile taps', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { deal: '3' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('sb-start'));
    await settle(10);
    for (let i = 0; i < 30 && !screen.queryByTestId('sb-again'); i++) {
      if (screen.queryByTestId('sb-roll')) fireEvent.click(screen.getByTestId('sb-roll'));
      if (screen.queryByTestId('sb-shut')) {
        fireEvent.click(screen.getByTestId('sb-hint'));
        expect(screen.getByTestId('sb-message').textContent).toMatch(/Best: shut/);
        fireEvent.click(screen.getByTestId('sb-shut'));
      }
      await settle(50);
    }
    expect(screen.getByTestId('sb-again')).toBeTruthy();
    expect(calls.results).toHaveLength(1);
  });
});
