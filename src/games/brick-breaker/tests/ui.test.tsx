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

const FAKE = {
  toFake: [
    'setTimeout',
    'clearTimeout',
    'requestAnimationFrame',
    'cancelAnimationFrame',
    'performance',
    'Date',
  ],
} as const;

describe('brick-breaker UI', () => {
  it('launches, loses every ball when idle, and records the run', async () => {
    vi.useFakeTimers({ ...FAKE, toFake: [...FAKE.toFake] });
    const { services, calls } = createTestServices({ launchParams: { deal: '3' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('bb-start'));
    expect(screen.getByTestId('bb-hud-hud.lives').textContent).toBe('3');
    fireEvent.pointerDown(screen.getByTestId('bb-pad-fire'));
    await settle(100);
    fireEvent.pointerUp(screen.getByTestId('bb-pad-fire'));
    fireEvent.pointerDown(screen.getByTestId('bb-pad-left'));
    for (let i = 0; i < 200 && !screen.queryByTestId('bb-again'); i++) await settle(500);
    expect(screen.getByTestId('bb-overlay').textContent).toMatch(/Game over/);
    expect(screen.getByTestId('bb-hud-hud.lives').textContent).toBe('0');
    expect(calls.results).toHaveLength(1);
  });

  it('watch mode scores by itself', async () => {
    vi.useFakeTimers({ ...FAKE, toFake: [...FAKE.toFake] });
    const { services } = createTestServices({ launchParams: { mode: 'watch', deal: '2' } });
    render(<Game services={services} />);
    for (let i = 0; i < 30; i++) await settle(500);
    expect(Number(screen.getByTestId('bb-hud-hud.score').textContent)).toBeGreaterThan(0);
  });
});
