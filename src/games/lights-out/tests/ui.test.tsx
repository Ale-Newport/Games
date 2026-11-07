// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';
import { newLights } from '../engine';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const settle = async (ms: number) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
};

describe('Lights Out UI', () => {
  it('presses lights, undoes and finishes with hints', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { deal: '5' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('lo-start'));
    await settle(10);
    const s = newLights('classic', 5);
    const lit = () => screen.getByTestId('lo-on').textContent;
    const before = lit();
    fireEvent.click(screen.getByTestId('lo-board').querySelector('[data-cell="12"]')!);
    expect(screen.getByTestId('lo-presses').textContent).toBe('Presses 1');
    fireEvent.click(screen.getByTestId('lo-undo'));
    expect(lit()).toBe(before);
    for (let i = 0; i < 30 && !screen.queryByTestId('lo-again'); i++) {
      fireEvent.click(screen.getByTestId('lo-hint'));
      fireEvent.click(screen.getByTestId('lo-apply'));
    }
    expect(screen.getByTestId('lo-message').textContent).toMatch(/^All dark/);
    expect(calls.results).toEqual([
      expect.objectContaining({ outcome: 'complete', mode: 'classic' }),
    ]);
    expect(s.optimal).toBeGreaterThan(0);
  });
});
