// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const cell = (i: number) => document.querySelector(`[data-cell="${i}"]`) as HTMLButtonElement;
const piece = (p: number) => document.querySelector(`[data-piece="${p}"]`) as HTMLButtonElement;

afterEach(cleanup);

describe('Quarto UI', () => {
  it('gives, places and gives, then wins with a shared trait', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    expect(screen.getByText('Choose the first piece for your opponent')).toBeTruthy();
    fireEvent.click(piece(1));
    expect(screen.getByTestId('in-hand').getAttribute('aria-label')).toBe(
      'tall, light, round, solid',
    );
    for (const [c, p] of [
      [0, 3],
      [1, 5],
      [2, 7],
    ]) {
      fireEvent.click(cell(c!));
      fireEvent.click(piece(p!));
    }
    fireEvent.click(cell(3));
    expect(screen.getByTestId('mnk-status').textContent).toContain('Quarto! Four pieces');
  });
});
