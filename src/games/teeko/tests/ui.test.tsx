// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const cell = (p: number) => document.querySelector(`[data-cell="${p}"]`) as HTMLButtonElement;

afterEach(cleanup);

describe('Teeko UI', () => {
  it('drops markers, then moves one step and highlights targets', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    for (const p of [0, 24, 2, 23, 4, 22, 12, 18]) fireEvent.click(cell(p));
    expect(screen.getByText('Moving: slide a marker to a neighboring cell')).toBeTruthy();
    fireEvent.click(cell(12));
    expect(cell(13).getAttribute('aria-label')).toBe('d3, empty, move here');
    fireEvent.click(cell(13));
    expect(cell(13).getAttribute('aria-label')).toBe('d3, black marker');
  });
});
