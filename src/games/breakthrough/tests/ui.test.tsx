// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const cell = (p: number) => document.querySelector(`[data-cell="${p}"]`) as HTMLButtonElement;

afterEach(cleanup);

describe('Breakthrough UI', () => {
  it('shows steps and captures, then moves and captures a pawn', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    fireEvent.click(cell(52));
    expect(cell(44).getAttribute('aria-label')).toBe('e3, empty, move here');
    fireEvent.click(cell(44));
    expect(cell(44).getAttribute('aria-label')).toBe('e3, white pawn');
    for (const [f, to] of [
      [11, 19],
      [44, 36],
      [19, 27],
    ] as const) {
      fireEvent.click(cell(f));
      fireEvent.click(cell(to));
    }
    fireEvent.click(cell(36));
    expect(cell(27).getAttribute('aria-label')).toBe('d5, black pawn, capture');
    fireEvent.click(cell(27));
    expect(screen.getByTestId('counts').textContent).toBe('White 16 · Black 15');
  });
});
