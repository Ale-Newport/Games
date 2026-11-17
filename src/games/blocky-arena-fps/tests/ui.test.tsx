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
      'queueMicrotask',
    ],
  });

describe('Blocky Arena UI', () => {
  it('starts after the click-to-play overlay, fires, pauses, and a match runs to the scoreboard', async () => {
    fake();
    const { services, calls } = createTestServices({ launchParams: { deal: '4' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('fps-bots-7'));
    fireEvent.click(screen.getByTestId('fps-level-hard'));
    fireEvent.click(screen.getByTestId('fps-start'));
    // Without WebGL the arena explains it, but the match still runs.
    expect(screen.getByTestId('fps-play').textContent).toMatch(/WebGL/);
    fireEvent.click(screen.getByTestId('fps-engage'));
    const canvas = screen.getByTestId('fps-canvas');
    fireEvent.pointerDown(canvas, { pointerType: 'mouse', button: 0 });
    await settle(300);
    fireEvent.pointerUp(canvas, { pointerType: 'mouse', button: 0 });
    await settle(200);
    expect(Number(screen.getByTestId('fps-ammo').textContent)).toBeLessThan(30);
    fireEvent.keyDown(window, { code: 'KeyP', key: 'p' });
    await settle(100);
    expect(screen.getByTestId('fps-overlay').textContent).toMatch(/Paused/);
    fireEvent.click(screen.getByTestId('fps-resume-run'));
    for (let i = 0; i < 400 && !screen.queryByTestId('fps-end'); i++) await settle(1000);
    expect(screen.getByTestId('fps-result').textContent).toMatch(/placed|win/);
    expect(calls.results).toHaveLength(1);
  }, 120_000);
});
