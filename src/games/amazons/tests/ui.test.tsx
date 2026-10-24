// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const cell = (c: number) => document.querySelector(`[data-cell="${c}"]`) as SVGElement;

afterEach(cleanup);

describe('Amazons UI', () => {
  it('plays a turn in three taps: amazon, square, arrow', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    expect(screen.getByTestId('amazons-phase').textContent).toContain('Choose an amazon');
    fireEvent.click(cell(93)); // d1
    expect(cell(83).getAttribute('aria-label')).toBe('d2, empty, move here');
    fireEvent.click(cell(83));
    expect(screen.getByTestId('amazons-phase').textContent).toContain('shoots');
    expect(cell(93).getAttribute('aria-label')).toBe('d1, empty, shoot here');
    fireEvent.click(cell(93));
    expect(cell(93).getAttribute('aria-label')).toBe('d1, burned');
    expect(cell(83).getAttribute('aria-label')).toBe('d2, White');
    expect(screen.getByTestId('mnk-status').textContent).toMatch(/Squares you reach first/);
  });

  it('steps back from the arrow choice', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    fireEvent.click(cell(93));
    fireEvent.click(cell(83));
    fireEvent.click(cell(83)); // back to choosing the square
    expect(cell(73).getAttribute('aria-label')).toContain('move here');
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.getByTestId('amazons-phase').textContent).toContain('Choose an amazon');
  });
});
