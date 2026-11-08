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

describe('Canyon Run UI', () => {
  it('steering into the bank with the touch pad costs a jet', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services } = createTestServices({ launchParams: { deal: '1' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('cr2-start'));
    expect(screen.getByTestId('cr2-hud-hud.lives').textContent).toBe('4');
    fireEvent.pointerDown(screen.getByTestId('cr2-pad-left'));
    await settle(3000);
    fireEvent.pointerUp(screen.getByTestId('cr2-pad-left'));
    await settle(2000);
    // At least one jet lost (with no hand on the controls, the next may follow).
    expect(Number(screen.getByTestId('cr2-hud-hud.lives').textContent)).toBeLessThan(4);
  });

  it('watch mode flies and shoots', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services } = createTestServices({ launchParams: { mode: 'watch', deal: '2' } });
    render(<Game services={services} />);
    for (let i = 0; i < 25 && screen.getByTestId('cr2-hud-hud.score').textContent === '0'; i++)
      await settle(1000);
    expect(Number(screen.getByTestId('cr2-hud-hud.score').textContent)).toBeGreaterThan(0);
  }, 60_000);
});
