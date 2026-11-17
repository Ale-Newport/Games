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

const fake = () =>
  vi.useFakeTimers({
    toFake: [
      'setTimeout',
      'clearTimeout',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'performance',
      'Date',
    ],
  });

describe('Cell Arena UI', () => {
  it('standing still among hunters gets eaten; the run is recorded', async () => {
    fake();
    const { services, calls } = createTestServices({ launchParams: { deal: '4' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('ca-bots-25'));
    fireEvent.click(screen.getByTestId('ca-level-hard'));
    fireEvent.click(screen.getByTestId('ca-start'));
    expect(screen.getByTestId('ca-hud-hud.mass').textContent).toBe('12');
    // Holding still: sooner or later a hunter comes for you.
    for (let i = 0; i < 400 && !screen.queryByTestId('ca-again'); i++) await settle(1000);
    expect(screen.getByTestId('ca-overlay').textContent).toMatch(/eaten|gone/);
    expect(calls.results).toHaveLength(1);
  }, 120_000);
});
