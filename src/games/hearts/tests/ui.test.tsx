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

describe('Hearts UI', () => {
  it('passes three cards with the hint, then plays legal cards', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { deal: '3' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('hearts-difficulty-easy'));
    fireEvent.click(screen.getByTestId('hearts-start'));
    expect(screen.getByTestId('hearts-status').textContent).toBe(
      'Pick three cards to pass to the left',
    );
    expect(screen.getByTestId('hearts-pass')).toHaveProperty('disabled', true);
    fireEvent.click(screen.getByTestId('hearts-hint'));
    expect(screen.getByTestId('hearts-hint-text').textContent).toMatch(/^A good pass: /);
    expect(screen.getByTestId('hearts-pass').textContent).toContain('3/3');
    fireEvent.keyDown(window, { key: 'p' });
    await settle(1000);
    // Play whatever is legal until the first trick is done.
    for (let k = 0; k < 20 && screen.getByTestId('hearts').textContent!.includes('Hand 1'); k++) {
      const playable = [
        ...screen.getByTestId('trick-hand').querySelectorAll('button:not([disabled])'),
      ];
      if (playable.length) fireEvent.click(playable[0]!);
      await settle(1500);
      if (screen.getByTestId('trick-hand').querySelectorAll('button').length <= 11) break;
    }
    expect(screen.getByTestId('trick-hand').querySelectorAll('button').length).toBeLessThan(13);
    expect(calls.saves.length).toBeGreaterThan(0);
  });

  it('watches four AI players', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { mode: 'watch', deal: '1' } });
    render(<Game services={services} />);
    await settle(0);
    await settle(6000);
    expect(
      screen.getByTestId('trick-seat-1').querySelectorAll('[role="img"]').length,
    ).toBeGreaterThan(0);
    expect(calls.results).toHaveLength(0);
  });
});
