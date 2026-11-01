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

describe('Naval Battle UI', () => {
  it('places a fleet by hand, then fights to the end with hints', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { deal: '3' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('nb-level-easy'));
    fireEvent.click(screen.getByTestId('nb-start'));
    expect(screen.getByTestId('nb-begin')).toHaveProperty('disabled', true);
    // Five ships along rows A, C, E, G and I.
    for (const row of [0, 2, 4, 6, 8])
      fireEvent.click(screen.getByTestId(`nb-place-grid-${row * 10}`));
    expect(screen.getByTestId('nb-begin')).toHaveProperty('disabled', false);
    // Pick one up and put it back vertically.
    fireEvent.click(screen.getByTestId('nb-place-grid-80'));
    fireEvent.click(screen.getByTestId('nb-rotate'));
    fireEvent.click(screen.getByTestId('nb-place-grid-89'));
    fireEvent.click(screen.getByTestId('nb-begin'));
    for (let i = 0; i < 400 && !screen.queryByTestId('nb-again'); i++) {
      if (screen.queryByTestId('nb-hint')) {
        fireEvent.click(screen.getByTestId('nb-hint'));
        const cell = document.querySelector<HTMLButtonElement>(
          '[data-testid^="nb-enemy-"][class*="hinted"]',
        )!;
        fireEvent.click(cell);
      }
      await settle(800);
    }
    expect(screen.getByTestId('nb-message').textContent).toMatch(/sank|sink/);
    expect(calls.results).toHaveLength(1);
  });

  it('watch mode trades shots by itself', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { mode: 'watch', deal: '2' } });
    render(<Game services={services} />);
    for (let i = 0; i < 6; i++) await settle(500);
    expect(screen.getByTestId('nb-message').textContent).toMatch(/miss|hit|sunk/);
  });
});
