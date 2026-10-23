// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const cell = (p: number) => document.querySelector(`[data-cell="${p}"]`) as HTMLButtonElement;

afterEach(cleanup);

describe('Yoté UI', () => {
  it('places, jumps, and takes the bonus from the hand', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    expect(cell(14).getAttribute('aria-label')).toBe('c3, empty, place here');
    fireEvent.click(cell(14));
    fireEvent.click(cell(15));
    fireEvent.click(cell(14));
    expect(cell(16).getAttribute('aria-label')).toBe('e3, empty, move here');
    fireEvent.click(cell(16));
    expect(screen.getByTestId('status-info').textContent).toBe(
      'Capture! Now remove one more enemy piece',
    );
    fireEvent.click(screen.getByTestId('from-hand'));
    expect(screen.getByTestId('hand-1').getAttribute('aria-label')).toBe('Dark pieces in hand: 10');
  });
});
