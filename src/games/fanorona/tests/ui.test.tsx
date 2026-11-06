// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const point = (p: number) => document.querySelector(`[data-point="${p}"]`) as SVGCircleElement;

afterEach(cleanup);

describe('Fanorona UI', () => {
  it('shows the compulsory capture, then captures a line by approach', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    expect(screen.getByTestId('status-info').textContent).toBe(
      'A capture is available: you must capture',
    );
    fireEvent.click(point(31));
    expect(point(22).getAttribute('aria-label')).toBe('e3, empty, move here');
    fireEvent.click(point(22));
    expect(screen.getByTestId('counts').textContent).toBe('White 22 · Black 20');
  });
});
