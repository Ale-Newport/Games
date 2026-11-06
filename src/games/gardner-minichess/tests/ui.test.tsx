// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const square = (name: string) =>
  document.querySelector(`[data-square="${name}"]`) as HTMLButtonElement;

afterEach(cleanup);

describe('Gardner minichess UI', () => {
  it('renders 25 squares a1–e5 and plays a knight move', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    expect(document.querySelectorAll('[data-square]')).toHaveLength(25);
    expect(square('e5').getAttribute('aria-label')).toBe('e5, black king');
    expect(square('f1')).toBeNull();
    fireEvent.click(square('a2'));
    expect(square('a4')?.getAttribute('aria-label')).not.toContain('move here'); // no double step
    fireEvent.click(square('b1'));
    fireEvent.click(square('c3'));
    expect(square('c3').getAttribute('aria-label')).toBe('c3, white knight');
    expect(screen.getByTestId('move-list').textContent).toBe('1.Nc3');
  });
});
