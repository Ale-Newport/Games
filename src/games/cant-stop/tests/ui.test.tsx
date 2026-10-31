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

describe('Summit Rush UI', () => {
  it('plays a whole game against the cautious computer, with hints', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { deal: '5' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('sr-level-easy'));
    fireEvent.click(screen.getByTestId('sr-start'));
    await settle(10);
    let hinted = 0;
    for (let i = 0; i < 4000 && !screen.queryByTestId('sr-again'); i++) {
      if (screen.queryByTestId('sr-roll') || screen.queryByTestId('sr-opt-0')) {
        // Follow the hint every time: it names the move and highlights it.
        fireEvent.click(screen.getByTestId('sr-hint'));
        const msg = screen.getByTestId('sr-message').textContent!;
        expect(msg).toMatch(
          /Suggested: (roll again|stop now) \(\d+% chance of a bust\)|Suggested: climb \d+( \+ \d+)?\./,
        );
        hinted++;
        const primary = screen
          .getAllByRole('button')
          .find(
            (b) =>
              b.className.includes('btn-primary') &&
              /sr-(roll|stop|opt-\d)/.test(b.dataset.testid ?? ''),
          );
        fireEvent.click(primary!);
      }
      await settle(1000);
    }
    expect(hinted).toBeGreaterThan(5);
    expect(screen.getByTestId('sr-message').textContent).toMatch(/win/);
    expect(calls.results).toHaveLength(1);
  });
});
