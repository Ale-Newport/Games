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

describe('Senet UI', () => {
  it('throws and moves by tapping pieces and by hints against the computer', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { deal: '6' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('sn-start'));
    await settle(10);
    let moved = 0;
    for (let i = 0; i < 60 && moved < 4; i++) {
      if (screen.queryByTestId('sn-throw')) {
        fireEvent.click(screen.getByTestId('sn-throw'));
        await settle(10);
      }
      const movable = document.querySelector<HTMLElement | SVGElement>('[data-movable]');
      if (movable) {
        if (moved % 2) {
          fireEvent.click(screen.getByTestId('sn-hint'));
          expect(screen.getByTestId('sn-message').textContent).toMatch(/Suggested/);
        }
        fireEvent.click(movable);
        moved++;
      }
      await settle(1200);
    }
    expect(moved).toBe(4);
    expect(document.querySelectorAll('[data-piece]').length).toBe(10);
  });

  it('watch mode plays both sides', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { mode: 'watch' } });
    render(<Game services={services} />);
    await settle(10);
    for (let i = 0; i < 15; i++) await settle(900);
    expect(document.querySelectorAll('[data-piece]').length).toBeGreaterThan(0);
  });
});
