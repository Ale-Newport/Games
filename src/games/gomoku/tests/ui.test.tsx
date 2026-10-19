// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const point = (i: number) => document.querySelector(`[data-point="${i}"]`) as HTMLButtonElement;
const at = (r: number, c: number) => r * 15 + c;

afterEach(cleanup);

async function startLocal() {
  const { services } = createTestServices();
  render(<Game services={services} />);
  await act(async () => {});
  fireEvent.click(screen.getByTestId('mode-local'));
  fireEvent.click(screen.getByTestId('start-match'));
}

describe('Gomoku UI', () => {
  it('places stones with the mouse and finishes with five', async () => {
    await startLocal();
    expect(document.querySelectorAll('[data-point]')).toHaveLength(225);
    const moves = [at(7, 3), at(0, 0), at(7, 4), at(0, 1), at(7, 5), at(0, 2), at(7, 6), at(0, 3)];
    for (const m of moves) fireEvent.click(point(m));
    expect(point(at(7, 3)).getAttribute('aria-label')).toBe('D8, black stone');
    fireEvent.click(point(at(7, 7)));
    expect(screen.getByTestId('mnk-status').textContent).toContain('Tester wins!');
  });

  it('needs a second tap on touch screens', async () => {
    await startLocal();
    const board = screen.getByTestId('go-board');
    fireEvent.pointerDown(board, { pointerType: 'touch' });
    fireEvent.click(point(at(7, 7)));
    expect(point(at(7, 7)).getAttribute('aria-label')).toContain('empty');
    expect(screen.getByText('Tap again to place')).toBeTruthy();
    fireEvent.pointerDown(board, { pointerType: 'touch' });
    fireEvent.click(point(at(7, 7)));
    expect(point(at(7, 7)).getAttribute('aria-label')).toContain('black stone');
  });

  it('moves the cursor with arrows and places with Enter', async () => {
    await startLocal();
    fireEvent.keyDown(window, { key: 'ArrowUp' });
    fireEvent.keyDown(document.body, { key: 'Enter' });
    expect(point(at(6, 7)).getAttribute('aria-label')).toBe('H9, black stone');
  });
});
