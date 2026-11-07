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

describe('Cube Hopper UI', () => {
  it('a hop with the touch pad colours a cube; standing still, the enemies win', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services, calls } = createTestServices({ launchParams: { deal: '1' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('th-start'));
    fireEvent.pointerDown(screen.getByTestId('th-pad-right'));
    fireEvent.pointerUp(screen.getByTestId('th-pad-right'));
    await settle(500);
    expect(screen.getByTestId('th-hud-hud.score').textContent).toBe('25');
    for (let i = 0; i < 200 && !screen.queryByTestId('th-again'); i++) await settle(1000);
    expect(screen.getByTestId('th-overlay').textContent).toMatch(/Game over/);
    expect(calls.results).toHaveLength(1);
  }, 60_000);

  it('watch mode colours cubes', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services } = createTestServices({ launchParams: { mode: 'watch', deal: '2' } });
    render(<Game services={services} />);
    for (let i = 0; i < 10; i++) await settle(1000);
    expect(Number(screen.getByTestId('th-hud-hud.score').textContent)).toBeGreaterThan(100);
  }, 60_000);
});
