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

describe('Forty Thieves UI', () => {
  it('moves a card in suit, turns the stock and undoes', async () => {
    const { services } = createTestServices({ launchParams: { deal: '2' } });
    render(<Game services={services} />);
    await act(async () => {});
    tap(card('c5', 3));
    tap(card('c5', 3));
    expect(card('c0', 4).getAttribute('aria-label')).toBe('two of hearts');
    fireEvent.keyDown(window, { key: 'd' });
    expect(screen.getByTestId('sol-info').textContent).toBe('Stock 63');
    expect(card('waste', 0)).toBeTruthy();
    fireEvent.click(screen.getByTestId('sol-undo'));
    expect(screen.getByTestId('sol-info').textContent).toBe('Stock 64');
  });
});
