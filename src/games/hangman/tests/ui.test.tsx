// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';
import { newHangman } from '../engine';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const settle = async (ms: number) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
};

describe('Hangman UI', () => {
  it('reveals letters, draws misses and solves with hints', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { deal: '12' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('hm-lang-en'));
    fireEvent.click(screen.getByTestId('hm-cat-animals'));
    fireEvent.click(screen.getByTestId('hm-play'));
    await settle(10);
    const word = newHangman('en', 'normal', 'animals', 12).word;
    expect(screen.getByTestId('hm-category').textContent).toBe('Animals');
    const miss = [...'qxzjv'].find((c) => !word.includes(c))!;
    fireEvent.click(screen.getByTestId(`hm-key-${miss}`));
    expect(screen.getByTestId('hm-misses').textContent).toContain(miss.toUpperCase());
    expect(screen.getByTestId('hm-lives').textContent).toBe('Lives 5');
    for (let i = 0; i < 26 && !screen.queryByTestId('hm-again'); i++) {
      fireEvent.click(screen.getByTestId('hm-hint'));
      fireEvent.click(screen.getByTestId('hm-apply'));
    }
    expect(screen.getByTestId('hm-message').textContent).toMatch(/^Solved with/);
    expect(calls.results).toEqual([expect.objectContaining({ outcome: 'win', mode: 'normal' })]);
  });

  it('plays a friend’s secret word and loses after six misses', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices();
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('hm-lang-es'));
    fireEvent.click(screen.getByTestId('hm-friend-btn'));
    fireEvent.change(screen.getByTestId('hm-secret'), { target: { value: 'Cigüeña' } });
    fireEvent.click(screen.getByTestId('hm-friend-go'));
    expect(screen.getByTestId('hm-category').textContent).toBe('A friend’s word');
    expect(screen.getByTestId('hm-word').children).toHaveLength(7);
    for (const c of 'bdfhjk') fireEvent.click(screen.getByTestId(`hm-key-${c}`));
    expect(screen.getByTestId('hm-message').textContent).toMatch(/CIGUEÑA/);
    expect(calls.results).toEqual([expect.objectContaining({ outcome: 'loss', mode: 'friend' })]);
  });
});
