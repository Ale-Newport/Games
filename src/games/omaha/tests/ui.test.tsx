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

describe('Omaha UI', () => {
  it('starts a heads-up tournament, folds, deals the next hand and offers to resume', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { deal: '5' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('poker-opponents-1'));
    fireEvent.click(screen.getByTestId('poker-difficulty-easy'));
    fireEvent.click(screen.getByTestId('poker-start'));
    // Heads-up the player is on the button and acts first.
    expect(screen.getByTestId('poker-status').textContent).toBe('Your turn — 10 to call');
    expect(screen.getAllByRole('img', { name: /of/ }).length).toBe(4);
    fireEvent.click(screen.getByTestId('poker-hint'));
    expect(screen.getByTestId('poker-coach').textContent).toMatch(/Your chances ≈ \d+% against 1/);
    fireEvent.click(screen.getByTestId('poker-fold'));
    expect(screen.getByTestId('poker-status').textContent).toBe(
      'Ada wins 30 — everyone else folded.',
    );
    expect(screen.getByTestId('poker-stack-0').textContent).toBe('1490');
    fireEvent.keyDown(window, { key: 'n' });
    expect(screen.getByTestId('poker-hand').textContent).toBe('2');
    // Ada is on the button now and acts first.
    await settle(1000);
    expect(calls.saves.length).toBeGreaterThan(0);
    fireEvent.click(screen.getByTestId('poker-menu-button'));
    expect(screen.getByTestId('poker-resume').textContent).toContain('Hand 2');
  });

  it('caps the raise presets at the pot', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { deal: '8' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('poker-opponents-1'));
    fireEvent.click(screen.getByTestId('poker-start'));
    expect(screen.getByTestId('poker-raise').textContent).toBe('Raise to 40');
    // Pot-limit: no all-in preset, the pot is the largest raise.
    expect(screen.queryByRole('button', { name: 'All-in' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Pot' }));
    expect(screen.getByTestId('poker-raise').textContent).toBe('Raise to 60');
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByTestId('poker-raise').textContent).toBe('Raise to 60');
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByTestId('poker-raise').textContent).toBe('Raise to 40');
    fireEvent.keyDown(window, { key: 'a' });
    expect(screen.getByTestId('poker-seat-0').textContent).toContain('Raise');
    expect(screen.getByTestId('poker-stack-0').textContent).toBe('1440');
    // Ada calls (this deal) and the flop comes.
    await settle(1000);
    expect(screen.getByTestId('poker-stack-1').textContent).toBe('1440');
    expect(screen.getAllByRole('img', { name: /of/ }).length).toBe(4 + 3);
  });

  it('watches six AI players', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { mode: 'watch', deal: '3' } });
    render(<Game services={services} />);
    await settle(0);
    expect(screen.getByTestId('poker-seat-5')).toBeTruthy();
    expect(screen.queryByRole('img', { name: 'face-down card' })).toBeNull();
    await settle(6000);
    expect(screen.getByTestId('poker-status').textContent).not.toBe('');
    expect(calls.results).toHaveLength(0);
  });
});
