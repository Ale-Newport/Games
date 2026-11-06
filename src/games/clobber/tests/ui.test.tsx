// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const cell = (p: number) => document.querySelector(`[data-cell="${p}"]`) as HTMLButtonElement;

afterEach(cleanup);

describe('Clobber UI', () => {
  it('selects a stone, shows its targets and clobbers one', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    // White moves first in round 1; c4 (14) is a White stone surrounded by Black ones.
    const from = 14;
    fireEvent.click(cell(from));
    const targets = document.querySelectorAll('[aria-label$=", clobber"]');
    expect(targets.length).toBe(4);
    fireEvent.click(cell(from + 1));
    expect(cell(from).getAttribute('aria-label')).toMatch(/, empty$/);
    expect(screen.getByTestId('counts').textContent).toMatch(/White (17|18) · Black (17|18)/);
  });
});
