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

describe('Riichi UI', () => {
  it('plays a hand to its end following hints', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { deal: '3' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('rm-start'));
    let moves = 0;
    for (
      let i = 0;
      i < 3000 && !screen.queryByTestId('rm-next') && !screen.queryByTestId('rm-again');
      i++
    ) {
      if (screen.queryByTestId('rm-hint')) {
        fireEvent.click(screen.getByTestId('rm-hint'));
        const msg = screen.getByTestId('rm-message').textContent!;
        expect(msg).toMatch(/Suggested/);
        const hinted = document.querySelector<HTMLButtonElement>(
          '[data-testid^="rm-tile-"][class*="hinted"]',
        );
        if (/Suggested: riichi/.test(msg)) {
          fireEvent.click(screen.getByTestId('rm-riichi'));
          fireEvent.click(hinted!);
        } else if (hinted) fireEvent.click(hinted);
        else if (/win/.test(msg))
          fireEvent.click(screen.queryByTestId('rm-act-tsumo') ?? screen.getByTestId('rm-act-ron'));
        else if (/pass/.test(msg)) fireEvent.click(screen.getByTestId('rm-act-pass'));
        else
          fireEvent.click(
            document.querySelector<HTMLButtonElement>('.btn-primary[data-testid^="rm-act-"]')!,
          );
        moves++;
      }
      await settle(700);
    }
    expect(moves).toBeGreaterThan(3);
    expect(screen.getByTestId('rm-result')).toBeTruthy();
    expect(screen.getByTestId('rm-message').textContent).toMatch(/wins|win by|wall ran out/);
  });

  it('watch mode plays four computer seats', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { mode: 'watch', deal: '2' } });
    render(<Game services={services} />);
    for (let i = 0; i < 10; i++) await settle(700);
    const discards = [0, 1, 2, 3].map(
      (p) => screen.getByTestId(`rm-discards-${p}`).children.length,
    );
    expect(discards.reduce((a, b) => a + b, 0)).toBeGreaterThan(3);
  });
});
