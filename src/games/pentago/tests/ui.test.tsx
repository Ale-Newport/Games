// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const cell = (p: number) => document.querySelector(`[data-cell="${p}"]`) as HTMLButtonElement;

afterEach(cleanup);

describe('Pentago UI', () => {
  it('places a marble, then twists a quadrant', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    expect(screen.getByText('Place a marble')).toBeTruthy();
    fireEvent.click(cell(0));
    expect(screen.getByText('Now twist a quadrant')).toBeTruthy();
    fireEvent.click(screen.getByTestId('twist-0R'));
    // The marble placed on a6 (cell 0) is carried to c6 (cell 2) by the clockwise twist.
    expect(cell(2).getAttribute('aria-label')).toBe('c6, white marble');
    expect(cell(0).getAttribute('aria-label')).toBe('a6, empty');
    expect(screen.getByTestId('mnk-status').textContent).toContain("Player 2's turn");
  });
});
