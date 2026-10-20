// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const square = (i: number) => document.querySelector(`[data-square="${i}"]`) as HTMLButtonElement;

afterEach(cleanup);

describe('Reversi 8×8 UI', () => {
  it('shows legal moves, flips discs and updates the counts', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    expect(document.querySelectorAll('[data-square]')).toHaveLength(64);
    expect(square(19).getAttribute('aria-label')).toBe('d3, empty, legal move');
    expect(screen.getByTestId('status-info').textContent).toBe('Black 2 · White 2');
    fireEvent.click(square(0)); // illegal
    expect(square(0).getAttribute('aria-label')).toBe('a1, empty');
    fireEvent.click(square(19));
    expect(square(27).getAttribute('aria-label')).toBe('d4, black');
    expect(screen.getByTestId('status-info').textContent).toBe('Black 4 · White 1');
    fireEvent.keyDown(window, { key: 'u' });
    expect(screen.getByTestId('status-info').textContent).toBe('Black 2 · White 2');
  });
});
