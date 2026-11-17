// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { BANK, DEFAULT_SETTINGS, candidates, currentRound, newGame } from '../engine';
import { Game } from '../Game';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const settle = async (ms: number) => {
  for (let t = 0; t < ms; t += 100)
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
};

describe('Category Letters UI', () => {
  it('rolls, fills a list, reviews with a vote and finishes a one-round game', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { deal: '31' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('cl-lang-en'));
    fireEvent.click(screen.getByTestId('cl-size-6'));
    fireEvent.click(screen.getByTestId('cl-rounds-1'));
    fireEvent.click(screen.getByTestId('cl-bots-2'));
    fireEvent.click(screen.getByTestId('cl-start'));
    await settle(2500);
    const s = newGame({ ...DEFAULT_SETTINGS, size: 6, rounds: 1, bots: 2 }, 31, ['x']);
    const round = currentRound(s);
    expect(screen.getByTestId('cl-letter').textContent).toBe(round.letter);
    round.categories.forEach((id, i) => {
      const c = candidates(
        BANK.find((x) => x.id === id)!,
        'en',
        round.letter,
      );
      const value = i === 5 ? `${round.letter}wozzle` : (c.at(-1)?.name ?? '');
      fireEvent.change(screen.getByTestId(`cl-input-${i}`), { target: { value } });
    });
    fireEvent.click(screen.getByTestId('cl-done-btn'));
    expect(screen.getByTestId('cl-review')).toBeTruthy();
    expect(screen.getByTestId('cl-answer-0-5').getAttribute('data-verdict')).toBe('accepted');
    expect(screen.queryByTestId('cl-vote-0-5')).toBeNull(); // only other humans may vote
    fireEvent.click(screen.getByTestId('cl-next-round'));
    expect(screen.getByTestId('cl-done')).toBeTruthy();
    expect(calls.results).toHaveLength(1);
    expect(calls.results[0]!.mode).toBe('bots:normal');
  });

  it('hands the device over between two humans and ends the list on the timer', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { deal: '8' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('cl-humans-2'));
    fireEvent.click(screen.getByTestId('cl-bots-0'));
    fireEvent.click(screen.getByTestId('cl-seconds-60'));
    fireEvent.click(screen.getByTestId('cl-rounds-1'));
    fireEvent.click(screen.getByTestId('cl-start'));
    await settle(2500);
    expect(screen.getByTestId('cl-pass')).toBeTruthy();
    fireEvent.click(screen.getByTestId('cl-ready'));
    fireEvent.change(screen.getByTestId('cl-input-0'), { target: { value: 'Qwopple' } });
    await settle(61_000);
    expect(screen.getByTestId('cl-pass')).toBeTruthy();
    fireEvent.click(screen.getByTestId('cl-ready'));
    fireEvent.click(screen.getByTestId('cl-done-btn'));
    expect(screen.getByTestId('cl-review')).toBeTruthy();
  });

  it('lets the AI fill its list in watch mode', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { mode: 'watch', deal: '4' } });
    render(<Game services={services} />);
    await settle(2600 + 13 * 700);
    expect(screen.getByTestId('cl-review')).toBeTruthy();
  });
});
