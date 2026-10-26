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

describe('Go Fish UI', () => {
  it('asks an opponent for a rank and logs the answer', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { deal: '3' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('fish-opponents-2'));
    fireEvent.click(screen.getByTestId('fish-start'));
    expect(screen.getByTestId('fish-opponent-2')).toBeTruthy();
    fireEvent.click(screen.getByTestId('fish-hint'));
    expect(screen.getByTestId('fish-hint-text').textContent).toMatch(/^Hard would ask/);
    const card = screen.getByTestId('fish-hand').querySelector('button')!;
    fireEvent.click(card);
    expect(screen.getByTestId('fish-status').textContent).toMatch(/^Ask whom for/);
    fireEvent.click(screen.getByTestId('fish-ask-1'));
    expect(screen.getByTestId('fish-log').textContent).toMatch(/^You ask Ada for/);
    for (let k = 0; k < 6; k++) await settle(1000);
    expect(calls.saves.length).toBeGreaterThan(0);
  });

  it('asks right away with a single opponent', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { deal: '4' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('fish-start'));
    fireEvent.click(screen.getByTestId('fish-hand').querySelector('button')!);
    expect(screen.getByTestId('fish-log').textContent).toMatch(/You ask Ada for/);
  });
});
