// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const square = (i: number) => document.querySelector(`[data-square="${i}"]`) as HTMLButtonElement;
const sq = (r: number, c: number) => r * 8 + c;

afterEach(cleanup);

describe('English checkers UI', () => {
  it('selects a piece, shows targets and moves it; illegal targets are ignored', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    expect(screen.getByTestId('status-info').textContent).toBe('Black 12 · White 12');
    // Black man at (5,2) can move to (4,1) or (4,3).
    expect(square(sq(5, 2)).getAttribute('aria-label')).toContain('can move');
    fireEvent.click(square(sq(5, 2)));
    expect(square(sq(4, 3)).getAttribute('aria-label')).toContain('move here');
    fireEvent.click(square(sq(4, 3)));
    expect(square(sq(4, 3)).getAttribute('aria-label')).toContain('black man');
    expect(square(sq(5, 2)).getAttribute('aria-label')).toContain('empty');
    expect(screen.getByTestId('mnk-status').textContent).toContain("Player 2's turn");
  });

  it('enters a capture by clicking the landing square', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    // 1. Black (5,2)→(4,3)  2. White (2,5)→(3,4)  3. Black must capture (4,3)x(3,4)→(2,5).
    for (const [a, b] of [
      [sq(5, 2), sq(4, 3)],
      [sq(2, 5), sq(3, 4)],
    ] as const) {
      fireEvent.click(square(a));
      fireEvent.click(square(b));
    }
    expect(square(sq(5, 0)).getAttribute('aria-label')).not.toContain('can move'); // capture is compulsory
    fireEvent.click(square(sq(4, 3)));
    fireEvent.click(square(sq(2, 5)));
    expect(screen.getByTestId('status-info').textContent).toBe('Black 12 · White 11');
  });
});
