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

describe('Five Dice UI', () => {
  it('rolls, holds a die, takes a hint and scores a box in a solo game', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { deal: '5' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('fd-count-1'));
    fireEvent.click(screen.getByTestId('fd-start'));
    await settle(10);
    fireEvent.click(screen.getByTestId('fd-roll'));
    const first = screen.getByTestId('fd-die-0').getAttribute('aria-label');
    fireEvent.click(screen.getByTestId('fd-die-0'));
    expect(screen.getByTestId('fd-die-0').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByTestId('fd-roll'));
    // The held die keeps its value through the second roll.
    expect(screen.getByTestId('fd-die-0').getAttribute('aria-label')).toBe(`${first}, held`);
    fireEvent.click(screen.getByTestId('fd-hint'));
    expect(screen.getByTestId('fd-message').textContent).toMatch(/Suggested/);
    fireEvent.click(screen.getByTestId('fd-box-chance'));
    expect(screen.getByTestId('fd-message').textContent).toMatch(/You score \d+ in Chance/);
  });

  it('a computer player takes its turns', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { mode: 'watch', deal: '2' } });
    render(<Game services={services} />);
    await settle(10);
    for (let i = 0; i < 20; i++) await settle(1000);
    expect(Number(screen.getByTestId('fd-total-0').textContent)).toBeGreaterThan(0);
  });
});
