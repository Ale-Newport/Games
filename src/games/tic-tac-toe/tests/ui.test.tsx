// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const cell = (i: number) => document.querySelector(`[data-cell="${i}"]`) as HTMLButtonElement;
const label = (i: number) => cell(i).getAttribute('aria-label');
const status = () => screen.getByTestId('mnk-status').textContent ?? '';

async function flush() {
  await act(async () => {});
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('Tic-Tac-Toe UI', () => {
  it('plays a two-player round to a win, records it and alternates the starter', async () => {
    const { services, calls } = createTestServices();
    render(<Game services={services} />);
    await flush();
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    for (const i of [0, 3, 1, 4]) fireEvent.click(cell(i));
    expect(label(0)).toContain('X');
    expect(label(3)).toContain('O');
    expect(status()).toContain("Tester's turn");
    fireEvent.click(cell(3)); // occupied: ignored
    expect(label(3)).toContain('O');
    fireEvent.click(cell(2));
    expect(status()).toContain('Tester wins!');
    expect(screen.getByTestId('score-x').textContent).toBe('1');
    expect(calls.results).toEqual([{ outcome: 'complete', mode: 'local' }]);
    expect(calls.achievements).toEqual(expect.arrayContaining(['hot-seat', 'three-move-win']));
    fireEvent.click(cell(5)); // game over: ignored
    expect(label(5)).toContain('empty');
    fireEvent.click(screen.getByTestId('next-round'));
    expect(label(0)).toContain('empty');
    expect(status()).toContain("Player 2's turn");
  });

  it('lets the Perfect computer answer a corner opening with the center, and undo takes back both moves', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices();
    render(<Game services={services} />);
    await flush();
    fireEvent.click(screen.getByTestId('difficulty-perfect'));
    fireEvent.click(screen.getByTestId('start-match'));
    fireEvent.click(cell(0));
    expect(status()).toContain('CPU is thinking');
    fireEvent.click(cell(5)); // not the human's turn
    expect(label(5)).toContain('empty');
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(label(4)).toContain('O'); // the only non-losing reply to a corner opening
    expect(status()).toContain('Your turn');
    fireEvent.click(screen.getByRole('button', { name: /Undo/ }));
    expect(label(0)).toContain('empty');
    expect(label(4)).toContain('empty');
  });

  it('accepts keypad digits and the arrow/enter keyboard flow', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await flush();
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    fireEvent.keyDown(window, { key: '7' });
    expect(label(0)).toContain('X');
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    fireEvent.keyDown(document.body, { key: 'Enter' });
    expect(label(4)).toContain('O');
    fireEvent.keyDown(window, { key: 'u' });
    expect(label(4)).toContain('empty');
  });

  it('saves after every move and resumes the match', async () => {
    const first = createTestServices();
    render(<Game services={first.services} />);
    await flush();
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    fireEvent.click(cell(4));
    fireEvent.click(cell(0));
    await flush();
    cleanup();

    const second = createTestServices({}, first.getSaved());
    render(<Game services={second.services} />);
    await flush();
    fireEvent.click(screen.getByTestId('resume-match'));
    expect(label(4)).toContain('X');
    expect(label(0)).toContain('O');
  });

  it('opens directly in watch mode from the AI Lab and plays itself', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { mode: 'watch' } });
    render(<Game services={services} />);
    await flush();
    expect(screen.getByTestId('mode-watch').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByTestId('start-match'));
    // Agents use a random seed, so rounds vary in length; track progress over time instead of
    // sampling once (a finished round auto-advances and clears the board).
    let maxMarks = 0;
    let sawResult = false;
    for (let i = 0; i < 40 && !status().includes('Round 2'); i++) {
      act(() => {
        vi.advanceTimersByTime(700);
      });
      const marks = [...document.querySelectorAll('[data-cell]')].filter(
        (b) => !b.getAttribute('aria-label')!.includes('empty'),
      );
      maxMarks = Math.max(maxMarks, marks.length);
      if (/wins|draw/.test(status())) sawResult = true;
    }
    expect(maxMarks).toBeGreaterThanOrEqual(5);
    expect(sawResult).toBe(true);
    expect(status()).toContain('Round 2');
    expect(calls.results).toEqual([]);
    expect(calls.saves).toEqual([]);
  });
});
