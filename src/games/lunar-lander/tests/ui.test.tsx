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

describe('Moon Touchdown UI', () => {
  it('the engine button burns fuel; falling freely ends in a crash', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services } = createTestServices({ launchParams: { deal: '1' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('ll-start'));
    fireEvent.pointerDown(screen.getByTestId('ll-pad-fire'));
    await settle(500);
    fireEvent.pointerUp(screen.getByTestId('ll-pad-fire'));
    expect(Number(screen.getByTestId('ll-hud-hud.fuel').textContent)).toBeLessThan(1500);
    for (let i = 0; i < 10 && screen.getByTestId('ll-hud-hud.round').textContent === '1'; i++)
      await settle(1000);
    // A free fall crashes: 200 fuel lost, and round 2 begins.
    expect(Number(screen.getByTestId('ll-hud-hud.fuel').textContent)).toBeLessThan(1300);
    expect(screen.getByTestId('ll-hud-hud.round').textContent).toBe('2');
  });

  it('watch mode lands', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services } = createTestServices({ launchParams: { mode: 'watch', deal: '2' } });
    render(<Game services={services} />);
    for (let i = 0; i < 30 && screen.getByTestId('ll-hud-hud.score').textContent === '0'; i++)
      await settle(1000);
    expect(Number(screen.getByTestId('ll-hud-hud.score').textContent)).toBeGreaterThan(0);
  }, 60_000);
});
