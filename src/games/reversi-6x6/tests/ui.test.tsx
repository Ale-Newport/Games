// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

afterEach(cleanup);

describe('Reversi 6×6 UI', () => {
  it('renders 36 squares and plays a legal opening move', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    expect(document.querySelectorAll('[data-square]')).toHaveLength(36);
    const legal = [...document.querySelectorAll('[data-square]')].filter((el) =>
      el.getAttribute('aria-label')!.endsWith('legal move'),
    );
    expect(legal).toHaveLength(4);
    fireEvent.click(legal[0]!);
    expect(screen.getByTestId('status-info').textContent).toBe('Black 4 · White 1');
  });
});
