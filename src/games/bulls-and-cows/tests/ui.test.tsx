// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';
import { VARIANTS, contradiction, makeGuess, newBulls, spaceFor } from '../engine';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const settle = async (ms: number) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
};

const typeCode = (code: number[]) => {
  for (const d of code) fireEvent.click(screen.getByTestId(`bc-key-${d}`));
};

describe('Bulls and Cows UI', () => {
  it('types guesses, keeps notes, warns on contradictions and cracks the number with hints', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { deal: '17' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('bc-solo'));
    await settle(10);
    const secret = newBulls('four', 'solo', 17).secrets[0]!;
    const first = [0, 1, 2, 3].join() === secret.join() ? [3, 2, 1, 0] : [0, 1, 2, 3];
    typeCode(first);
    expect(screen.getByTestId('bc-key-5')).toHaveProperty('disabled', true);
    fireEvent.click(screen.getByTestId('bc-enter'));
    expect(screen.getByTestId('bc-you-row-0').getAttribute('aria-label')).toMatch(/^Guess 1: /);
    fireEvent.click(screen.getByTestId('bc-note-9'));
    expect(screen.getByTestId('bc-note-9').getAttribute('data-note')).toBe('1');
    expect(screen.getByTestId('bc-key-9').getAttribute('data-note')).toBe('1');
    const scored = makeGuess(newBulls('four', 'solo', 17), first).guesses[0]!;
    const space = spaceFor(VARIANTS.four!);
    let bad = space.code(0);
    for (let i = 0; i < space.count && !contradiction(scored, bad); i++) bad = space.code(i);
    typeCode(bad);
    expect(screen.getByTestId('bc-message').textContent).toMatch(/cannot be the number/);
    for (let i = 0; i < 4; i++) fireEvent.click(screen.getByTestId('bc-back'));
    for (let i = 0; i < 12 && !screen.queryByTestId('bc-again'); i++) {
      fireEvent.click(screen.getByTestId('bc-hint'));
      fireEvent.click(screen.getByTestId('bc-apply'));
      fireEvent.click(screen.getByTestId('bc-enter'));
    }
    expect(screen.getByTestId('bc-message').textContent).toMatch(/^Cracked in/);
    expect(calls.results).toEqual([
      expect.objectContaining({ outcome: 'complete', mode: 'solo-four' }),
    ]);
  });

  it('plays a duel: the player picks a number and the computer answers each guess', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { deal: '5' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('bc-level-easy'));
    fireEvent.click(screen.getByTestId('bc-duel'));
    typeCode([9, 8, 7, 6]);
    fireEvent.click(screen.getByTestId('bc-pick-go'));
    expect(screen.getByTestId('bc-mine').textContent).toBe('9876');
    const target = newBulls('four', 'duel', 5).secrets[0]!;
    typeCode(target);
    fireEvent.click(screen.getByTestId('bc-enter'));
    expect(screen.getByTestId('bc-message').textContent).toMatch(/one last guess/);
    await settle(900);
    expect(screen.getByTestId('bc-ai-row-0')).toBeTruthy();
    expect(screen.getByTestId('bc-message').textContent).toMatch(/You win|draw/);
    expect(calls.results[0]?.outcome).toMatch(/win|draw/);
  });
});
