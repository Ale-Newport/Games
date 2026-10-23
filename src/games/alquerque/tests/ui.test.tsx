// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const point = (p: number) => document.querySelector(`[data-point="${p}"]`) as SVGCircleElement;

afterEach(cleanup);

describe('Alquerque UI', () => {
  it('fills the center, then Black must capture', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    fireEvent.click(point(17));
    expect(point(12).getAttribute('aria-label')).toBe('c3, empty, move here');
    fireEvent.click(point(12));
    expect(screen.getByTestId('status-info').textContent).toBe(
      'A capture is available: you must capture',
    );
    fireEvent.click(point(7));
    fireEvent.click(point(17));
    expect(screen.getByTestId('counts').textContent).toBe('White 11 · Black 12');
  });
});
