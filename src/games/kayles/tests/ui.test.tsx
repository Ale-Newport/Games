// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const pin = (i: number) => document.querySelector(`[data-pin="${i}"]`) as HTMLButtonElement;

afterEach(cleanup);

describe('Kayles UI', () => {
  it('picks one pin, extends to a neighbor, and knocks both down', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    expect(document.querySelectorAll('[data-pin]').length).toBeGreaterThanOrEqual(10);
    fireEvent.click(pin(3));
    expect(screen.getByTestId('knock').textContent).toBe('Knock down 1 pin');
    fireEvent.click(pin(4));
    expect(screen.getByTestId('knock').textContent).toBe('Knock down 2 pins');
    fireEvent.click(pin(4)); // tapping a chosen pin confirms
    expect(pin(3).getAttribute('aria-label')).toBe('Pin 4, down');
    expect(pin(4).getAttribute('aria-label')).toBe('Pin 5, down');
    // The pins across the gap are not neighbors any more.
    fireEvent.click(pin(2));
    fireEvent.click(pin(5));
    expect(screen.getByTestId('knock').textContent).toBe('Knock down 1 pin');
  });
});
