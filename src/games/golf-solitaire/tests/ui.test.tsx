// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const card = (pile: string) =>
  document.querySelector(`[data-pile-card="${pile}:0"]`) as HTMLElement;
const tap = (el: Element) => {
  fireEvent.pointerDown(el, { button: 0, pointerId: 1, clientX: 10, clientY: 10 });
  fireEvent.pointerUp(el, { button: 0, pointerId: 1, clientX: 10, clientY: 10 });
};

afterEach(cleanup);

describe('Golf UI', () => {
  it('plays a column top with one tap, counts strokes, draws and undoes', async () => {
    const { services } = createTestServices({ launchParams: { deal: '3' } });
    render(<Game services={services} />);
    await act(async () => {});
    expect(screen.getByTestId('sol-score').textContent).toBe('35');
    tap(card('p19')); // 4♦ onto 3♥
    expect(card('p19')).toBeNull();
    expect(screen.getByTestId('sol-score').textContent).toBe('34');
    tap(card('p34')); // 4♠ does not fit the 4♦
    expect(card('p34')).not.toBeNull();
    fireEvent.keyDown(window, { key: 'd' });
    expect(screen.getByTestId('sol-info').textContent).toBe('Stock 15');
    fireEvent.click(screen.getByTestId('sol-undo'));
    expect(screen.getByTestId('sol-info').textContent).toBe('Stock 16');
  });
});
