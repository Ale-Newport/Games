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

describe('Pong UI', () => {
  it('plays to the end: an idle paddle loses a short game, the result is recorded', async () => {
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
    const { services, calls } = createTestServices({ launchParams: { deal: '3' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('pg2-length-short'));
    fireEvent.click(screen.getByTestId('pg2-start'));
    // Holding a touch button moves the paddle; the shell pauses and resumes.
    fireEvent.pointerDown(screen.getByTestId('pg2-pad-up'));
    await settle(200);
    fireEvent.pointerUp(screen.getByTestId('pg2-pad-up'));
    fireEvent.click(screen.getByTestId('pg2-pause'));
    expect(screen.getByTestId('pg2-overlay').textContent).toMatch(/Paused/);
    fireEvent.click(screen.getByTestId('pg2-resume-run'));
    for (let i = 0; i < 120 && !screen.queryByTestId('pg2-again'); i++) await settle(500);
    expect(screen.getByTestId('pg2-overlay').textContent).toMatch(/computer wins 3–0/);
    expect(screen.getByTestId('pg2-hud-hud.cpu').textContent).toBe('3');
    expect(calls.results).toHaveLength(1);
  });

  it('watch mode plays by itself', async () => {
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
    const { services } = createTestServices({ launchParams: { mode: 'watch', deal: '2' } });
    render(<Game services={services} />);
    for (let i = 0; i < 200; i++) await settle(500);
    const you = Number(screen.getByTestId('pg2-hud-hud.you').textContent);
    const cpu = Number(screen.getByTestId('pg2-hud-hud.cpu').textContent);
    expect(you + cpu).toBeGreaterThan(0);
  });
});
