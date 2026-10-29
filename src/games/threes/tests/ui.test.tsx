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

describe('Number Trios UI', () => {
  it('shows the next tile, shifts by keys, undoes once and follows a hint', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices();
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('tr-start'));
    await settle(10);
    const tiles = () =>
      [...screen.getByTestId('tr-board').querySelectorAll('[data-value]')].map((e) =>
        e.getAttribute('data-value'),
      );
    expect(tiles()).toHaveLength(9);
    expect(screen.getByTestId('tr-next').textContent).toMatch(/Next[123]/);
    const before = tiles().join();
    for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']) {
      fireEvent.keyDown(window, { key });
      if (tiles().join() !== before) break;
    }
    expect(tiles().join()).not.toBe(before);
    fireEvent.click(screen.getByTestId('tr-undo'));
    expect(tiles().join()).toBe(before);
    expect(screen.getByTestId('tr-undo')).toHaveProperty('disabled', true);
    fireEvent.click(screen.getByTestId('tr-hint'));
    expect(screen.getByTestId('tr-message').textContent).toMatch(/suggests shifting/);
    fireEvent.click(screen.getByTestId('tr-apply'));
    expect(tiles().join()).not.toBe(before);
  });

  it('watch mode plays on its own', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { mode: 'watch' } });
    render(<Game services={services} />);
    await settle(10);
    const before = screen.getByTestId('tr-board').textContent;
    await settle(1200);
    expect(screen.getByTestId('tr-board').textContent).not.toBe(before);
  });
});
