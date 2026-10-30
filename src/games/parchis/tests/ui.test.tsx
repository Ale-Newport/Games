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

describe('Parchís UI', () => {
  it('rolls and moves tokens by taps and hints against the computer', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { deal: '8' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('pq-count-2'));
    fireEvent.click(screen.getByTestId('pq-start'));
    await settle(10);
    let moved = 0;
    for (let i = 0; i < 120 && moved < 3; i++) {
      if (screen.queryByTestId('pq-roll')) {
        fireEvent.click(screen.getByTestId('pq-roll'));
        await settle(10);
      }
      const token = document.querySelector<SVGElement>('[data-movable]');
      if (token) {
        if (moved === 1) {
          fireEvent.click(screen.getByTestId('pq-hint'));
          expect(screen.getByTestId('pq-message').textContent).toMatch(/Suggested/);
        }
        fireEvent.click(token);
        moved++;
      }
      await settle(1200);
    }
    expect(moved).toBe(3);
  });

  it('watch mode plays four computer players', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { mode: 'watch', deal: '4' } });
    render(<Game services={services} />);
    await settle(10);
    for (let i = 0; i < 40; i++) await settle(700);
    expect(screen.getByTestId('pq-seat-0')).toBeTruthy();
    expect(document.querySelectorAll('[data-token]').length).toBe(16);
  });
});
