// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const square = (name: string) =>
  document.querySelector(`[data-square="${name}"]`) as HTMLButtonElement;

afterEach(cleanup);

describe('Animal shogi UI', () => {
  it('captures the facing chick and drops it back', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    expect(document.querySelectorAll('[data-square]')).toHaveLength(12);
    expect(square('2d').getAttribute('aria-label')).toBe('2d, Sente lion');
    fireEvent.click(square('2c'));
    fireEvent.click(square('2b'));
    expect(screen.getByTestId('hand-0-C').getAttribute('aria-label')).toBe('Sente chick × 1');
    fireEvent.click(square('2a'));
    fireEvent.click(square('2b'));
    expect(screen.getByTestId('hand-1-C')).toBeTruthy();
    fireEvent.click(screen.getByTestId('hand-0-C'));
    fireEvent.click(square('2c'));
    expect(screen.getByTestId('move-list').textContent).toBe('1.☗Cx2b2.☖Lx2b3.☗C*2c');
  });
});
