// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';
import { SPECS, moves, newSort, rulesFor } from '../engine';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const settle = async (ms: number) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
};

describe('Water Sort UI', () => {
  it('pours by tapping two tubes, undoes and sorts with hints', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { deal: '6' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('so-start'));
    await settle(50);
    const s = newSort(SPECS, rulesFor, 'easy', 6);
    const [a, b] = moves(s.tubes, rulesFor(SPECS.easy!))[0]!;
    const tube = (i: number) => screen.getByTestId('so-tubes').querySelector(`[data-tube="${i}"]`)!;
    fireEvent.click(tube(a));
    fireEvent.click(tube(b));
    expect(screen.getByTestId('so-moves').textContent).toBe('Moves 1');
    fireEvent.click(screen.getByTestId('so-undo'));
    expect(screen.getByTestId('so-moves').textContent).toBe('Moves 0');
    for (let i = 0; i < 80 && !screen.queryByTestId('so-again'); i++) {
      fireEvent.click(screen.getByTestId('so-hint'));
      fireEvent.click(screen.getByTestId('so-apply'));
    }
    expect(screen.getByTestId('so-message').textContent).toMatch(/^Sorted in/);
    expect(calls.results).toEqual([expect.objectContaining({ outcome: 'complete', mode: 'easy' })]);
  });
});
