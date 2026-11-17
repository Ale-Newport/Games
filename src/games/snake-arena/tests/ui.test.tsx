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

describe('Snake Arena UI', () => {
  it('turning in circles eventually crashes; the run is recorded', async () => {
    fake();
    const { services, calls } = createTestServices({ launchParams: { deal: '4' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('sa-bots-30'));
    fireEvent.click(screen.getByTestId('sa-level-hard'));
    fireEvent.click(screen.getByTestId('sa-start'));
    expect(screen.getByTestId('sa-hud-hud.length').textContent).toBe('10');
    fireEvent.pointerDown(screen.getByTestId('sa-pad-fire'));
    await settle(500);
    fireEvent.pointerUp(screen.getByTestId('sa-pad-fire'));
    // Hold right: the snake circles until something gets in the way.
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    for (let i = 0; i < 400 && !screen.queryByTestId('sa-again'); i++) await settle(1000);
    expect(screen.getByTestId('sa-overlay').textContent).toMatch(/crashed|hit the wall/);
    expect(calls.results).toHaveLength(1);
  }, 120_000);
});
