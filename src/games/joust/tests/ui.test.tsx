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

describe('Sky Lances UI', () => {
  it('flaps with the touch pad; standing still, the riders win in the end', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services, calls } = createTestServices({ launchParams: { deal: '1' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('sl-start'));
    fireEvent.pointerDown(screen.getByTestId('sl-pad-fire'));
    fireEvent.pointerUp(screen.getByTestId('sl-pad-fire'));
    await settle(500);
    for (let i = 0; i < 400 && !screen.queryByTestId('sl-again'); i++) await settle(1000);
    expect(screen.getByTestId('sl-overlay').textContent).toMatch(/Unhorsed/);
    expect(calls.results).toHaveLength(1);
  }, 120_000);

  it('watch mode jousts', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services } = createTestServices({ launchParams: { mode: 'watch', deal: '2' } });
    render(<Game services={services} />);
    for (let i = 0; i < 40 && screen.getByTestId('sl-hud-hud.score').textContent === '0'; i++)
      await settle(1000);
    expect(Number(screen.getByTestId('sl-hud-hud.score').textContent)).toBeGreaterThan(0);
  }, 60_000);
});
