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

describe('Leduc poker UI', () => {
  it('plays to the public card and shows the coach', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { deal: '1' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('hu-difficulty-easy'));
    fireEvent.click(screen.getByTestId('hu-start'));
    expect(screen.getByTestId('hu-board').textContent).toBe('');
    // Check or call until the public card appears (or the hand ends).
    const board = () => screen.getByTestId('hu-board').querySelector('[role="img"]');
    for (let k = 0; k < 6 && !board(); k++) {
      const button = screen.queryByTestId('hu-check') ?? screen.queryByTestId('hu-call');
      if (button) fireEvent.click(button);
      await settle(1000);
    }
    expect(screen.getByTestId('hu-board').querySelector('[role="img"]')).not.toBeNull();
    fireEvent.click(screen.getByTestId('hu-coach'));
    const anyButton = screen.queryByTestId('hu-check') ?? screen.queryByTestId('hu-call');
    if (anyButton) expect(anyButton.textContent).toMatch(/\d+%/);
  });
});
