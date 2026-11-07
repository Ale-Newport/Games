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

describe('Mahjong solitaire UI', () => {
  it('clears pairs by following hints, refuses blocked tiles, undoes and shuffles', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { deal: '4' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('mj-start'));
    const left = () => Number(screen.getByTestId('mj-left').textContent!.replace(/\D+/g, ''));
    expect(left()).toBe(84);
    // A blocked tile refuses.
    const blocked = document.querySelector<HTMLButtonElement>(
      '[data-testid^="mj-tile-"]:not([data-free])',
    )!;
    fireEvent.click(blocked);
    expect(screen.getByTestId('mj-message').textContent).toMatch(/not free/);
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByTestId('mj-hint'));
      expect(screen.getByTestId('mj-message').textContent).toMatch(
        /Suggested: the two highlighted tiles/,
      );
      const marked = [
        ...document.querySelectorAll<HTMLButtonElement>('[data-testid^="mj-tile-"]'),
      ].filter((b) => b.className.includes('hinted'));
      expect(marked).toHaveLength(2);
      fireEvent.click(marked[0]!);
      fireEvent.click(marked[1]!);
      expect(left()).toBe(84 - 2 * (i + 1));
    }
    fireEvent.click(screen.getByTestId('mj-undo'));
    expect(left()).toBe(80);
    fireEvent.click(screen.getByTestId('mj-shuffle'));
    expect(screen.getByTestId('mj-shuffle').textContent).toMatch(/\(2\)/);
    expect(left()).toBe(80);
  });

  it('watch mode clears tiles by itself', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { mode: 'watch', deal: '2' } });
    render(<Game services={services} />);
    for (let i = 0; i < 6; i++) await settle(600);
    expect(Number(screen.getByTestId('mj-left').textContent!.replace(/\D+/g, ''))).toBeLessThan(84);
  });
});
