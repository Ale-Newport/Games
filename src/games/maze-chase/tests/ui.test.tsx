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

describe('Maze Chase UI', () => {
  it('steers with the touch pad, eats seeds and is caught in the end', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services, calls } = createTestServices({ launchParams: { deal: '3' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('mc-start'));
    expect(screen.getByTestId('mc-hud-hud.lives').textContent).toBe('3');
    fireEvent.pointerDown(screen.getByTestId('mc-pad-left'));
    await settle(100);
    fireEvent.pointerUp(screen.getByTestId('mc-pad-left'));
    await settle(2000);
    expect(Number(screen.getByTestId('mc-hud-hud.score').textContent)).toBeGreaterThan(0);
    // Standing still, the sentinels take all three lives.
    for (let i = 0; i < 400 && !screen.queryByTestId('mc-again'); i++) await settle(1000);
    expect(screen.getByTestId('mc-overlay').textContent).toMatch(/Game over/);
    expect(calls.results).toHaveLength(1);
  }, 60_000);

  it('watch mode eats seeds by itself', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services } = createTestServices({ launchParams: { mode: 'watch', deal: '2' } });
    render(<Game services={services} />);
    for (let i = 0; i < 10; i++) await settle(500);
    expect(Number(screen.getByTestId('mc-hud-hud.score').textContent)).toBeGreaterThan(100);
  });
});
