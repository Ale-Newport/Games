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

afterEach(cleanup);

describe('Spider Four Suits UI', () => {
  it('moves a card by tapping it twice, deals ten cards and undoes', async () => {
    const { services } = createTestServices({ launchParams: { deal: '1' } });
    render(<Game services={services} />);
    await act(async () => {});
    expect(screen.getByTestId('sol-info').textContent).toBe('Deals left 5');
    tap(card('c2', 5));
    tap(card('c2', 5));
    expect(card('c6', 5).getAttribute('aria-label')).toBe('four of diamonds');
    expect(card('c2', 4).getAttribute('aria-label')).not.toBe('face-down card');
    expect(screen.getByTestId('sol-score').textContent).toBe('499');
    fireEvent.keyDown(window, { key: 'd' });
    expect(screen.getByTestId('sol-info').textContent).toBe('Deals left 4');
    fireEvent.click(screen.getByTestId('sol-undo'));
    expect(screen.getByTestId('sol-info').textContent).toBe('Deals left 5');
  });
});
