// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const point = (name: string) =>
  document.querySelector(`[data-square="${name}"]`) as HTMLButtonElement;
const play = (from: string, to: string) => {
  fireEvent.click(point(from));
  fireEvent.click(point(to));
};

afterEach(cleanup);

describe('Xiangqi UI', () => {
  it('shows cannon moves and captures, and lists moves', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    expect(document.querySelectorAll('[data-square]')).toHaveLength(90);
    expect(point('e0').getAttribute('aria-label')).toBe('e0, red general');
    fireEvent.click(point('h2'));
    expect(point('h9').getAttribute('aria-label')).toBe('h9, black horse, capture here');
    expect(point('h8').getAttribute('aria-label')).not.toContain('move here'); // needs a screen
    fireEvent.click(point('e2'));
    play('h7', 'e7');
    expect(screen.getByTestId('move-list').textContent).toBe('1.Ch2-e2Ch7-e7');
    play('e2', 'e6');
    expect(screen.getByTestId('status-info').textContent).toBe('Check!');
  });
});
