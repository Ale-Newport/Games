// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';
import { newWordGame } from '../engine';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const settle = async (ms: number) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
};

const typeWord = (w: string) => {
  for (const c of w) fireEvent.click(screen.getByTestId(`wg-key-${c}`));
};

describe('Word Guess UI', () => {
  it('rejects unknown words, marks tiles and keys, and solves with hints', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { deal: '42' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('wg-lang-en'));
    fireEvent.click(screen.getByTestId('wg-random'));
    await settle(10);
    const answer = newWordGame('en', 42).answer;
    typeWord('qzqzq');
    fireEvent.click(screen.getByTestId('wg-enter'));
    expect(screen.getByTestId('wg-message').textContent).toMatch(/not in the word list/);
    for (let i = 0; i < 5; i++) fireEvent.click(screen.getByTestId('wg-back'));
    const first = answer === 'about' ? 'crane' : 'about';
    typeWord(first);
    fireEvent.click(screen.getByTestId('wg-enter'));
    const tiles = screen.getByTestId('wg-row-0').querySelectorAll('[data-mark]');
    expect(tiles).toHaveLength(5);
    const aMark = tiles[0]!.getAttribute('data-mark');
    expect(screen.getByTestId(`wg-key-${first[0]}`).getAttribute('aria-label')).toMatch(
      aMark === '0' ? /not in the word/ : /place|in the word/,
    );
    for (let i = 0; i < 6 && !screen.queryByTestId('wg-again'); i++) {
      fireEvent.click(screen.getByTestId('wg-hint'));
      fireEvent.click(screen.getByTestId('wg-apply'));
      fireEvent.click(screen.getByTestId('wg-enter'));
    }
    expect(screen.getByTestId('wg-message').textContent).toMatch(/^Solved in/);
    expect(calls.results).toEqual([expect.objectContaining({ outcome: 'complete', mode: 'en' })]);
  });

  it('plays Spanish words with Ñ on the keyboard and lets the AI solve one', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { deal: '8' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('wg-lang-es'));
    fireEvent.click(screen.getByTestId('wg-random'));
    await settle(10);
    expect(screen.getByTestId('wg-key-ñ')).toBeTruthy();
    fireEvent.click(screen.getByTestId('wg-menu-btn'));
    fireEvent.click(screen.getByTestId('wg-watch'));
    for (let i = 0; i < 8; i++) await settle(1200);
    expect(screen.getByTestId('wg-message').textContent).toMatch(/The AI found/);
  });
});
