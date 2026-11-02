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

describe('Sunny Trail UI', () => {
  it('runs right with the touch pad into the first beetle', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services } = createTestServices({ launchParams: { deal: '1' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('pf-start'));
    expect(screen.getByTestId('pf-hud-hud.lives').textContent).toBe('3');
    fireEvent.pointerDown(screen.getByTestId('pf-pad-right'));
    for (let i = 0; i < 20 && screen.getByTestId('pf-hud-hud.lives').textContent === '3'; i++)
      await settle(500);
    fireEvent.pointerUp(screen.getByTestId('pf-pad-right'));
    // Running blindly right, the first beetle costs a life.
    expect(screen.getByTestId('pf-hud-hud.lives').textContent).toBe('2');
  }, 60_000);

  it('watch mode clears the first level', async () => {
    vi.useFakeTimers({ toFake: [...FAKE] });
    const { services } = createTestServices({ launchParams: { mode: 'watch', deal: '1' } });
    render(<Game services={services} />);
    for (let i = 0; i < 60 && screen.getByTestId('pf-hud-hud.level').textContent === '1'; i++)
      await settle(1000);
    expect(screen.getByTestId('pf-hud-hud.level').textContent).toBe('2');
  }, 120_000);
});
