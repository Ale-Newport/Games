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

describe('Blast Arena UI', () => {
  it('walking and dropping a bomb with the touch pad; the round clock runs', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services } = createTestServices({ launchParams: { deal: '1' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('ba-start'));
    expect(screen.getByTestId('ba-hud-hud.wins').textContent).toBe('0–0');
    fireEvent.pointerDown(screen.getByTestId('ba-pad-fire'));
    fireEvent.pointerUp(screen.getByTestId('ba-pad-fire'));
    fireEvent.pointerDown(screen.getByTestId('ba-pad-down'));
    await settle(800);
    fireEvent.pointerUp(screen.getByTestId('ba-pad-down'));
    await settle(3000);
    expect(Number(screen.getByTestId('ba-hud-hud.time').textContent)).toBeLessThan(120);
  });

  it('watch mode blasts crates', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services } = createTestServices({ launchParams: { mode: 'watch', deal: '2' } });
    render(<Game services={services} />);
    for (let i = 0; i < 30 && screen.getByTestId('ba-hud-hud.score').textContent === '0'; i++)
      await settle(1000);
    expect(Number(screen.getByTestId('ba-hud-hud.score').textContent)).toBeGreaterThan(0);
  }, 60_000);
});
