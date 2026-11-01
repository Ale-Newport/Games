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

describe('rpsls UI', () => {
  it('plays a match against the mind reader, with hints and its read revealed', async () => {
    const { services, calls } = createTestServices({ launchParams: { deal: '4' } });
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('r5-length-3'));
    fireEvent.click(screen.getByTestId('r5-start'));
    let rounds = 0;
    for (let i = 0; i < 200 && !screen.queryByTestId('r5-again'); i++) {
      fireEvent.click(screen.getByTestId('r5-hint'));
      expect(screen.getByTestId('r5-message').textContent).toMatch(/Suggested/);
      fireEvent.click(screen.getByTestId(`r5-throw-${i % 5}`));
      rounds++;
      if (rounds === 1) {
        fireEvent.click(screen.getByTestId('r5-reveal'));
        expect(screen.getByTestId('r5-read').textContent).toMatch(/read|random/);
      }
    }
    expect(screen.getByTestId('r5-message').textContent).toMatch(/wins the match|win the match/);
    expect(calls.results).toHaveLength(1);
  });

  it('watch mode plays rounds by itself', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { mode: 'watch', deal: '2' } });
    render(<Game services={services} />);
    for (let i = 0; i < 6; i++) await settle(950);
    expect(screen.getByTestId('r5-history').children.length).toBeGreaterThan(2);
  });
});
