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

describe('Draw Dominoes UI', () => {
  it('plays hands against the easy computer, following hints, until a hand ends', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { deal: '6' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('dd-level-easy'));
    fireEvent.click(screen.getByTestId('dd-start'));
    await settle(10);
    let played = 0;
    for (
      let i = 0;
      i < 400 && !screen.queryByTestId('dd-next') && !screen.queryByTestId('dd-again');
      i++
    ) {
      if (screen.queryByTestId('dd-hint')) {
        fireEvent.click(screen.getByTestId('dd-hint'));
        const msg = screen.getByTestId('dd-message').textContent!;
        expect(msg).toMatch(/Suggested: (play \d–\d|draw|pass)/);
        const draw = screen.queryByTestId('dd-draw');
        const pass = screen.queryByTestId('dd-pass');
        if (draw) fireEvent.click(draw);
        else if (pass) fireEvent.click(pass);
        else {
          // A hinted tile that fits more than one end is selected already and asks for the end.
          if (!document.querySelector('[data-testid^="dd-arm-"]')) {
            const lit = [...document.querySelectorAll<HTMLButtonElement>('[data-playable="true"]')];
            fireEvent.click(
              lit.find((b) => msg.includes(b.getAttribute('aria-label')!)) ?? lit[0]!,
            );
          }
          const end = document.querySelector<HTMLButtonElement>('[data-testid^="dd-arm-"]');
          if (end) fireEvent.click(end);
          played++;
        }
      }
      await settle(900);
    }
    expect(played).toBeGreaterThan(0);
    expect(screen.getByTestId('dd-reveal')).toBeTruthy();
    expect(screen.getByTestId('dd-message').textContent).toMatch(/plays out|Blocked|wins the game/);
  });

  it('watch mode plays a computer game', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { mode: 'watch', deal: '2' } });
    render(<Game services={services} />);
    for (let i = 0; i < 8; i++) await settle(800);
    expect(screen.getByTestId('dd-layout').querySelectorAll('svg').length).toBeGreaterThan(1);
  });
});
