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

describe('Invaders UI', () => {
  it('fires from the touch pad, then loses every cannon standing still', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services, calls } = createTestServices({ launchParams: { deal: '3' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('iv-start'));
    expect(screen.getByTestId('iv-hud-hud.lives').textContent).toBe('3');
    for (let i = 0; i < 200 && !screen.queryByTestId('iv-again'); i++) await settle(500);
    expect(screen.getByTestId('iv-overlay').textContent).toMatch(/Game over|landed/);
    expect(calls.results).toHaveLength(1);
  });

  it('watch mode scores by itself', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services } = createTestServices({ launchParams: { mode: 'watch', deal: '2' } });
    render(<Game services={services} />);
    for (let i = 0; i < 30; i++) await settle(500);
    expect(Number(screen.getByTestId('iv-hud-hud.score').textContent)).toBeGreaterThan(0);
  });
});
