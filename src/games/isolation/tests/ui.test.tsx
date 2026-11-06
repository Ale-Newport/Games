// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const cell = (p: number) => document.querySelector(`[data-cell="${p}"]`) as HTMLButtonElement;

afterEach(cleanup);

describe('Isolation UI', () => {
  it('moves the pawn, then removes a tile', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    expect(screen.getByTestId('status-info').textContent).toBe('Step 1: move your pawn one cell');
    expect(cell(38).getAttribute('aria-label')).toBe('d2, tile, move here');
    fireEvent.click(cell(38));
    expect(cell(38).getAttribute('aria-label')).toBe('d2, gold pawn');
    expect(screen.getByTestId('status-info').textContent).toBe('Step 2: remove any free tile');
    fireEvent.click(cell(10));
    expect(cell(10).getAttribute('aria-label')).toBe('d6, removed');
    expect(screen.getByTestId('mobility').textContent).toBe('Free steps — Gold 8 · Jade 4');
  });
});
