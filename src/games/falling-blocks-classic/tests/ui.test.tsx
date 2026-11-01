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

describe('Falling Blocks Classic UI', () => {
  it('pieces stack up untouched until the well tops out', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services, calls } = createTestServices({ launchParams: { deal: '3' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('fc-start'));
    expect(screen.getByTestId('fc-hud-hud.lines').textContent).toMatch(/^0/);
    // Rotate once with the touch pad, then let the pieces fall (soft drop held).
    fireEvent.pointerDown(screen.getByTestId('fc-pad-up'));
    await settle(50);
    fireEvent.pointerUp(screen.getByTestId('fc-pad-up'));
    fireEvent.pointerDown(screen.getByTestId('fc-pad-down'));
    for (let i = 0; i < 400 && !screen.queryByTestId('fc-again'); i++) await settle(500);
    expect(screen.getByTestId('fc-overlay').textContent).toMatch(/Topped out/);
    expect(calls.results).toHaveLength(1);
  });

  it('watch mode clears lines by itself', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services } = createTestServices({ launchParams: { mode: 'watch', deal: '2' } });
    render(<Game services={services} />);
    for (let i = 0; i < 80; i++) await settle(500);
    expect(
      Number(screen.getByTestId('fc-hud-hud.lines').textContent!.split('/')[0]),
    ).toBeGreaterThan(0);
  });
});
