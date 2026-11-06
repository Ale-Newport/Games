// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const point = (p: number) => document.querySelector(`[data-point="${p}"]`) as SVGCircleElement;

afterEach(cleanup);

describe('Fox and Geese UI', () => {
  it('moves a goose forward, never back', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    expect(screen.getByTestId('status-info').textContent).toBe(
      'Geese: trap the fox (no stepping back)',
    );
    fireEvent.click(point(14));
    expect(point(21).getAttribute('aria-label')).toBe('a4, empty, move here');
    expect(point(7)).toBeNull(); // not a point of the cross
    fireEvent.click(point(21));
    expect(point(21).getAttribute('aria-label')).toBe('a4, goose');
    expect(screen.getByTestId('status-info').textContent).toBe(
      'Fox: jump the geese — 8 captures win',
    );
  });
});
