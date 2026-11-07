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

describe('Crazy Eights UI', () => {
  it('plays a card (or draws) and lets the opponent answer', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { deal: '2' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('eights-opponents-2'));
    fireEvent.click(screen.getByTestId('eights-start'));
    expect(screen.getByTestId('eights-opponent-2')).toBeTruthy();
    fireEvent.click(screen.getByTestId('eights-hint'));
    expect(screen.getByTestId('eights-hint-text').textContent).toMatch(/^Hard would/);
    const playable = [
      ...screen.getByTestId('eights-hand').querySelectorAll('button:not([disabled])'),
    ];
    if (playable.length) {
      fireEvent.click(playable[0]!);
      const suits = screen.queryByTestId('eights-suits');
      if (suits) fireEvent.click(screen.getByTestId('eights-suit-0'));
      expect(screen.getByTestId('eights-hand').querySelectorAll('button')).toHaveLength(4);
    } else {
      fireEvent.click(screen.getByTestId('eights-draw'));
      expect(screen.getByTestId('eights-hand').querySelectorAll('button')).toHaveLength(6);
    }
    for (let k = 0; k < 3; k++) await settle(1000);
    expect(calls.saves.length).toBeGreaterThan(0);
  });
});
