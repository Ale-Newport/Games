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
const FAKE = [
  'setTimeout',
  'clearTimeout',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'performance',
  'Date',
] as const;

describe('Girder Climb UI', () => {
  it('walks and jumps with the touch pad, and drums end the run', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services, calls } = createTestServices({ launchParams: { deal: '3' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('gc-start'));
    expect(screen.getByTestId('gc-hud-hud.bonus').textContent).toBe('5000');
    fireEvent.pointerDown(screen.getByTestId('gc-pad-fire'));
    fireEvent.pointerUp(screen.getByTestId('gc-pad-fire'));
    await settle(1000);
    // Standing still at the bottom, the drums take all three lives.
    for (let i = 0; i < 300 && !screen.queryByTestId('gc-again'); i++) await settle(1000);
    expect(screen.getByTestId('gc-overlay').textContent).toMatch(/Game over/);
    expect(calls.results).toHaveLength(1);
  }, 60_000);

  it('watch mode climbs by itself', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services } = createTestServices({ launchParams: { mode: 'watch', deal: '5' } });
    render(<Game services={services} />);
    for (let i = 0; i < 60 && Number(screen.getByTestId('gc-hud-hud.score').textContent) < 100; i++)
      await settle(1000);
    expect(Number(screen.getByTestId('gc-hud-hud.score').textContent)).toBeGreaterThanOrEqual(100);
  }, 60_000);
});
