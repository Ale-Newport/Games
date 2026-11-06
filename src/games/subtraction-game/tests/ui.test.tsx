// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const counters = () => [...document.querySelectorAll('[data-counter^="0-"]')];

afterEach(cleanup);

describe('Subtraction Game UI', () => {
  it('only the last three counters can be chosen', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    const n = counters().length;
    expect(n).toBeGreaterThanOrEqual(15);
    const enabled = counters().filter((c) => c.getAttribute('aria-disabled') === 'false');
    expect(enabled).toHaveLength(3);
    fireEvent.click(counters()[0]!); // taking everything is not allowed
    expect(screen.queryByTestId('take')).toBeNull();
    fireEvent.click(counters()[n - 3]!);
    expect(screen.getByTestId('take').textContent).toBe('Take 3 from A');
    fireEvent.click(screen.getByTestId('take'));
    expect(counters()).toHaveLength(n - 3);
    expect(screen.getByTestId('status-info').textContent).toBe(
      'Take 1, 2 or 3 — the last counter wins',
    );
  });
});
