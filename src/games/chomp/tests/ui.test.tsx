// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const square = (r: number, c: number) =>
  document.querySelector(`[data-square="${r},${c}"]`) as HTMLButtonElement;

afterEach(cleanup);

describe('Chomp UI', () => {
  it('previews a bite, eats it, and refuses the poison', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    expect(square(0, 0).getAttribute('aria-label')).toBe('A1, poisoned square');
    fireEvent.click(square(0, 0));
    expect(screen.queryByTestId('eat')).toBeNull();
    const rows = document.querySelectorAll('[data-square$=",0"]').length;
    fireEvent.click(square(rows - 1, 1));
    const cols = document.querySelectorAll('[data-square^="0,"]').length;
    expect(screen.getByTestId('eat').textContent).toBe(`Eat ${cols - 1}`);
    fireEvent.click(square(rows - 1, 1));
    expect(square(rows - 1, 1).getAttribute('aria-label')).toBe(`B${rows}, eaten`);
    expect(square(rows - 1, 0).getAttribute('aria-label')).toBe(`A${rows}, chocolate`);
  });
});
