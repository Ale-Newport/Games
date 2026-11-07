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

describe('Spike Hop UI', () => {
  it('running right with the touch pad ends on the first spikes', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services } = createTestServices();
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('pp-start'));
    expect(screen.getByTestId('pp-hud-hud.room').textContent).toBe('1/8');
    fireEvent.pointerDown(screen.getByTestId('pp-pad-right'));
    await settle(3000);
    fireEvent.pointerUp(screen.getByTestId('pp-pad-right'));
    expect(Number(screen.getByTestId('pp-hud-hud.deaths').textContent)).toBeGreaterThan(0);
  });

  it('watch mode clears rooms', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services } = createTestServices({ launchParams: { mode: 'watch' } });
    render(<Game services={services} />);
    for (let i = 0; i < 20 && screen.getByTestId('pp-hud-hud.room').textContent === '1/8'; i++)
      await settle(1000);
    for (let i = 0; i < 10; i++) await settle(1000);
    expect(screen.getByTestId('pp-hud-hud.room').textContent).not.toBe('1/8');
  }, 60_000);
});
