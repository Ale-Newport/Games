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

describe('City Shield UI', () => {
  it('with nobody firing, the rockets take the cities', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services, calls } = createTestServices({ launchParams: { deal: '1' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('mc2-start'));
    expect(screen.getByTestId('mc2-hud-hud.cities').textContent).toBe('6');
    for (let i = 0; i < 200 && !screen.queryByTestId('mc2-again'); i++) await settle(1000);
    expect(screen.getByTestId('mc2-overlay').textContent).toMatch(/Every city has fallen/);
    expect(calls.results).toHaveLength(1);
  }, 60_000);

  it('watch mode shoots rockets down', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services } = createTestServices({ launchParams: { mode: 'watch', deal: '2' } });
    render(<Game services={services} />);
    for (let i = 0; i < 20; i++) await settle(1000);
    expect(Number(screen.getByTestId('mc2-hud-hud.score').textContent)).toBeGreaterThan(0);
  }, 60_000);
});
