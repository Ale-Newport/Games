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

describe('Balancing Cart UI', () => {
  it('left alone, the short pole falls within seconds', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services, calls } = createTestServices({ launchParams: { deal: '1' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('bc-pole-short'));
    fireEvent.click(screen.getByTestId('bc-start'));
    for (let i = 0; i < 10 && !screen.queryByTestId('bc-again'); i++) await settle(500);
    expect(screen.getByTestId('bc-overlay').textContent).toMatch(/The pole fell/);
    expect(calls.results).toHaveLength(1);
  });

  it('holding a push sends the cart off', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services } = createTestServices({ launchParams: { deal: '2' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('bc-start'));
    fireEvent.pointerDown(screen.getByTestId('bc-pad-right'));
    for (let i = 0; i < 10 && !screen.queryByTestId('bc-again'); i++) await settle(500);
    fireEvent.pointerUp(screen.getByTestId('bc-pad-right'));
    expect(screen.getByTestId('bc-overlay')).toBeTruthy();
  });

  it('watch mode keeps the pole up', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services } = createTestServices({ launchParams: { mode: 'watch', deal: '2' } });
    render(<Game services={services} />);
    for (let i = 0; i < 12; i++) await settle(1000);
    expect(screen.queryByTestId('bc-again')).toBeNull();
    expect(Number(screen.getByTestId('bc-hud-hud.time').textContent)).toBeGreaterThan(8);
  }, 60_000);
});
