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

describe('Circuit Sprint UI', () => {
  it('the clock starts after the lights; standing on the grid you fall to last', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services } = createTestServices({ launchParams: { deal: '1' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('tr-start'));
    expect(screen.getByTestId('tr-hud-hud.time').textContent).toBe('0.0');
    fireEvent.pointerDown(screen.getByTestId('tr-pad-up'));
    await settle(4000);
    fireEvent.pointerUp(screen.getByTestId('tr-pad-up'));
    expect(Number(screen.getByTestId('tr-hud-hud.time').textContent)).toBeGreaterThan(0);
    await settle(8000);
    expect(screen.getByTestId('tr-hud-hud.place').textContent).toBe('4');
  });

  it('watch mode races laps', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services } = createTestServices({ launchParams: { mode: 'watch', deal: '2' } });
    render(<Game services={services} />);
    for (let i = 0; i < 15; i++) await settle(1000);
    expect(screen.getByTestId('tr-hud-hud.lap').textContent).not.toBe('1/3');
  }, 60_000);
});
