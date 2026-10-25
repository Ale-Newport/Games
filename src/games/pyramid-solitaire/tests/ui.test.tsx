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

describe('Pyramid UI', () => {
  it('removes a king with two taps and a pair making 13, draws and undoes', async () => {
    const { services } = createTestServices({ launchParams: { deal: '2' } });
    render(<Game services={services} />);
    await act(async () => {});
    expect(card('p21').getAttribute('aria-label')).toBe('king of diamonds');
    tap(card('p21'));
    tap(card('p21'));
    expect(card('p21')).toBeNull();
    tap(card('p24'));
    tap(card('p27'));
    expect(card('p24')).toBeNull();
    expect(card('p27')).toBeNull();
    expect(screen.getByTestId('sol-score').textContent).toBe('15');
    fireEvent.keyDown(window, { key: 'd' });
    expect(card('waste').getAttribute('aria-label')).toBe('ace of hearts');
    fireEvent.click(screen.getByTestId('sol-undo'));
    expect(card('waste')).toBeNull();
    expect(screen.getByTestId('sol-info').textContent).toBe('Passes left 3');
  });
});
