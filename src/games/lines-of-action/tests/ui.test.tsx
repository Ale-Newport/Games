// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const cell = (c: number) => document.querySelector(`[data-cell="${c}"]`) as SVGElement;

afterEach(cleanup);

describe('Lines of Action UI', () => {
  it('picks a piece and moves it by the line count', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    expect(screen.getByTestId('mnk-status').textContent).toContain('Groups — Black 2 · White 2');
    fireEvent.click(cell(1)); // b8
    expect(cell(17).getAttribute('aria-label')).toBe('b6, empty, move here');
    expect(cell(9).getAttribute('aria-label')).toBe('b7, empty');
    fireEvent.click(cell(17));
    expect(cell(17).getAttribute('aria-label')).toBe('b6, Black');
    expect(cell(1).getAttribute('aria-label')).toBe('b8, empty');
  });
});
