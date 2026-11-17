// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { BY_ID } from '../data';
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

/** Read both cards' names to work out the right answer. */
const answer = (): 'higher' | 'lower' => {
  const nameA = screen.getByTestId('hl-a').querySelector('h3')!.textContent;
  const nameB = screen.getByTestId('hl-b-name').textContent;
  const items = [...BY_ID.values()].filter((i) => i.cat === 'mountains');
  const a = items.find((i) => i.en === nameA)!;
  const b = items.find((i) => i.en === nameB)!;
  return b.value >= a.value ? 'higher' : 'lower';
};

describe('Higher or Lower UI', () => {
  it('right guesses score and move the card; a wrong guess ends the run and records it', async () => {
    vi.useFakeTimers({
      toFake: [
        'setTimeout',
        'clearTimeout',
        'requestAnimationFrame',
        'cancelAnimationFrame',
        'performance',
        'Date',
      ],
    });
    const { services, calls } = createTestServices({ launchParams: { deal: '5' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('hl-mode-mountains'));
    fireEvent.click(screen.getByTestId('hl-start'));
    for (let i = 0; i < 3; i++) {
      const before = screen.getByTestId('hl-b-name').textContent;
      fireEvent.click(screen.getByTestId(`hl-${answer()}`));
      await settle(2000);
      expect(screen.getByTestId('hl-a').querySelector('h3')!.textContent).toBe(before);
    }
    expect(screen.getByTestId('hl-score').textContent).toMatch(/3/);
    // The keyboard works too: answer wrong on purpose.
    fireEvent.keyDown(window, { key: answer() === 'higher' ? 'ArrowDown' : 'ArrowUp' });
    await settle(2000);
    expect(screen.getByTestId('hl-final').textContent).toBe('3');
    expect(calls.results.at(-1)).toMatchObject({ score: 3, mode: 'mountains' });
    fireEvent.click(screen.getByTestId('hl-menu-btn'));
    expect(screen.getByTestId('hl-mode-mountains').textContent).toMatch(/Best: 3/);
  });
});
