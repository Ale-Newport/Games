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

describe('Colour Rows UI', () => {
  it('plays a whole game against the careful computer, following hints', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { deal: '3' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('cr-level-easy'));
    fireEvent.click(screen.getByTestId('cr-start'));
    await settle(10);
    let hints = 0;
    let crossed = 0;
    for (let i = 0; i < 3000 && !screen.queryByTestId('cr-again'); i++) {
      if (screen.queryByTestId('cr-roll')) fireEvent.click(screen.getByTestId('cr-roll'));
      else if (screen.queryByTestId('cr-pass')) {
        fireEvent.click(screen.getByTestId('cr-hint'));
        hints++;
        const msg = screen.getByTestId('cr-message').textContent!;
        const m = /Suggested: cross (\d+) in (red|yellow|green|blue)\./.exec(msg);
        if (m) {
          const row = ['red', 'yellow', 'green', 'blue'].indexOf(m[2]!);
          const cell = screen.getByTestId(`cr-cell-${row}-${m[1]}`);
          expect(cell.dataset.live).toBe('true');
          fireEvent.click(cell);
          crossed++;
        } else {
          expect(msg).toMatch(/Suggested: pass\./);
          fireEvent.click(screen.getByTestId('cr-pass'));
        }
      }
      await settle(800);
    }
    expect(hints).toBeGreaterThan(10);
    expect(crossed).toBeGreaterThan(5);
    expect(screen.getByTestId('cr-message').textContent).toMatch(/wins? with|tie at/);
    expect(calls.results).toHaveLength(1);
  });

  it('solo: crossing a lit number marks it on the sheet', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { deal: '8' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('cr-count-1'));
    fireEvent.click(screen.getByTestId('cr-start'));
    fireEvent.click(screen.getByTestId('cr-roll'));
    const lit = document.querySelector<HTMLButtonElement>('[data-live="true"]')!;
    expect(lit).not.toBeNull();
    fireEvent.click(lit);
    expect(lit.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('cr-message').textContent).toMatch(/You cross \d+ in/);
  });
});
