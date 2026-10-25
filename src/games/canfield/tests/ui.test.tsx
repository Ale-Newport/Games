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

describe('Canfield UI', () => {
  it('sends a card home, refills from the reserve, draws three and undoes', async () => {
    const { services } = createTestServices({ launchParams: { deal: '3' } });
    render(<Game services={services} />);
    await act(async () => {});
    expect(screen.getByTestId('sol-info').textContent).toBe('Reserve 13 · Base 7');
    tap(card('t1', 0));
    tap(card('t1', 0));
    expect(card('f0', 1).getAttribute('aria-label')).toBe('eight of clubs');
    expect(screen.getByTestId('sol-info').textContent).toBe('Reserve 12 · Base 7');
    fireEvent.keyDown(window, { key: 'd' });
    expect(document.querySelectorAll('[data-pile-card^="waste:"]')).toHaveLength(3);
    fireEvent.click(screen.getByTestId('sol-undo'));
    expect(document.querySelectorAll('[data-pile-card^="waste:"]')).toHaveLength(0);
  });
});
