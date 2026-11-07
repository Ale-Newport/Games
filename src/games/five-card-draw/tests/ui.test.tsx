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

describe('Five Card Draw UI', () => {
  it('bets, picks cards to throw away and draws', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { deal: '4' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('poker-opponents-1'));
    fireEvent.click(screen.getByTestId('poker-difficulty-easy'));
    fireEvent.click(screen.getByTestId('poker-start'));
    expect(screen.getByTestId('poker-phase').textContent).toBe('Before the draw');
    expect(screen.queryByTestId('poker-slider')).toBeNull();
    // Call or check until it is the player's draw.
    for (let k = 0; k < 10 && !screen.queryByTestId('poker-draw'); k++) {
      const call = screen.queryByTestId('poker-call');
      if (call) fireEvent.click(call);
      await settle(1000);
    }
    expect(screen.getByTestId('poker-status').textContent).toContain('pick up to 3 cards');
    expect(screen.getByTestId('poker-draw').textContent).toBe('Stand pat');
    fireEvent.click(screen.getByTestId('poker-card-0'));
    fireEvent.keyDown(window, { key: '2' });
    expect(screen.getByTestId('poker-card-0').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('poker-draw').textContent).toBe('Draw 2');
    fireEvent.keyDown(window, { key: 'h' });
    expect(screen.getByTestId('poker-coach').textContent).toMatch(/A Medium player would/);
    fireEvent.click(screen.getByTestId('poker-draw'));
    expect(screen.getByTestId('poker-drew-0').textContent).toBe('drew 2');
  });
});
