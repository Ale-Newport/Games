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

describe('Classic Snake UI', () => {
  it('turns with the touch pad and runs into a wall', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services, calls } = createTestServices({ launchParams: { deal: '3' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('sn-start'));
    expect(screen.getByTestId('sn-hud-hud.length').textContent).toBe('3');
    fireEvent.pointerDown(screen.getByTestId('sn-pad-up'));
    await settle(300);
    fireEvent.pointerUp(screen.getByTestId('sn-pad-up'));
    for (let i = 0; i < 40 && !screen.queryByTestId('sn-again'); i++) await settle(500);
    expect(screen.getByTestId('sn-overlay').textContent).toMatch(/Crashed/);
    expect(calls.results).toHaveLength(1);
  });

  it('watch mode eats apples by itself', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services } = createTestServices({ launchParams: { mode: 'watch', deal: '2' } });
    render(<Game services={services} />);
    for (let i = 0; i < 30; i++) await settle(500);
    expect(Number(screen.getByTestId('sn-hud-hud.length').textContent)).toBeGreaterThan(3);
  });
});
