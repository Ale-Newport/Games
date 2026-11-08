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

describe('Rooftop Dash UI', () => {
  it('the courier runs on her own and, never jumping, falls into the first gap', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services, calls } = createTestServices({ launchParams: { deal: '1' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('rd-start'));
    await settle(1000);
    expect(screen.getByTestId('rd-hud-hud.dist').textContent).not.toBe('0 m');
    fireEvent.pointerDown(screen.getByTestId('rd-pad-up'));
    fireEvent.pointerUp(screen.getByTestId('rd-pad-up'));
    for (let i = 0; i < 10 && !screen.queryByTestId('rd-again'); i++) await settle(1000);
    expect(screen.getByTestId('rd-overlay').textContent).toMatch(/Fell between/);
    expect(calls.results).toHaveLength(1);
  });

  it('watch mode keeps running', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services } = createTestServices({ launchParams: { mode: 'watch', deal: '2' } });
    render(<Game services={services} />);
    for (let i = 0; i < 12; i++) await settle(1000);
    expect(screen.queryByTestId('rd-again')).toBeNull();
    expect(parseInt(screen.getByTestId('rd-hud-hud.dist').textContent ?? '0', 10)).toBeGreaterThan(
      80,
    );
  }, 60_000);
});
