// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

afterEach(() => cleanup());

const submit = (w: string) => {
  fireEvent.change(screen.getByTestId('wr-input'), { target: { value: w } });
  fireEvent.click(screen.getByTestId('wr-submit'));
};

describe('Word Rank UI', () => {
  it('ranks guesses, rejects unknown words, gives hints and finds the word', async () => {
    const { services, calls } = createTestServices({ launchParams: { deal: '1' } });
    render(<Game services={services} />);
    await screen.findByTestId('wr-menu', undefined, { timeout: 15_000 });
    fireEvent.click(screen.getByTestId('wr-random'));
    submit('qwzxv');
    expect(screen.getByTestId('wr-message').textContent).toMatch(/know/);
    expect(screen.getByTestId('wr-count').textContent).toContain('0');
    submit('Dogs');
    expect(screen.getByTestId('wr-last').textContent).toMatch(/dog\d+/);
    fireEvent.click(screen.getByTestId('wr-hint'));
    expect(screen.getByTestId('wr-count').textContent).toContain('2');
    fireEvent.click(screen.getByTestId('wr-giveup'));
    expect(screen.getByTestId('wr-result').getAttribute('data-status')).toBe('gave-up');
    expect(screen.getByTestId('wr-closest').querySelectorAll('li')).toHaveLength(100);
    expect(calls.results[0]).toMatchObject({ outcome: 'loss', mode: 'random' });
  });

  it('lets the AI climb in watch mode', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { services } = createTestServices({ launchParams: { mode: 'watch', deal: '3' } });
    render(<Game services={services} />);
    await screen.findByTestId('wr-play', undefined, { timeout: 15_000 });
    for (let i = 0; i < 5; i++)
      await act(async () => {
        vi.advanceTimersByTime(950);
      });
    expect(screen.getByTestId('wr-list').querySelectorAll('li').length).toBeGreaterThanOrEqual(3);
    vi.useRealTimers();
  });
});
