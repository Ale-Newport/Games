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

describe('Gem Digger UI', () => {
  it('digs with the touch pad while the clock runs', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services } = createTestServices({ launchParams: { deal: '1' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('bd-start'));
    expect(screen.getByTestId('bd-hud-hud.time').textContent).toBe('150');
    fireEvent.pointerDown(screen.getByTestId('bd-pad-down'));
    await settle(1000);
    fireEvent.pointerUp(screen.getByTestId('bd-pad-down'));
    await settle(1000);
    expect(Number(screen.getByTestId('bd-hud-hud.time').textContent)).toBeLessThan(150);
  });

  it('watch mode collects gems', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services } = createTestServices({ launchParams: { mode: 'watch', deal: '1' } });
    render(<Game services={services} />);
    for (let i = 0; i < 30 && screen.getByTestId('bd-hud-hud.score').textContent === '0'; i++)
      await settle(1000);
    expect(Number(screen.getByTestId('bd-hud-hud.score').textContent)).toBeGreaterThan(0);
  }, 120_000);
});
