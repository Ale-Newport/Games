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

describe('Shogi UI', () => {
  it('moves, asks about optional promotion, captures into the hand and drops', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    expect(square('7g').getAttribute('aria-label')).toBe('7g, Sente pawn');
    play('7g', '7f');
    play('3c', '3d');
    play('8h', '2b');
    expect(screen.getByRole('dialog', { name: 'Promote this piece?' })).toBeTruthy();
    fireEvent.click(screen.getByTestId('promote-yes'));
    expect(square('2b').getAttribute('aria-label')).toBe('2b, Sente horse (promoted bishop)');
    expect(screen.getByTestId('hand-0-B').getAttribute('aria-label')).toBe('Sente bishop × 1');
    play('3a', '2b');
    expect(screen.getByTestId('hand-1-B')).toBeTruthy();
    fireEvent.click(screen.getByTestId('hand-0-B'));
    expect(square('5e').getAttribute('aria-label')).toContain('move here');
    fireEvent.click(square('5e'));
    expect(screen.getByTestId('move-list').textContent).toBe(
      '1.☗P-7f2.☖P-3d3.☗Bx2b+4.☖Sx2b5.☗B*5e',
    );
    expect(screen.queryByTestId('hand-0-B')).toBeNull();
  });
});
