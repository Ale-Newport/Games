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

describe('Star Duel UI', () => {
  it('hyperspace with the touch pad uses a jump; idling, the duel is lost', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services, calls } = createTestServices({ launchParams: { deal: '1' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('sd-start'));
    expect(screen.getByTestId('sd-hud-hud.jumps').textContent).toBe('3');
    fireEvent.pointerDown(screen.getByTestId('sd-pad-alt'));
    fireEvent.pointerUp(screen.getByTestId('sd-pad-alt'));
    await settle(200);
    expect(screen.getByTestId('sd-hud-hud.jumps').textContent).toBe('2');
    for (let i = 0; i < 120 && !screen.queryByTestId('sd-again'); i++) await settle(1000);
    expect(screen.getByTestId('sd-overlay').textContent).toMatch(/lost the duel/);
    expect(calls.results).toHaveLength(1);
  }, 120_000);

  it('watch mode duels', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services } = createTestServices({ launchParams: { mode: 'watch', deal: '2' } });
    render(<Game services={services} />);
    for (let i = 0; i < 30 && screen.getByTestId('sd-hud-hud.kills').textContent === '0–0'; i++)
      await settle(1000);
    expect(screen.getByTestId('sd-hud-hud.kills').textContent).not.toBe('0–0');
  }, 60_000);
});
