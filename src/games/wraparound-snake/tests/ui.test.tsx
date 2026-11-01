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

describe('Wraparound Snake UI', () => {
  it('a one-minute sprint ends on time', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services, calls } = createTestServices({ launchParams: { deal: '3' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('ws-run-sprint'));
    fireEvent.click(screen.getByTestId('ws-start'));
    expect(screen.getByTestId('ws-hud-hud.time').textContent).toBe('60');
    // Through the edge and back: no walls here.
    fireEvent.pointerDown(screen.getByTestId('ws-pad-up'));
    await settle(300);
    fireEvent.pointerUp(screen.getByTestId('ws-pad-up'));
    for (let i = 0; i < 140 && !screen.queryByTestId('ws-again'); i++) await settle(500);
    expect(screen.getByTestId('ws-overlay').textContent).toMatch(/Time!/);
    expect(calls.results).toHaveLength(1);
  });

  it('watch mode eats apples by itself', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services } = createTestServices({ launchParams: { mode: 'watch', deal: '2' } });
    render(<Game services={services} />);
    for (let i = 0; i < 30; i++) await settle(500);
    expect(Number(screen.getByTestId('ws-hud-hud.length').textContent)).toBeGreaterThan(3);
  });
});
