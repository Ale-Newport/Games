// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const top = (pile: string) => {
  const cards = document.querySelectorAll(`[data-pile-card^="${pile}:"]`);
  return cards[cards.length - 1] as HTMLElement;
};
const tap = (el: Element) => {
  fireEvent.pointerDown(el, { button: 0, pointerId: 1, clientX: 10, clientY: 10 });
  fireEvent.pointerUp(el, { button: 0, pointerId: 1, clientX: 10, clientY: 10 });
};

afterEach(cleanup);

describe('Accordion UI', () => {
  it('deals, moves a pile left by rank and three left by suit, and undoes', async () => {
    const { services } = createTestServices({ launchParams: { deal: '1' } });
    render(<Game services={services} />);
    await act(async () => {});
    for (let i = 0; i < 6; i++) fireEvent.keyDown(window, { key: 'd' });
    expect(screen.getByTestId('sol-info').textContent).toBe('Row 6 · Stock 46');
    tap(top('p4'));
    tap(top('p3'));
    expect(top('p3').getAttribute('aria-label')).toBe('six of hearts');
    tap(top('p4')); // the K♣ — tapped twice it jumps three left onto the Q♣
    tap(top('p4'));
    expect(top('p1').getAttribute('aria-label')).toBe('king of clubs');
    expect(screen.getByTestId('sol-info').textContent).toBe('Row 4 · Stock 46');
    fireEvent.click(screen.getByTestId('sol-undo'));
    expect(screen.getByTestId('sol-info').textContent).toBe('Row 5 · Stock 46');
  });
});
