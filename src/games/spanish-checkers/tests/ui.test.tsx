// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

afterEach(cleanup);

describe('Spanish checkers UI', () => {
  it('starts with 12 men each on the other square color and lets White move', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    expect(screen.getByTestId('status-info').textContent).toBe('White 12 · Black 12');
    const movable = [...document.querySelectorAll('[data-square]')].filter((el) =>
      el.getAttribute('aria-label')?.includes('can move'),
    );
    expect(movable).toHaveLength(4);
    fireEvent.click(movable[0]!);
    const target = [...document.querySelectorAll('[data-square]')].find((el) =>
      el.getAttribute('aria-label')?.includes('move here'),
    )!;
    fireEvent.click(target);
    expect(screen.getByTestId('mnk-status').textContent).toContain("Player 2's turn");
  });
});
