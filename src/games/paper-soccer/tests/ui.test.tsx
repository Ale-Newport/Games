// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const kick = (d: number) => document.querySelector(`[data-dir="${d}"]`) as SVGElement;

afterEach(cleanup);

describe('Paper Soccer UI', () => {
  it('kicks toward a dot and bounces off a used one', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    expect(document.querySelectorAll('[data-dir]')).toHaveLength(8);
    expect(screen.getByTestId('mnk-status').textContent).toContain('Orange attacks the top goal');
    fireEvent.click(kick(0));
    expect(screen.getByTestId('mnk-status').textContent).toContain('Teal attacks the bottom goal');
    expect(kick(4)).toBeNull(); // the line just drawn
    fireEvent.click(kick(2));
    fireEvent.click(kick(5)); // back onto the center point
    expect(screen.getByTestId('mnk-status').textContent).toContain('Bounce! Orange moves again');
  });
});
