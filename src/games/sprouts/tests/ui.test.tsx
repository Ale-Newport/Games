// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const spot = (i: number) => document.querySelector(`[data-spot="${i}"]`) as SVGGElement;

afterEach(cleanup);

describe('Sprouts UI', () => {
  it('connects two chosen spots with a curve and adds a spot', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    const before = document.querySelectorAll('[data-spot]').length;
    expect(spot(0).getAttribute('aria-label')).toBe('Spot 1, 3 lives left');
    fireEvent.keyDown(spot(0), { key: 'Enter' });
    expect(screen.getByTestId('sprouts-message').textContent).toBe(
      'Spot 1 selected — tap another spot (or the same one for a loop)',
    );
    fireEvent.keyDown(spot(1), { key: 'Enter' });
    expect(document.querySelectorAll('[data-spot]')).toHaveLength(before + 1);
    expect(spot(0).getAttribute('aria-label')).toBe('Spot 1, 2 lives left');
    expect(spot(before).getAttribute('aria-label')).toBe(`Spot ${before + 1}, 1 life left`);
  });
});
