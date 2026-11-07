// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';
import { SPECS, lineTo, newSlide } from '../engine';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const settle = async (ms: number) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
};

describe('8-Puzzle UI', () => {
  it('slides lines, undoes and solves with hints', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { deal: '4' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('sl-level-hard'));
    fireEvent.click(screen.getByTestId('sl-start'));
    await settle(50);
    const s = newSlide(SPECS, 'hard', 4);
    const far = s.board.find((t) => t && lineTo(s.board, t).length === 2);
    if (far) {
      fireEvent.click(screen.getByTestId('sl-board').querySelector(`[data-tile="${far}"]`)!);
      expect(screen.getByTestId('sl-moves').textContent).toBe('Moves 2');
      fireEvent.click(screen.getByTestId('sl-undo'));
      fireEvent.click(screen.getByTestId('sl-undo'));
      expect(screen.getByTestId('sl-moves').textContent).toBe('Moves 4');
    }
    for (let i = 0; i < 40 && !screen.queryByTestId('sl-again'); i++) {
      fireEvent.click(screen.getByTestId('sl-hint'));
      expect(screen.getByTestId('sl-message').textContent).toMatch(/Slide \d/);
      fireEvent.click(screen.getByTestId('sl-apply'));
    }
    expect(screen.getByTestId('sl-message').textContent).toMatch(/^Solved in/);
    expect(calls.results).toEqual([expect.objectContaining({ outcome: 'complete', mode: 'hard' })]);
  });

  it('shows picture tiles and lets the AI solve', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { deal: '2' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('sl-face-picture'));
    fireEvent.click(screen.getByTestId('sl-watch'));
    await settle(50);
    const tile = screen.getByTestId('sl-board').querySelector('[data-tile="1"]') as HTMLElement;
    expect(tile.style.backgroundImage).toContain('data:image/svg+xml');
    for (let i = 0; i < 40; i++) await settle(300);
    expect(screen.getByTestId('sl-message').textContent).toMatch(/The AI solved it/);
  });
});
