// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const cell = (p: number) => document.querySelector(`[data-cell="${p}"]`) as HTMLButtonElement;
const partners = () => document.querySelectorAll('[aria-label$="completes the domino"]');

afterEach(cleanup);

describe('Cram UI', () => {
  it('offers neighbors in both directions and places a domino', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    fireEvent.click(cell(7)); // b4 on the 5 × 6 grid
    expect(partners()).toHaveLength(4);
    fireEvent.click(cell(8));
    expect(cell(7).getAttribute('aria-label')).toBe('b4, covered');
    expect(cell(8).getAttribute('aria-label')).toBe('c4, covered');
    // A corner next to two covered cells has a single partner: a second tap places it.
    fireEvent.click(cell(0));
    fireEvent.click(cell(1));
    fireEvent.click(cell(6));
    expect(partners()).toHaveLength(1);
    fireEvent.click(cell(6));
    expect(partners()).toHaveLength(0);
    expect(cell(6).getAttribute('aria-label')).toBe('a4, covered');
    expect(cell(12).getAttribute('aria-label')).toBe('a3, covered');
  });
});
