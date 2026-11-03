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

describe('Cloud Climber UI', () => {
  it('she bounces in place on her first cloud; steering hard off it ends in a fall', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services, calls } = createTestServices({ launchParams: { deal: '1' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('cc-start'));
    await settle(4000);
    expect(screen.queryByTestId('cc-again')).toBeNull();
    fireEvent.pointerDown(screen.getByTestId('cc-pad-left'));
    await settle(700);
    fireEvent.pointerUp(screen.getByTestId('cc-pad-left'));
    for (let i = 0; i < 15 && !screen.queryByTestId('cc-again'); i++) await settle(1000);
    expect(screen.getByTestId('cc-overlay').textContent).toMatch(/Fell from the clouds/);
    expect(calls.results).toHaveLength(1);
  });

  it('watch mode climbs', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services } = createTestServices({ launchParams: { mode: 'watch', deal: '2' } });
    render(<Game services={services} />);
    for (let i = 0; i < 12; i++) await settle(1000);
    expect(
      parseInt(screen.getByTestId('cc-hud-hud.height').textContent ?? '0', 10),
    ).toBeGreaterThan(50);
  }, 60_000);
});
