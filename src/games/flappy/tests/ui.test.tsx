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

describe('Puffin Flap UI', () => {
  it('one flap starts the flight, and without more it ends in the sea', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services, calls } = createTestServices({ launchParams: { deal: '1' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('fp-start'));
    await settle(1000);
    // Still hovering.
    expect(screen.queryByTestId('fp-again')).toBeNull();
    fireEvent.pointerDown(screen.getByTestId('fp-pad-fire'));
    fireEvent.pointerUp(screen.getByTestId('fp-pad-fire'));
    for (let i = 0; i < 10 && !screen.queryByTestId('fp-again'); i++) await settle(1000);
    expect(screen.getByTestId('fp-overlay').textContent).toMatch(/Splash/);
    expect(calls.results).toHaveLength(1);
  });

  it('watch mode passes stacks', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services } = createTestServices({ launchParams: { mode: 'watch', deal: '2' } });
    render(<Game services={services} />);
    for (let i = 0; i < 12; i++) await settle(1000);
    expect(Number(screen.getByTestId('fp-hud-hud.score').textContent)).toBeGreaterThan(2);
  }, 60_000);
});
