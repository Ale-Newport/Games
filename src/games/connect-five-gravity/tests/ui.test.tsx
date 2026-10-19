// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const column = (c: number) => document.querySelector(`[data-column="${c}"]`) as HTMLButtonElement;

afterEach(cleanup);

describe('Connect Five Gravity UI', () => {
  it('renders 9 columns and plays a horizontal five', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    expect(document.querySelectorAll('[data-column]')).toHaveLength(9);
    for (const c of [0, 0, 1, 1, 2, 2, 3, 3]) fireEvent.click(column(c));
    expect(screen.getByTestId('mnk-status').textContent).not.toContain('wins');
    fireEvent.keyDown(window, { key: '5' });
    expect(screen.getByTestId('mnk-status').textContent).toContain('Tester wins!');
  });
});
