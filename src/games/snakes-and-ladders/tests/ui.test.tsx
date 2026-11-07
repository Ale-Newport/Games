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

describe('Snakes and Ladders UI', () => {
  it('plays a classic game against the computer to the end', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { deal: '7' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('sl-start'));
    await settle(10);
    for (let i = 0; i < 400 && !screen.queryByTestId('sl-again'); i++) {
      if (screen.queryByTestId('sl-roll')) fireEvent.click(screen.getByTestId('sl-roll'));
      await settle(700);
    }
    expect(screen.getByTestId('sl-message').textContent).toMatch(/reach(es)? 100/);
    expect(calls.results).toHaveLength(1);
  });

  it('in Choice, a hint names a die and the die moves the counter', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { deal: '7' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('sl-variant-choice'));
    fireEvent.click(screen.getByTestId('sl-start'));
    await settle(10);
    fireEvent.click(screen.getByTestId('sl-roll'));
    fireEvent.click(screen.getByTestId('sl-hint'));
    expect(screen.getByTestId('sl-message').textContent).toMatch(/Suggested: use the \d/);
    fireEvent.click(screen.getByTestId('sl-die-0'));
    expect(screen.getByTestId('sl-player-0').textContent).not.toMatch(/· 0$/);
  });
});
