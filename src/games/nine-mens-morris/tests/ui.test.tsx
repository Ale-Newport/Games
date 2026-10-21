// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const point = (name: string) =>
  document.querySelector(`[data-point="${name}"]`) as SVGCircleElement;

afterEach(cleanup);

describe("Nine Men's Morris UI", () => {
  it('places pieces, closes a mill and removes an opponent piece', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    expect(document.querySelectorAll('[data-point]')).toHaveLength(24);
    expect(screen.getByTestId('status-info').textContent).toBe('Placing — White 9 · Black 9 left');
    for (const p of ['a7', 'a1', 'd7', 'd1']) fireEvent.click(point(p));
    fireEvent.click(point('g7'));
    expect(screen.getByText('Mill! Choose an opponent piece to remove.')).toBeTruthy();
    expect(point('a1').getAttribute('aria-label')).toBe('a1, black piece, can be removed');
    fireEvent.click(point('a1'));
    expect(point('a1').getAttribute('aria-label')).toBe('a1, empty, move here');
    expect(screen.getByTestId('status-info').textContent).toBe('Placing — White 6 · Black 7 left');
  });
});
