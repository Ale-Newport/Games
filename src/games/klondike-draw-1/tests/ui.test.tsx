// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const card = (pile: string, i: number) =>
  document.querySelector(`[data-pile-card="${pile}:${i}"]`) as HTMLElement;
const tap = (el: Element) => {
  fireEvent.pointerDown(el, { button: 0, pointerId: 1, clientX: 10, clientY: 10 });
  fireEvent.pointerUp(el, { button: 0, pointerId: 1, clientX: 10, clientY: 10 });
};
const key = (k: string) => fireEvent.keyDown(window, { key: k });

afterEach(cleanup);

describe('Klondike Draw One UI', () => {
  it('taps a card twice to send it home, draws, undoes and records an abandoned deal', async () => {
    const { services, calls } = createTestServices({ launchParams: { deal: '3' } });
    render(<Game services={services} />);
    await act(async () => {});
    expect(screen.getByTestId('sol-deal').textContent).toBe('#3');
    // Deal 3: column 2 shows the ace of diamonds.
    expect(card('t1', 1).getAttribute('aria-label')).toBe('ace of diamonds');
    tap(card('t1', 1));
    tap(card('t1', 1));
    expect(card('f0', 0).getAttribute('aria-label')).toBe('ace of diamonds');
    expect(card('t1', 0).getAttribute('aria-label')).not.toBe('face-down card'); // turned up
    expect(screen.getByTestId('sol-score').textContent).toBe('15');
    key('d');
    expect(screen.getByTestId('sol-moves').textContent).toBe('2');
    expect(card('waste', 0)).toBeTruthy();
    key('u');
    expect(screen.getByTestId('sol-moves').textContent).toBe('1');
    fireEvent.click(screen.getByTestId('sol-new'));
    expect(calls.results).toEqual([{ outcome: 'loss', mode: 'draw-1' }]);
    expect(screen.getByTestId('sol-moves').textContent).toBe('0');
  });

  it('drags a card onto another column', async () => {
    const { services } = createTestServices({ launchParams: { deal: '1' } });
    render(<Game services={services} />);
    await act(async () => {});
    // Deal 1: drag the 8♣ (column 3) one column left onto the 9♦.
    const eight = card('t2', 2);
    expect(eight.getAttribute('aria-label')).toBe('eight of clubs');
    const board = screen.getByRole('application');
    fireEvent.pointerDown(eight, { button: 0, pointerId: 7, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(board, { pointerId: 7, clientX: 80, clientY: 104 });
    fireEvent.pointerMove(board, { pointerId: 7, clientX: 60, clientY: 108 });
    fireEvent.pointerUp(board, { pointerId: 7, clientX: 60, clientY: 108 });
    expect(card('t1', 2).getAttribute('aria-label')).toBe('eight of clubs');
    expect(screen.getByTestId('sol-moves').textContent).toBe('1');
  });

  it('shows a hint and resumes a saved deal', async () => {
    const first = createTestServices({ launchParams: { deal: '3' } });
    render(<Game services={first.services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('sol-hint'));
    expect(document.querySelectorAll('[class*="hinted"]').length).toBeGreaterThan(0);
    tap(card('t1', 1));
    tap(card('t1', 1));
    const saved = first.getSaved();
    cleanup();
    const second = createTestServices({}, saved);
    render(<Game services={second.services} />);
    await act(async () => {});
    expect(screen.getByTestId('sol-deal').textContent).toBe('#3');
    expect(screen.getByTestId('sol-moves').textContent).toBe('1');
  });
});
