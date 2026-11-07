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

describe('Garden Guard UI', () => {
  it('squirting with the touch pad scores, and standing still the caterpillar wins', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services, calls } = createTestServices({ launchParams: { deal: '1' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('gg-start'));
    fireEvent.pointerDown(screen.getByTestId('gg-pad-fire'));
    await settle(3000);
    fireEvent.pointerUp(screen.getByTestId('gg-pad-fire'));
    expect(Number(screen.getByTestId('gg-hud-hud.score').textContent)).toBeGreaterThan(0);
    for (let i = 0; i < 200 && !screen.queryByTestId('gg-again'); i++) await settle(1000);
    expect(screen.getByTestId('gg-overlay').textContent).toMatch(/overrun/);
    expect(calls.results).toHaveLength(1);
  }, 60_000);

  it('watch mode squirts segments', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services } = createTestServices({ launchParams: { mode: 'watch', deal: '2' } });
    render(<Game services={services} />);
    for (let i = 0; i < 15; i++) await settle(1000);
    expect(Number(screen.getByTestId('gg-hud-hud.score').textContent)).toBeGreaterThan(50);
  }, 60_000);
});
