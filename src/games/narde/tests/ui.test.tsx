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

/** Plays the human side by tapping: the first movable checker, then its first target. */
async function playByTaps() {
  const board = screen.getByTestId('rb-board');
  for (let k = 0; k < 4; k++) {
    const from = [...board.querySelectorAll<SVGGElement>('[data-point]')].find((g) =>
      g.querySelector('circle[class*="movable"]'),
    );
    if (!from) return;
    fireEvent.click(from);
    const to = [...board.querySelectorAll<SVGGElement>('[data-point]')].find((g) =>
      g.getAttribute('class')?.includes('target'),
    );
    if (!to) return;
    fireEvent.click(to);
    await settle(10);
  }
}

describe('Narde UI', () => {
  it('plays turns by taps and hints against the computer, which answers', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { deal: '11' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('nd-len-1'));
    fireEvent.click(screen.getByTestId('nd-start'));
    await settle(10);
    expect(screen.getByTestId('rb-board')).toBeTruthy();
    let humanTurns = 0;
    for (let i = 0; i < 40 && humanTurns < 4; i++) {
      if (screen.queryByTestId('nd-roll')) {
        fireEvent.click(screen.getByTestId('nd-roll'));
        await settle(10);
      }
      if (screen.queryByTestId('nd-hint')) {
        if (humanTurns % 2 === 0) await playByTaps();
        else {
          fireEvent.click(screen.getByTestId('nd-hint'));
          expect(screen.getByTestId('nd-message').textContent).toMatch(/Suggested/);
          fireEvent.click(screen.getByTestId('nd-apply'));
        }
        humanTurns++;
      }
      await settle(1500);
    }
    expect(humanTurns).toBe(4);
    // Pips have moved on from the start.
    expect(screen.getByTestId('nd-pips').textContent).not.toBe('Pips 360 · 360');
  });

  it('watch mode plays both sides', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { mode: 'watch' } });
    render(<Game services={services} />);
    await settle(10);
    for (let i = 0; i < 12; i++) await settle(800);
    expect(screen.getByTestId('nd-pips').textContent).not.toBe('Pips 360 · 360');
  });
});
