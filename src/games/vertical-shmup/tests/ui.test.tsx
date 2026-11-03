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

describe('Nebula Strike UI', () => {
  it('a bomb from the touch pad; standing still, the fighter is shot down', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services, calls } = createTestServices({ launchParams: { deal: '1' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('ns-start'));
    fireEvent.pointerDown(screen.getByTestId('ns-pad-alt'));
    fireEvent.pointerUp(screen.getByTestId('ns-pad-alt'));
    await settle(200);
    expect(screen.getByTestId('ns-hud-hud.bombs').textContent).toBe('2');
    for (let i = 0; i < 200 && !screen.queryByTestId('ns-again'); i++) await settle(1000);
    expect(screen.getByTestId('ns-overlay').textContent).toMatch(/Shot down/);
    expect(calls.results).toHaveLength(1);
  }, 120_000);

  it('watch mode scores', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services } = createTestServices({ launchParams: { mode: 'watch', deal: '2' } });
    render(<Game services={services} />);
    for (let i = 0; i < 10; i++) await settle(1000);
    expect(Number(screen.getByTestId('ns-hud-hud.score').textContent)).toBeGreaterThan(0);
  }, 60_000);
});
