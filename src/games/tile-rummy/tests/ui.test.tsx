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

describe('Tile Rummy UI', () => {
  it('moves a tile by hand and back, then plays by hints to the end', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { deal: '2' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('tr-level-easy'));
    fireEvent.click(screen.getByTestId('tr-start'));
    // A rack tile to a new set: an invalid one-tile set, then back to the rack.
    const first = document.querySelector<HTMLButtonElement>('[data-testid^="tr-rack-"]')!;
    const id = first.dataset.testid!.slice(8);
    fireEvent.click(first);
    fireEvent.click(screen.getByTestId('tr-new-set'));
    expect(screen.getByTestId(`tr-tile-${id}`)).toBeTruthy();
    expect(screen.getByTestId('tr-play')).toHaveProperty('disabled', true);
    fireEvent.click(screen.getByTestId(`tr-tile-${id}`));
    fireEvent.click(screen.getByTestId('tr-rack'));
    expect(screen.getByTestId(`tr-rack-${id}`)).toBeTruthy();
    let plays = 0;
    for (let i = 0; i < 3000 && !screen.queryByTestId('tr-again'); i++) {
      if (screen.queryByTestId('tr-hint')) {
        fireEvent.click(screen.getByTestId('tr-hint'));
        const play = screen.getByTestId('tr-play') as HTMLButtonElement;
        if (!play.disabled) {
          fireEvent.click(play);
          plays++;
        } else fireEvent.click(screen.getByTestId('tr-draw'));
      }
      await settle(1000);
    }
    expect(plays).toBeGreaterThan(0);
    expect(screen.getByTestId('tr-message').textContent).toMatch(/wins?|win with/);
    expect(calls.results).toHaveLength(1);
  });
});
