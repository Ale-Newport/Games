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

describe('Memory Pairs UI', () => {
  it('clears a solo grid by following hints', async () => {
    const { services, calls } = createTestServices({ launchParams: { deal: '6' } });
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mp-opp-solo'));
    fireEvent.click(screen.getByTestId('mp-start'));
    for (let i = 0; i < 200 && !screen.queryByTestId('mp-again'); i++) {
      fireEvent.click(screen.getByTestId('mp-hint'));
      expect(screen.getByTestId('mp-message').textContent).toMatch(/Suggested/);
      fireEvent.click(
        document.querySelector<HTMLButtonElement>('[data-testid^="mp-card-"][class*="hinted"]')!,
      );
    }
    expect(screen.getByTestId('mp-message').textContent).toMatch(/Cleared in \d+ turns/);
    expect(calls.results).toHaveLength(1);
  });

  it('plays against the computer, which takes its turns', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { deal: '2' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('mp-opp-perfect'));
    fireEvent.click(screen.getByTestId('mp-start'));
    for (let i = 0; i < 400 && !screen.queryByTestId('mp-again'); i++) {
      const open = document.querySelector<HTMLButtonElement>(
        '[data-testid^="mp-card-"]:not([disabled])',
      );
      if (open && screen.queryByTestId('mp-hint')) fireEvent.click(open);
      await settle(900);
    }
    expect(screen.getByTestId('mp-message').textContent).toMatch(/win|tie/i);
  });
});
