// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const cell = (p: number) => document.querySelector(`[data-cell="${p}"]`) as HTMLButtonElement;

afterEach(cleanup);

describe('Ataxx UI', () => {
  it('shows clone and jump targets, then converts neighbors', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    fireEvent.click(cell(0));
    expect(cell(8).getAttribute('aria-label')).toBe('b6, empty, clone here');
    expect(cell(16).getAttribute('aria-label')).toBe('c5, empty, jump here');
    fireEvent.click(cell(8));
    expect(cell(8).getAttribute('aria-label')).toBe('b6, red piece');
    fireEvent.click(cell(6));
    fireEvent.click(cell(18));
    fireEvent.click(cell(8));
    fireEvent.click(cell(10));
    expect(cell(18).getAttribute('aria-label')).toBe('e5, red piece');
    expect(screen.getByTestId('counts').textContent).toBe('Red 4 · Blue 1');
  });
});
