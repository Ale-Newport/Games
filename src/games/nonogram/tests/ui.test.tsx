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

describe('Nonogram UI', () => {
  it('solves a picture through hints and records it', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices();
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('nono-kind-pictures'));
    fireEvent.click(screen.getByTestId('nono-picture-heart'));
    await settle(50);
    fireEvent.click(screen.getByTestId('nono-hint'));
    expect(screen.getByTestId('nono-message').textContent).toMatch(/^(Row|Column) \d+/);
    for (
      let i = 0;
      i < 80 && !/It is a/.test(screen.getByTestId('nono-message').textContent!);
      i++
    ) {
      fireEvent.click(screen.getByTestId('nono-hint'));
      fireEvent.click(screen.getByTestId('nono-fill'));
    }
    expect(screen.getByTestId('nono-message').textContent).toMatch(/It is a Heart/);
    expect(calls.results).toEqual([
      expect.objectContaining({ outcome: 'complete', mode: 'picture:heart' }),
    ]);
    expect(calls.achievements).toContain('picture');
  });

  it('switches tools and undoes', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { deal: '3' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('nono-difficulty-easy'));
    fireEvent.click(screen.getByTestId('nono-start'));
    await settle(50);
    fireEvent.click(screen.getByTestId('nono-tool-cross'));
    expect(screen.getByTestId('nono-tool-cross').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByTestId('nono-hint'));
    fireEvent.click(screen.getByTestId('nono-fill'));
    expect(
      screen.getByTestId('nono-board').querySelectorAll('[data-value="1"], [data-value="2"]')
        .length,
    ).toBeGreaterThan(0);
    fireEvent.click(screen.getByTestId('nono-undo'));
    expect(
      screen.getByTestId('nono-board').querySelectorAll('[data-value="1"], [data-value="2"]')
        .length,
    ).toBe(0);
  });
});
