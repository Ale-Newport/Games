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

describe('Sliding Blocks UI', () => {
  it('moves a block by tapping it and a marked spot, undoes, and solves with hints', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { deal: '5' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('kl-start'));
    await settle(10);
    const board = screen.getByTestId('kl-board');
    const movable = [...board.querySelectorAll<HTMLElement>('[data-block]')].find((b) => {
      fireEvent.focus(b);
      return board.querySelector('[data-target]');
    })!;
    expect(movable).toBeTruthy();
    fireEvent.click(board.querySelector<HTMLElement>('[data-target]')!);
    expect(screen.getByTestId('kl-moves').textContent).toBe('Moves 1');
    fireEvent.click(screen.getByTestId('kl-undo'));
    expect(screen.getByTestId('kl-moves').textContent).toBe('Moves 0');
    for (let i = 0; i < 40 && !screen.queryByTestId('kl-again'); i++) {
      fireEvent.click(screen.getByTestId('kl-hint'));
      expect(screen.getByTestId('kl-message').textContent).toMatch(/^Move /);
      fireEvent.click(screen.getByTestId('kl-apply'));
    }
    expect(screen.getByTestId('kl-message').textContent).toMatch(/^Out in/);
    expect(calls.results).toEqual([expect.objectContaining({ outcome: 'complete', mode: 'easy' })]);
  });

  it('picks a numbered puzzle, records its best and marks it solved in the picker', async () => {
    vi.useFakeTimers();
    const { services, getSaved } = createTestServices();
    render(<Game services={services} />);
    await settle(0);
    expect(screen.getByTestId('kl-puzzles').children).toHaveLength(60);
    fireEvent.click(screen.getByTestId('kl-puzzle-40'));
    await settle(10);
    expect(screen.getByTestId('kl-number').textContent).toBe('Puzzle 41');
    for (let i = 0; i < 40 && !screen.queryByTestId('kl-next'); i++) {
      fireEvent.click(screen.getByTestId('kl-hint'));
      fireEvent.click(screen.getByTestId('kl-apply'));
    }
    expect(screen.getByTestId('kl-message').textContent).toMatch(/^Out in/);
    const moves = (getSaved() as { best: Record<string, number> }).best['easy:40'];
    expect(moves).toBeGreaterThan(0);
    fireEvent.click(screen.getByTestId('kl-next'));
    await settle(10);
    expect(screen.getByTestId('kl-number').textContent).toBe('Puzzle 42');
    fireEvent.click(screen.getByTestId('kl-menu-btn'));
    await settle(10);
    expect(screen.getByTestId('kl-puzzle-40').getAttribute('aria-label')).toBe(
      `Puzzle 41, solved in ${moves} moves at best`,
    );
    expect(screen.getByTestId('kl-puzzle-40').className).toMatch(/cleared/);
    expect(screen.getByTestId('kl-resume')).toBeTruthy();
    fireEvent.click(screen.getByTestId('kl-level-hard'));
    expect(screen.getByTestId('kl-puzzle-40').className).not.toMatch(/cleared/);
  });

  it('watch mode solves on its own', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { mode: 'watch' } });
    render(<Game services={services} />);
    await settle(10);
    for (
      let i = 0;
      i < 80 && !/got the big block out/.test(screen.getByTestId('kl-message').textContent ?? '');
      i++
    )
      await settle(600);
    expect(screen.getByTestId('kl-message').textContent).toMatch(/got the big block out/);
  });
});
