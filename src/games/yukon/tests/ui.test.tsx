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

describe('Yukon UI', () => {
  it('moves a face-up card with everything on it, turns a card up and undoes', async () => {
    const { services } = createTestServices({ launchParams: { deal: '1' } });
    render(<Game services={services} />);
    await act(async () => {});
    const moving = card('c3', 5).getAttribute('aria-label');
    tap(card('c3', 5));
    tap(document.querySelector('[data-pile="c1"]')!);
    expect(card('c1', 6).getAttribute('aria-label')).toBe(moving);
    expect(document.querySelectorAll('[data-pile-card^="c3:"]')).toHaveLength(5);
    expect(card('c3', 4).getAttribute('aria-label')).not.toBe('face-down card');
    fireEvent.click(screen.getByTestId('sol-undo'));
    expect(card('c3', 5).getAttribute('aria-label')).toBe(moving);
  });
});
