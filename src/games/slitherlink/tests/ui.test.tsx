// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const settle = async (ms: number) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
};

describe('Slitherlink UI', () => {
  it('explains hints, undoes, and records a solve', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { deal: '7' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('slither-start'));
    await settle(50);
    fireEvent.click(screen.getByTestId('slither-hint'));
    expect(screen.getByTestId('slither-message').textContent!.length).toBeGreaterThan(10);
    fireEvent.click(screen.getByTestId('slither-fill'));
    expect(
      screen.getByTestId('slither-board').querySelectorAll('[data-value="1"], [data-value="2"]')
        .length,
    ).toBeGreaterThan(0);
    fireEvent.click(screen.getByTestId('slither-undo'));
    expect(
      screen.getByTestId('slither-board').querySelectorAll('[data-value="1"], [data-value="2"]')
        .length,
    ).toBe(0);
    for (let i = 0; i < 200 && !screen.queryByTestId('slither-again'); i++) {
      fireEvent.click(screen.getByTestId('slither-hint'));
      fireEvent.click(screen.getByTestId('slither-fill'));
    }
    expect(screen.getByTestId('slither-message').textContent).toMatch(/^Solved in/);
    expect(calls.results).toEqual([expect.objectContaining({ outcome: 'complete', mode: 'easy' })]);
  });

  it('switches the tap mode', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { deal: '3' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('slither-start'));
    await settle(50);
    fireEvent.click(screen.getByTestId('slither-tap-cross'));
    expect(screen.getByTestId('slither-tap-cross').getAttribute('aria-pressed')).toBe('true');
  });
});
