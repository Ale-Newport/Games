// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const line = (l: number) => document.querySelector(`[data-line="${l}"]`) as SVGRectElement;

afterEach(cleanup);

describe('Dots and Boxes UI', () => {
  it('draws lines, closes a box and gives an extra turn', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    expect(line(0).getAttribute('aria-label')).toBe('a5–b5, free line');
    for (const l of [0, 20, 21]) fireEvent.click(line(l));
    expect(line(0).getAttribute('aria-label')).toBe('a5–b5, drawn by Orange');
    fireEvent.click(line(4));
    expect(screen.getByTestId('scores').textContent).toBe('Boxes — Orange 0 · Blue 1');
    expect(screen.getByTestId('status-info').textContent).toBe('Box closed: Blue draws again');
    // A drawn line cannot be drawn again.
    fireEvent.click(line(4));
    expect(line(4).getAttribute('aria-label')).toBe('a4–b4, drawn by Blue');
    expect(line(5).getAttribute('aria-label')).toBe('b4–c4, free line');
  });
});
