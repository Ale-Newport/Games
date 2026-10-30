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
