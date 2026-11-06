// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const cell = (i: number) => document.querySelector(`[data-cell="${i}"]`) as SVGPolygonElement;

afterEach(cleanup);

describe('Hex 7×7 UI', () => {
  it('offers the swap after the first stone and highlights the winning chain', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    expect(document.querySelectorAll('[data-cell]')).toHaveLength(49);
    expect(screen.getByTestId('status-info').textContent).toBe(
      'Red joins top and bottom · Blue joins left and right',
    );
    fireEvent.click(cell(24));
    expect(screen.getByTestId('swap')).toBeTruthy();
    fireEvent.click(screen.getByTestId('swap'));
    expect(cell(24).getAttribute('aria-label')).toBe('d4, blue stone');
    expect(screen.queryByTestId('swap')).toBeNull();
    // Red runs straight down column a while Blue plays on the right.
    for (let r = 0; r < 7; r++) {
      fireEvent.click(cell(r * 7));
      if (r < 6) fireEvent.click(cell(r * 7 + 6));
    }
    expect(screen.getByTestId('mnk-status').textContent).toContain('wins');
    expect(screen.getByTestId('mnk-status').textContent).toContain('connected their sides in 7');
  });
});
