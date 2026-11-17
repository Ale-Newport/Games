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

const fake = () =>
  vi.useFakeTimers({
    toFake: [
      'setTimeout',
      'clearTimeout',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'performance',
      'Date',
    ],
  });

describe('Stack Duel UI', () => {
  it('loses a one-round duel by hard-dropping in place, and records it', async () => {
    fake();
    const { services, calls } = createTestServices({ launchParams: { deal: '3' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('sd-mode-versus'));
    fireEvent.click(screen.getByTestId('sd-bot-expert'));
    fireEvent.click(screen.getByTestId('sd-rounds-1'));
    fireEvent.click(screen.getByTestId('sd-start'));
    const drop = screen.getByTestId('sd-pad-fire');
    for (let i = 0; i < 400 && !screen.queryByTestId('sd-again'); i++) {
      fireEvent.pointerDown(drop);
      await settle(50);
      fireEvent.pointerUp(drop);
      await settle(50);
    }
    expect(screen.getByTestId('sd-overlay').textContent).toMatch(/bot wins the match 1–0/);
    expect(screen.getByTestId('sd-hud-hud.bot').textContent).toBe('1');
    expect(calls.results).toHaveLength(1);
  });

  it('watch mode plays a versus match and attacks', async () => {
    fake();
    const { services } = createTestServices({ launchParams: { mode: 'watch', deal: '2' } });
    render(<Game services={services} />);
    await settle(0);
    for (let i = 0; i < 60; i++) await settle(500);
    expect(Number(screen.getByTestId('sd-hud-hud.apm').textContent)).toBeGreaterThan(0);
  });
});
