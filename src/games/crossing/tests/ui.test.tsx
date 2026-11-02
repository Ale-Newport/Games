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

describe('Hedgehog Crossing UI', () => {
  it('hops with the touch pad and the run ends', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services, calls } = createTestServices({ launchParams: { deal: '3' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('cr-start'));
    fireEvent.pointerDown(screen.getByTestId('cr-pad-up'));
    fireEvent.pointerUp(screen.getByTestId('cr-pad-up'));
    await settle(200);
    expect(screen.getByTestId('cr-hud-hud.score').textContent).toBe('10');
    // Standing still, the run ends.
    for (let i = 0; i < 200 && !screen.queryByTestId('cr-again'); i++) await settle(1000);
    expect(screen.getByTestId('cr-overlay').textContent).toMatch(/Game over/);
    expect(calls.results).toHaveLength(1);
  }, 60_000);

  it('watch mode makes progress by itself', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services } = createTestServices({ launchParams: { mode: 'watch', deal: '2' } });
    render(<Game services={services} />);
    for (let i = 0; i < 10; i++) await settle(500);
    expect(Number(screen.getByTestId('cr-hud-hud.score').textContent)).toBeGreaterThan(2);
  }, 30_000);
});
