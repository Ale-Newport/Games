// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const point = (i: number) => document.querySelector(`[data-point="${i}"]`) as HTMLButtonElement;
const at = (r: number, c: number) => r * 15 + c;

afterEach(cleanup);

describe('Renju UI', () => {
  it('forces the center opening, hides the alternate option, and blocks forbidden points', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    expect(screen.queryByText('Alternate who starts each round')).toBeNull();
    fireEvent.click(screen.getByTestId('start-match'));
    fireEvent.click(point(at(0, 0))); // not the center: rejected
    expect(point(at(0, 0)).getAttribute('aria-label')).toContain('empty');
    for (const p of [
      at(7, 7),
      at(0, 0),
      at(7, 8),
      at(0, 2),
      at(5, 9),
      at(0, 4),
      at(6, 9),
      at(0, 6),
    ])
      fireEvent.click(point(p));
    fireEvent.click(point(at(7, 9))); // 3-3 for Black: rejected
    expect(point(at(7, 9)).getAttribute('aria-label')).toBe('K8, forbidden for Black');
    expect(screen.getByTestId('mnk-status').textContent).toContain("Tester's turn");
  });
});
