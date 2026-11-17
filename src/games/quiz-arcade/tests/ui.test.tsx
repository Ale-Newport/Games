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

describe('Quiz Arcade UI', () => {
  it('accepts typed answers without Enter, then gives up and reveals the rest', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices();
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('qz-lang-en'));
    fireEvent.click(screen.getByTestId('qz-start-planets'));
    const input = screen.getByTestId('qz-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Mar' } });
    expect(input.value).toBe('Mar');
    fireEvent.change(input, { target: { value: 'Mars' } });
    expect(input.value).toBe('');
    fireEvent.change(input, { target: { value: 'júpiter' } });
    expect(screen.getByTestId('qz-score').textContent).toBe('2/8');
    fireEvent.click(screen.getByTestId('qz-giveup'));
    expect(screen.getByTestId('qz-result').textContent).toContain('2/8');
    expect(calls.results[0]).toMatchObject({ score: 25, mode: 'planets' });
    fireEvent.click(screen.getAllByTestId('qz-menu-btn')[0]!);
    expect(screen.getByTestId('qz-best-planets').textContent).toContain('25');
  });

  it('plays a click quiz and a pick-all quiz', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices();
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('qz-lang-en'));
    fireEvent.click(screen.getByTestId('qz-start-pick-primes'));
    for (const n of [4, 6, 8]) {
      const tile = screen.getAllByRole('button').find((b) => b.textContent === String(n))!;
      fireEvent.click(tile);
    }
    expect(screen.getByTestId('qz-result').getAttribute('data-status')).toBe('gave-up');
  });

  it('times out', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices();
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('qz-start-rainbow'));
    for (let i = 0; i < 50; i++) await settle(1000);
    expect(screen.getByTestId('qz-result').getAttribute('data-status')).toBe('timeout');
  });
});
