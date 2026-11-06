// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const counters = (h: number) => document.querySelectorAll(`[data-counter^="${h}-"]`);

afterEach(cleanup);

describe('Misère Nim UI', () => {
  it('marks counters to take, confirms, and passes the turn', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    const n = counters(0).length;
    expect(n).toBeGreaterThan(0);
    const first = counters(0)[0] as HTMLButtonElement;
    expect(first.getAttribute('aria-label')).toBe(`Heap A, counter 1: take ${n}`);
    fireEvent.click(counters(0)[n - 1]!);
    expect(screen.getByTestId('take').textContent).toBe('Take 1 from A');
    fireEvent.click(counters(0)[n - 1]!); // a second tap confirms
    expect(counters(0)).toHaveLength(n - 1);
    expect(screen.queryByTestId('take')).toBeNull();
    expect(screen.getByTestId('status-info').textContent).toBe(
      'Leave the last counter to your opponent',
    );
  });
});
