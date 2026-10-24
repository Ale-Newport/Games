// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const hole = (c: number) => document.querySelector(`[data-cell="${c}"]`) as SVGElement;

afterEach(cleanup);

describe('Chinese Checkers UI', () => {
  it('picks a marble and moves it out of the point', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    expect(document.querySelectorAll('[data-cell]')).toHaveLength(121);
    // The front marble of the bottom point (row 4, hole 4) steps up to row 5, hole 8.
    expect(hole(114).getAttribute('aria-label')).toBe('4·4, Orange');
    fireEvent.click(hole(114));
    expect(hole(105).getAttribute('aria-label')).toContain('move here');
    fireEvent.click(hole(105));
    expect(hole(105).getAttribute('aria-label')).toBe('5·8, Orange');
    expect(hole(114).getAttribute('aria-label')).toBe('4·4, empty');
  });
});
