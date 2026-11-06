// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const square = (name: string) =>
  document.querySelector(`[data-square="${name}"]`) as HTMLButtonElement;
const play = (from: string, to: string) => {
  fireEvent.click(square(from));
  fireEvent.click(square(to));
};

afterEach(cleanup);

describe('Antichess UI', () => {
  it('marks compulsory captures and counts the pieces left', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    expect(screen.getByTestId('status-info').textContent).toBe('White 16 · Black 16 pieces left');
    play('e2', 'e3');
    play('b7', 'b5');
    expect(screen.getByTestId('status-info').textContent).toBe(
      'White 16 · Black 16 pieces left · You must capture',
    );
    // Only the bishop can move (it must take on b5); other pieces are inert.
    expect(square('g1').getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(square('f1'));
    expect(square('b5').getAttribute('aria-label')).toBe('b5, black pawn, capture here');
    expect(square('e2').getAttribute('aria-label')).not.toContain('move here');
    fireEvent.click(square('b5'));
    expect(screen.getByTestId('move-list').textContent).toBe('1.e3b52.Bxb5');
    expect(screen.getByTestId('status-info').textContent).toContain('Black 15');
  });
});
