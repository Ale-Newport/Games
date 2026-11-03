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

describe('Neon Trails UI', () => {
  it('turning into the edge with the touch pad loses the round', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services } = createTestServices({ launchParams: { deal: '1' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('lc-start'));
    fireEvent.pointerDown(screen.getByTestId('lc-pad-up'));
    fireEvent.pointerUp(screen.getByTestId('lc-pad-up'));
    await settle(4000);
    expect(screen.getByTestId('lc-hud-hud.wins').textContent).toBe('0–1');
  });

  it('watch mode races', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services } = createTestServices({ launchParams: { mode: 'watch', deal: '2' } });
    render(<Game services={services} />);
    for (let i = 0; i < 6; i++) await settle(1000);
    expect(Number(screen.getByTestId('lc-hud-hud.score').textContent)).toBeGreaterThan(20);
  }, 60_000);
});
