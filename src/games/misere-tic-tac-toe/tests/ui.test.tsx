// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const cell = (i: number) => document.querySelector(`[data-cell="${i}"]`) as HTMLButtonElement;
const status = () => screen.getByTestId('mnk-status').textContent ?? '';

afterEach(cleanup);

describe('Misère Tic-Tac-Toe UI', () => {
  it('awards the round to the player who did not complete the line and explains why', async () => {
    const { services, calls } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    for (const i of [0, 3, 1, 4, 2]) fireEvent.click(cell(i)); // X completes the top row
    expect(status()).toContain('Player 2 wins!');
    expect(status()).toContain('X completed three in a row.');
    expect(screen.getByTestId('score-o').textContent).toBe('1');
    expect(calls.results).toEqual([{ outcome: 'complete', mode: 'local' }]);
  });
});
