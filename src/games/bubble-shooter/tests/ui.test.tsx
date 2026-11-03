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

describe('Bubble Cannon UI', () => {
  it('firing straight up counts down to a new row, and enough misses bury the cannon', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services, calls } = createTestServices({ launchParams: { deal: '1' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('bq-start'));
    expect(screen.getByTestId('bq-hud-hud.row').textContent).toBe('7');
    for (let i = 0; i < 120 && !screen.queryByTestId('bq-again'); i++) {
      fireEvent.pointerDown(screen.getByTestId('bq-pad-fire'));
      await settle(50);
      fireEvent.pointerUp(screen.getByTestId('bq-pad-fire'));
      await settle(700);
    }
    expect(screen.getByTestId('bq-overlay').textContent).toMatch(/reached the line/);
    expect(calls.results).toHaveLength(1);
  }, 60_000);

  it('watch mode pops bubbles', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services } = createTestServices({ launchParams: { mode: 'watch', deal: '2' } });
    render(<Game services={services} />);
    for (let i = 0; i < 12; i++) await settle(1000);
    expect(Number(screen.getByTestId('bq-hud-hud.score').textContent)).toBeGreaterThan(50);
  }, 60_000);
});
