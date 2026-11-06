// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const cell = (p: number) => document.querySelector(`[data-cell="${p}"]`) as HTMLButtonElement;

afterEach(cleanup);

describe('Domineering UI', () => {
  it('places a domino by tapping a cell and a highlighted neighbor', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    const vertical =
      screen.getByTestId('status-info').textContent === 'Blue places a vertical domino';
    fireEvent.click(cell(9)); // b7
    // Only the neighbors in the mover's orientation light up.
    expect(cell(17).getAttribute('aria-label')).toBe(
      vertical ? 'b6, empty, completes the domino' : 'b6, empty',
    );
    expect(cell(10).getAttribute('aria-label')).toBe(
      vertical ? 'c7, empty' : 'c7, empty, completes the domino',
    );
    fireEvent.click(vertical ? cell(17) : cell(10));
    expect(cell(9).getAttribute('aria-label')).toBe('b7, covered');
    expect(screen.getByTestId('status-info').textContent).toBe(
      vertical ? 'Orange places a horizontal domino' : 'Blue places a vertical domino',
    );
  });
});
