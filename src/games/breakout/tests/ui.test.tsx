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

describe('breakout UI', () => {
  it('launches, loses every ball when idle, and records the run', async () => {
    vi.useFakeTimers({ ...FAKE, toFake: [...FAKE.toFake] });
    const { services, calls } = createTestServices({ launchParams: { deal: '3' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('bo-start'));
    expect(screen.getByTestId('bo-hud-hud.lives').textContent).toBe('3');
    fireEvent.pointerDown(screen.getByTestId('bo-pad-fire'));
    await settle(100);
    fireEvent.pointerUp(screen.getByTestId('bo-pad-fire'));
    fireEvent.pointerDown(screen.getByTestId('bo-pad-left'));
    for (let i = 0; i < 200 && !screen.queryByTestId('bo-again'); i++) await settle(500);
    expect(screen.getByTestId('bo-overlay').textContent).toMatch(/Game over/);
    expect(screen.getByTestId('bo-hud-hud.lives').textContent).toBe('0');
    expect(calls.results).toHaveLength(1);
  });

  it('watch mode scores by itself', async () => {
    vi.useFakeTimers({ ...FAKE, toFake: [...FAKE.toFake] });
    const { services } = createTestServices({ launchParams: { mode: 'watch', deal: '2' } });
    render(<Game services={services} />);
    for (let i = 0; i < 30; i++) await settle(500);
    expect(Number(screen.getByTestId('bo-hud-hud.score').textContent)).toBeGreaterThan(0);
  });
});
