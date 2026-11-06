// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const point = (name: string) =>
  document.querySelector(`[data-square="${name}"]`) as HTMLButtonElement;

afterEach(cleanup);

describe('Janggi UI', () => {
  it('shows the setups, moves the general along a palace diagonal and passes', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    expect(screen.getByTestId('status-info').textContent).toMatch(
      /^Setup — Cho [HE]{4} · Han [HE]{4}$/,
    );
    expect(point('e1').getAttribute('aria-label')).toBe('e1, Cho general');
    fireEvent.click(point('e1'));
    expect(point('d2').getAttribute('aria-label')).toContain('move here');
    fireEvent.click(point('d2'));
    fireEvent.click(screen.getByTestId('pass'));
    expect(screen.getByTestId('move-list').textContent).toBe('1.Ke1-d2pass');
  });
});
