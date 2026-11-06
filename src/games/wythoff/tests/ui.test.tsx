// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const counters = (h: number) => document.querySelectorAll(`[data-counter^="${h}-"]`);

afterEach(cleanup);

describe("Wythoff's Game UI", () => {
  it('takes the same amount from both heaps with the toggle on', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    const [a, b] = [counters(0).length, counters(1).length];
    expect(Math.min(a, b)).toBeGreaterThanOrEqual(4);
    fireEvent.click(screen.getByTestId('both'));
    fireEvent.click(counters(0)[a - 2]!);
    expect(screen.getByTestId('take').textContent).toBe('Take 2 from both');
    // Both heaps show the marked counters.
    expect(document.querySelectorAll('[data-counter^="1-"][class*="chosen"]')).toHaveLength(2);
    fireEvent.click(screen.getByTestId('take'));
    expect([counters(0).length, counters(1).length]).toEqual([a - 2, b - 2]);
    expect((screen.getByTestId('both') as HTMLInputElement).checked).toBe(false);
  });
});
