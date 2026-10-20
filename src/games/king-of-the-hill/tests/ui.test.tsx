// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

afterEach(cleanup);

describe('King of the Hill UI', () => {
  it('marks the four hill squares and names them in the status', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    expect(screen.getByTestId('status-info').textContent).toBe('Hill: d4 · e4 · d5 · e5');
    const marked = [...document.querySelectorAll('[data-square]')]
      .filter((el) => /hill/.test(el.className))
      .map((el) => el.getAttribute('data-square'))
      .sort();
    expect(marked).toEqual(['d4', 'd5', 'e4', 'e5']);
  });
});
