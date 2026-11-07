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
const waste = () => document.querySelectorAll('[data-pile-card^="waste:"]');

afterEach(cleanup);

describe('TriPeaks UI', () => {
  it('plays cards with single taps, builds a run, draws and undoes', async () => {
    const { services } = createTestServices({ launchParams: { deal: '1' } });
    render(<Game services={services} />);
    await act(async () => {});
    tap(card('p22')); // A♦ onto K♦
    expect(card('p22')).toBeNull();
    expect(waste()).toHaveLength(2);
    expect(screen.getByTestId('sol-info').textContent).toBe('Run 1 · Stock 23');
    tap(card('p18')); // 6♦ does not fit the ace
    expect(card('p18')).not.toBeNull();
    fireEvent.keyDown(window, { key: 'd' });
    expect(screen.getByTestId('sol-info').textContent).toBe('Run 0 · Stock 22');
    fireEvent.click(screen.getByTestId('sol-undo'));
    expect(screen.getByTestId('sol-info').textContent).toBe('Run 1 · Stock 23');
  });
});
