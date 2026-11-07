// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const cell = (x: number, y: number) =>
  document.querySelector(`[data-cell="${y * 16 + x}"]`) as SVGElement;

afterEach(cleanup);

describe('Halma UI', () => {
  it('picks a piece and moves it to a marked square', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    expect(document.querySelectorAll('[data-cell]')).toHaveLength(256);
    // Orange's front-edge piece at (10, 15) steps diagonally to (9, 14).
    fireEvent.click(cell(11, 14));
    expect(cell(10, 13).getAttribute('aria-label')).toContain('move here');
    fireEvent.click(cell(10, 13));
    expect(cell(10, 13).getAttribute('aria-label')).toContain('Orange');
    expect(cell(11, 14).getAttribute('aria-label')).toContain('empty');
    expect(screen.getByTestId('mnk-status').textContent).toContain('Teal');
  });
});
