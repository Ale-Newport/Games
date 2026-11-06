// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const square = (p: number) => document.querySelector(`[data-square="${p}"]`) as HTMLButtonElement;

afterEach(cleanup);

describe('Hnefatafl UI', () => {
  it('moves an attacker like a rook', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    expect(screen.getByTestId('status-info').textContent).toBe(
      'Attackers: surround the king on all four sides',
    );
    expect(square(60).getAttribute('aria-label')).toBe('f6, king');
    fireEvent.click(square(3)); // d11
    expect(square(25).getAttribute('aria-label')).toBe('d9, empty, move here');
    fireEvent.click(square(25));
    expect(square(25).getAttribute('aria-label')).toBe('d9, attacker');
    expect(screen.getByTestId('status-info').textContent).toBe(
      'Defenders: bring the king to a corner',
    );
  });
});
