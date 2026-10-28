// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';
import { newCodeBreaker } from '../engine';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const settle = async (ms: number) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
};

describe('Code Breaker UI', () => {
  it('composes and checks guesses, warns on contradictions and cracks the code with hints', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { deal: '21' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('cb-start'));
    await settle(10);
    const secret = newCodeBreaker('classic', 21).secret;
    const wrong = secret.map((c) => (c + 1) % 6);
    for (const c of wrong) fireEvent.click(screen.getByTestId(`cb-color-${c}`));
    fireEvent.click(screen.getByTestId('cb-check'));
    expect(
      screen.getByTestId('cb-row-0').querySelector('[data-exact]')?.getAttribute('data-exact'),
    ).toBe('0');
    // The same guess again contradicts its own score unless it scored 0/0... it scored 0 exact, so
    // repeating it is consistent only if near was 0 too; a full row of the first color is checked.
    for (const c of wrong) fireEvent.click(screen.getByTestId(`cb-color-${c}`));
    expect(screen.getByTestId('cb-message').textContent).toMatch(/cannot be the code/);
    fireEvent.click(screen.getByTestId('cb-clear'));
    expect(screen.getByTestId('cb-check')).toHaveProperty('disabled', true);
    for (let i = 0; i < 8 && !screen.queryByTestId('cb-again'); i++) {
      fireEvent.click(screen.getByTestId('cb-hint'));
      expect(screen.getByTestId('cb-message').textContent).toMatch(/fit|Only one code/);
      fireEvent.click(screen.getByTestId('cb-apply'));
      fireEvent.click(screen.getByTestId('cb-check'));
    }
    expect(screen.getByTestId('cb-message').textContent).toMatch(/^Cracked in/);
    expect(calls.results).toEqual([
      expect.objectContaining({ outcome: 'complete', mode: 'classic' }),
    ]);
  });

  it('lets the AI crack a code the player sets', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices();
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('cb-set'));
    for (const c of [5, 5, 4, 0]) fireEvent.click(screen.getByTestId(`cb-color-${c}`));
    fireEvent.click(screen.getByTestId('cb-set-go'));
    for (let i = 0; i < 7; i++) await settle(900);
    expect(screen.getByTestId('cb-message').textContent).toMatch(
      /cracked the code in [1-5] guesses/,
    );
  });
});
