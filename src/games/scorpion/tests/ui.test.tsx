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

describe('Scorpion UI', () => {
  it('builds by suit with two taps, deals the reserve and undoes', async () => {
    const { services } = createTestServices({ launchParams: { deal: '1' } });
    render(<Game services={services} />);
    await act(async () => {});
    tap(card('c0', 6));
    tap(card('c0', 6));
    expect(card('c6', 7).getAttribute('aria-label')).toBe('five of clubs');
    fireEvent.keyDown(window, { key: 'd' });
    expect(screen.getByTestId('sol-info').textContent).toBe('Stock 0');
    fireEvent.click(screen.getByTestId('sol-undo'));
    expect(screen.getByTestId('sol-info').textContent).toBe('Stock 3');
  });
});
