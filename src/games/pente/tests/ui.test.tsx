// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const point = (i: number) => document.querySelector(`[data-point="${i}"]`) as HTMLButtonElement;
const at = (r: number, c: number) => r * 19 + c;

afterEach(cleanup);

describe('Pente UI', () => {
  it('shows live capture counts and removes a captured pair', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    expect(document.querySelectorAll('[data-point]')).toHaveLength(361);
    expect(screen.getByTestId('status-info').textContent).toContain('Black 0 · White 0');
    // Center, reply, tournament-legal third stone, then a capture setup.
    for (const p of [at(9, 9), at(9, 10), at(3, 3), at(5, 6), at(5, 5), at(5, 7)])
      fireEvent.click(point(p));
    fireEvent.click(point(at(5, 8)));
    expect(point(at(5, 6)).getAttribute('aria-label')).toContain('empty');
    expect(point(at(5, 7)).getAttribute('aria-label')).toContain('empty');
    expect(screen.getByTestId('status-info').textContent).toContain('Black 1 · White 0');
  });

  it('marks tournament-rule points as not allowed on Black’s second stone', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    fireEvent.click(point(at(9, 9)));
    fireEvent.click(point(at(9, 10)));
    expect(point(at(9, 11)).getAttribute('aria-label')).toContain(
      'not allowed by the tournament rule',
    );
    fireEvent.click(point(at(9, 11)));
    expect(point(at(9, 11)).getAttribute('aria-label')).not.toContain('black stone');
  });
});
