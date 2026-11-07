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

describe('Merge to 2048 UI', () => {
  it('slides by keys, undoes once and follows a hint', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices();
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('mg-start'));
    await settle(10);
    const tiles = () =>
      [...screen.getByTestId('mg-board').querySelectorAll('[role=gridcell]')]
        .map((e) => e.getAttribute('data-value') ?? '.')
        .join();
    expect(screen.getByTestId('mg-board').querySelectorAll('[data-value]')).toHaveLength(2);
    const before = tiles();
    for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']) {
      fireEvent.keyDown(window, { key });
      if (tiles() !== before) break;
    }
    expect(tiles()).not.toBe(before);
    expect(
      screen.getByTestId('mg-board').querySelectorAll('[data-value]').length,
    ).toBeGreaterThanOrEqual(2);
    fireEvent.click(screen.getByTestId('mg-undo'));
    expect(tiles()).toBe(before);
    expect(screen.getByTestId('mg-undo')).toHaveProperty('disabled', true);
    fireEvent.click(screen.getByTestId('mg-hint'));
    expect(screen.getByTestId('mg-message').textContent).toMatch(/suggests sliding/);
    fireEvent.click(screen.getByTestId('mg-apply'));
    expect(tiles()).not.toBe(before);
  });

  it('watch mode plays on its own', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { mode: 'watch' } });
    render(<Game services={services} />);
    await settle(10);
    const before = screen.getByTestId('mg-board').textContent;
    await settle(1200);
    expect(screen.getByTestId('mg-board').textContent).not.toBe(before);
  });
});
