// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const tap = (el: Element) => {
  fireEvent.pointerDown(el, { button: 0, pointerId: 1, clientX: 10, clientY: 10 });
  fireEvent.pointerUp(el, { button: 0, pointerId: 1, clientX: 10, clientY: 10 });
};

afterEach(cleanup);

describe('Clock UI', () => {
  it('turns a card from the glowing pile and taps it home to its hour', async () => {
    const { services } = createTestServices({ launchParams: { deal: '5' } });
    render(<Game services={services} />);
    await act(async () => {});
    tap(document.querySelector('[data-pile-card="h12:3"]')!);
    const hand = document.querySelector('[data-pile-card="hand:0"]')!;
    expect(hand.getAttribute('aria-label')).not.toBe('face-down card');
    tap(hand);
    expect(document.querySelector('[data-pile-card="hand:0"]')).toBeNull();
    expect(screen.getByTestId('sol-score').textContent).toBe('1');
    fireEvent.keyDown(window, { key: 'd' });
    fireEvent.keyDown(window, { key: 'a' });
    expect(screen.getByTestId('sol-score').textContent).toBe('2');
  });
});
