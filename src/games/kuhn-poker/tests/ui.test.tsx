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

describe('Kuhn poker UI', () => {
  it('plays a hand against Nash with the coach on, then deals the next', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { deal: '1' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('hu-start'));
    expect(screen.getByTestId('hu-status').textContent).toBe('Your move');
    expect(screen.getByTestId('hu-card-1').getAttribute('aria-label')).toBe('face-down card');
    fireEvent.click(screen.getByTestId('hu-coach'));
    expect(screen.getByTestId('hu-check').textContent).toMatch(/Check\d+%/);
    fireEvent.keyDown(window, { key: 'b' });
    expect(screen.getByTestId('hu-log').textContent).toBe('You: bets');
    await settle(1000);
    // The opponent called or folded: the hand is over.
    expect(screen.getByTestId('hu-next')).toBeTruthy();
    expect(screen.getByTestId('hu-ai-mix').textContent).toMatch(
      /The opponent’s strategy: (calls|folds) \(\d+% in its spot\)/,
    );
    expect(calls.saves.length).toBeGreaterThan(0);
    fireEvent.keyDown(window, { key: 'n' });
    expect(screen.getByTestId('hu-hand').textContent).toBe('2');
  });

  it('watches Nash against Medium', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { mode: 'watch', deal: '2' } });
    render(<Game services={services} />);
    await settle(0);
    expect(screen.getByTestId('hu-card-0').getAttribute('aria-label')).not.toBe('face-down card');
    await settle(5000);
    expect(screen.getByTestId('hu-log').textContent).not.toBe('');
    expect(calls.results).toHaveLength(0);
  });
});
