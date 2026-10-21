// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const point = (i: number) => document.querySelector(`[data-point="${i}"]`) as HTMLButtonElement;
const at = (r: number, c: number) => r * 9 + c;

afterEach(cleanup);

describe('Go 9×9 UI', () => {
  it('captures a stone, passes twice and shows the counted territory', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    expect(document.querySelectorAll('[data-point]')).toHaveLength(81);
    // Black surrounds the white stone on E5.
    for (const p of [at(3, 4), at(4, 4), at(4, 3), at(8, 8), at(4, 5), at(8, 7), at(5, 4)])
      fireEvent.click(point(p));
    expect(point(at(4, 4)).getAttribute('aria-label')).toBe('E5, empty');
    expect(screen.getByTestId('status-info').textContent).toBe(
      'Captures — Black 1 · White 0 · komi 7.5',
    );
    fireEvent.click(screen.getByTestId('pass'));
    expect(screen.getByTestId('status-info').textContent).toContain('the opponent passed');
    fireEvent.click(screen.getByTestId('pass'));
    expect(screen.getByTestId('mnk-status').textContent).toContain('Area count');
    expect(document.querySelectorAll('[class*="terr"]').length).toBeGreaterThan(0);
  });
});
