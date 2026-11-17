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

describe('Disc Soccer UI', () => {
  it('plays a match to the final whistle and records it', async () => {
    fake();
    const { services, calls } = createTestServices({ launchParams: { deal: '3' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('ds-size-1'));
    fireEvent.click(screen.getByTestId('ds-level-hard'));
    fireEvent.click(screen.getByTestId('ds-start'));
    fireEvent.pointerDown(screen.getByTestId('ds-pad-right'));
    await settle(300);
    fireEvent.pointerUp(screen.getByTestId('ds-pad-right'));
    expect(screen.getByTestId('ds-hud-hud.time').textContent).toMatch(/^[0-3]:\d\d$/);
    for (let i = 0; i < 600 && !screen.queryByTestId('ds-again'); i++) await settle(1000);
    expect(screen.getByTestId('ds-overlay').textContent).toMatch(/wins/);
    expect(Number(screen.getByTestId('ds-hud-hud.blue').textContent)).toBeGreaterThan(0);
    expect(calls.results).toHaveLength(1);
  }, 120_000);
});
