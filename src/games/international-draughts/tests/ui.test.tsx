// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const square = (i: number) => document.querySelector(`[data-square="${i}"]`) as HTMLButtonElement;
const sq = (r: number, c: number) => r * 10 + c;

afterEach(cleanup);

describe('International draughts UI', () => {
  it('renders 100 squares with 20 men each and plays an opening move', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    expect(document.querySelectorAll('[data-square]')).toHaveLength(100);
    expect(screen.getByTestId('status-info').textContent).toBe('White 20 · Black 20');
    fireEvent.click(square(sq(6, 1)));
    fireEvent.click(square(sq(5, 2)));
    expect(square(sq(5, 2)).getAttribute('aria-label')).toContain('white man');
    expect(screen.getByTestId('mnk-status').textContent).toContain("Player 2's turn");
  });
});
