// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const column = (c: number) => document.querySelector(`[data-column="${c}"]`) as HTMLButtonElement;
const status = () => screen.getByTestId('mnk-status').textContent ?? '';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('Four in a Row UI', () => {
  it('drops discs by column and detects a vertical win', async () => {
    const { services, calls } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    expect(document.querySelectorAll('[data-column]')).toHaveLength(7);
    for (const c of [0, 1, 0, 1, 0, 1]) fireEvent.click(column(c));
    expect(column(0).getAttribute('aria-label')).toBe('Column 1, 3 free');
    fireEvent.click(column(0));
    expect(status()).toContain('Tester wins!');
    expect(calls.results).toEqual([{ outcome: 'complete', mode: 'local' }]);
  });

  it('supports ←/→ + Enter and digit keys', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    fireEvent.keyDown(document.body, { key: 'Enter' }); // column 3 (index 2)
    expect(column(2).getAttribute('aria-label')).toBe('Column 3, 5 free');
    fireEvent.keyDown(window, { key: '7' });
    expect(column(6).getAttribute('aria-label')).toBe('Column 7, 5 free');
    fireEvent.keyDown(window, { key: 'u' });
    expect(column(6).getAttribute('aria-label')).toBe('Column 7, 6 free');
  });

  it('the CPU replies after the human drops', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('difficulty-easy'));
    fireEvent.click(screen.getByTestId('start-match'));
    fireEvent.click(column(3));
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    const free = [...document.querySelectorAll('[data-column]')].reduce(
      (n, el) => n + Number(/(\d+) free/.exec(el.getAttribute('aria-label') ?? '')?.[1] ?? 0),
      0,
    );
    expect(free).toBe(40);
    expect(status()).toContain('Your turn');
  });
});
