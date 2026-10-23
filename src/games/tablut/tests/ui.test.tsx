// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const square = (p: number) => document.querySelector(`[data-square="${p}"]`) as HTMLButtonElement;

afterEach(cleanup);

describe('Tablut UI', () => {
  it('moves an attacker like a rook', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    expect(screen.getByTestId('status-info').textContent).toBe('Attackers: capture the king');
    expect(square(40).getAttribute('aria-label')).toBe('e5, king');
    fireEvent.click(square(3)); // d9
    expect(square(21).getAttribute('aria-label')).toBe('d7, empty, move here');
    fireEvent.click(square(21));
    expect(square(21).getAttribute('aria-label')).toBe('d7, attacker');
    expect(screen.getByTestId('status-info').textContent).toBe(
      'Defenders: bring the king to any edge square',
    );
  });
});
