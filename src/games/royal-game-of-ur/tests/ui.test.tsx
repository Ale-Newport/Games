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

describe('Ur UI', () => {
  it('throws and moves by tapping pieces and by hints against the computer', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { deal: '6' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('ur-start'));
    await settle(10);
    let moved = 0;
    for (let i = 0; i < 60 && moved < 4; i++) {
      if (screen.queryByTestId('ur-throw')) {
        fireEvent.click(screen.getByTestId('ur-throw'));
        await settle(10);
      }
      const movable = document.querySelector<HTMLElement | SVGElement>('[data-movable]');
      if (movable) {
        if (moved % 2) {
          fireEvent.click(screen.getByTestId('ur-hint'));
          expect(screen.getByTestId('ur-message').textContent).toMatch(/Suggested/);
        }
        fireEvent.click(movable);
        moved++;
      }
      await settle(1200);
    }
    expect(moved).toBe(4);
    const waiting = screen.getByLabelText(/You: \d to enter/);
    expect(waiting.getAttribute('aria-label')).not.toBe('You: 7 to enter');
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
