// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const cell = (p: number) => document.querySelector(`[data-cell="${p}"]`) as HTMLButtonElement;

afterEach(cleanup);

describe('Konane UI', () => {
  it('opens with two removals, then jumps', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    expect(screen.getByTestId('status-info').textContent).toBe(
      'Black opens: remove a black stone from the middle or a corner',
    );
    expect(cell(14).getAttribute('aria-label')).toBe('c4, black stone, remove to open');
    fireEvent.click(cell(14));
    fireEvent.click(cell(15));
    expect(screen.getByTestId('status-info').textContent).toBe(
      'Jump over an enemy stone — the last to jump wins',
    );
    fireEvent.click(cell(12));
    expect(cell(14).getAttribute('aria-label')).toBe('c4, empty, land here');
    fireEvent.click(cell(14));
    expect(cell(14).getAttribute('aria-label')).toBe('c4, black stone');
    expect(screen.getByTestId('counts').textContent).toBe('Black 17 · White 16');
  });
});
