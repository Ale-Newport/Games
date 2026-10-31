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

describe('Farkle UI', () => {
  it('rolls, follows a hint and sets dice aside in a solo game', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { deal: '4' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('fk-count-1'));
    fireEvent.click(screen.getByTestId('fk-start'));
    await settle(10);
    let acted = 0;
    for (let i = 0; i < 30 && acted < 3; i++) {
      if (screen.queryByTestId('fk-roll')) fireEvent.click(screen.getByTestId('fk-roll'));
      if (screen.queryByTestId('fk-hint')) {
        fireEvent.click(screen.getByTestId('fk-hint'));
        expect(screen.getByTestId('fk-message').textContent).toMatch(/Suggested/);
        const roll = screen.getByTestId('fk-keep-roll') as HTMLButtonElement;
        expect(roll.disabled).toBe(false);
        fireEvent.click(roll);
        acted++;
      }
      await settle(100);
    }
    expect(acted).toBe(3);
  });

  it('watch mode plays two computer players', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { mode: 'watch', deal: '6' } });
    render(<Game services={services} />);
    await settle(10);
    for (let i = 0; i < 40; i++) await settle(1000);
    const scores = [0, 1].map((p) =>
      Number(screen.getByTestId(`fk-score-${p}`).textContent!.split('·')[1]),
    );
    expect(scores.some((s) => s > 0)).toBe(true);
  });
});
