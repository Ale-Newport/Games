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

describe('Pig UI', () => {
  it('plays a whole game against the hold-at-20 computer, with hints', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { deal: '4' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('pg-opp-easy'));
    fireEvent.click(screen.getByTestId('pg-start'));
    await settle(10);
    let hinted = false;
    for (let i = 0; i < 2000 && !screen.queryByTestId('pg-again'); i++) {
      if (screen.queryByTestId('pg-roll')) {
        if (!hinted) {
          fireEvent.click(screen.getByTestId('pg-hint'));
          expect(screen.getByTestId('pg-message').textContent).toMatch(
            /Best play: (roll|hold)\. With perfect play your chance to win is \d+%/,
          );
          hinted = true;
        }
        const turn = Number(screen.getByTestId('pg-turn').textContent!.replace(/\D+/g, ''));
        fireEvent.click(screen.getByTestId(turn >= 15 ? 'pg-hold' : 'pg-roll'));
      }
      await settle(700);
    }
    expect(screen.getByTestId('pg-message').textContent).toMatch(/win/);
    expect(calls.results).toHaveLength(1);
  });
});
