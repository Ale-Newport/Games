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

describe('Wanderer Rescue UI', () => {
  it('ending a level early with nobody home costs a try', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services } = createTestServices({ launchParams: { deal: '1' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('wr-start-3'));
    fireEvent.click(screen.getByTestId('wr-start'));
    expect(screen.getByTestId('wr-hud-hud.level').textContent).toBe('3/6');
    expect(screen.getByTestId('wr-hud-hud.lives').textContent).toBe('3');
    await settle(3000);
    fireEvent.pointerDown(screen.getByTestId('wr-pad-alt'));
    await settle(100);
    fireEvent.pointerUp(screen.getByTestId('wr-pad-alt'));
    await settle(500);
    expect(screen.getByTestId('wr-hud-hud.lives').textContent).toBe('2');
  });

  it('watch mode brings wanderers home on the first level', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services } = createTestServices({ launchParams: { mode: 'watch', deal: '2' } });
    render(<Game services={services} />);
    for (let i = 0; i < 30 && screen.getByTestId('wr-hud-hud.level').textContent === '1/6'; i++)
      await settle(1000);
    expect(screen.getByTestId('wr-hud-hud.level').textContent).toBe('2/6');
  }, 60_000);
});
