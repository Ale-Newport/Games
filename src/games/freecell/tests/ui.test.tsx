// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const card = (pile: string, i: number) =>
  document.querySelector(`[data-pile-card="${pile}:${i}"]`) as HTMLElement;
const tap = (el: Element) => {
  fireEvent.pointerDown(el, { button: 0, pointerId: 1, clientX: 10, clientY: 10 });
  fireEvent.pointerUp(el, { button: 0, pointerId: 1, clientX: 10, clientY: 10 });
};

afterEach(cleanup);

describe('FreeCell UI', () => {
  it('sends safe cards home by itself, then moves a card by tapping it twice', async () => {
    const { services } = createTestServices({ launchParams: { deal: '2' } });
    render(<Game services={services} />);
    await act(async () => {});
    // Deal 2: the ace of hearts on column 4 goes home on its own.
    await waitFor(() => expect(card('f0', 0)?.getAttribute('aria-label')).toBe('ace of hearts'));
    expect(card('c0', 6).getAttribute('aria-label')).toBe('ten of spades');
    tap(card('c0', 6));
    tap(card('c0', 6));
    expect(card('c5', 6).getAttribute('aria-label')).toBe('ten of spades');
    // Any safe card the move freed goes home by itself afterwards.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 120));
    });
    // Undo takes back the move and the automatic plays after it, and they do not come back.
    fireEvent.click(screen.getByTestId('sol-undo'));
    expect(card('c0', 6).getAttribute('aria-label')).toBe('ten of spades');
    await act(async () => {
      await new Promise((r) => setTimeout(r, 120));
    });
    expect(screen.getByTestId('sol-moves').textContent).toBe('1');
  });

  it('parks a card in a free cell by tapping the cell', async () => {
    const { services } = createTestServices({ launchParams: { deal: '2' } });
    render(<Game services={services} />);
    await act(async () => {});
    await waitFor(() => expect(screen.getByTestId('sol-moves').textContent).toBe('1'));
    tap(card('c1', 6));
    tap(document.querySelector('[data-pile="r2"]')!);
    expect(card('r2', 0).getAttribute('aria-label')).toBe('six of diamonds');
  });
});
