// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const point = (p: number) => document.querySelector(`[data-point="${p}"]`) as SVGCircleElement;

afterEach(cleanup);

describe('Bagh-Chal UI', () => {
  it('places a goat, then a tiger moves', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    expect(point(12).getAttribute('aria-label')).toBe('c3, empty, place here');
    fireEvent.click(point(12));
    expect(screen.getByTestId('counts').textContent).toBe('Goats eaten 0 of 5 · in hand 19');
    fireEvent.click(point(0));
    fireEvent.click(point(1));
    expect(point(1).getAttribute('aria-label')).toBe('b5, tiger');
  });
});
