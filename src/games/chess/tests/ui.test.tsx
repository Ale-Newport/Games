// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const square = (name: string) =>
  document.querySelector(`[data-square="${name}"]`) as HTMLButtonElement;
const play = (from: string, to: string) => {
  fireEvent.click(square(from));
  fireEvent.click(square(to));
};

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

async function startLocal(options: { clock?: string } = {}) {
  const ctx = createTestServices();
  render(<Game services={ctx.services} />);
  await act(async () => {});
  fireEvent.click(screen.getByTestId('mode-local'));
  if (options.clock) fireEvent.click(screen.getByTestId(`clock-${options.clock}`));
  fireEvent.click(screen.getByTestId('start-match'));
  return ctx;
}

describe('Chess UI', () => {
  it('shows legal targets, plays moves, lists them in SAN and announces check', async () => {
    await startLocal();
    fireEvent.click(square('g1'));
    expect(square('f3').getAttribute('aria-label')).toContain('move here');
    expect(square('g3').getAttribute('aria-label')).not.toContain('move here');
    fireEvent.click(square('f3'));
    expect(square('f3').getAttribute('aria-label')).toBe('f3, white knight');
    play('e7', 'e5');
    play('f3', 'e5');
    expect(screen.getByTestId('move-list').textContent).toBe('1.Nf3e52.Nxe5');
    expect(screen.getByTestId('captured-0').textContent).toContain('+1');
    play('d7', 'd6');
    play('e5', 'c4');
    play('a7', 'a6');
    play('c4', 'd6');
    expect(screen.getByTestId('status-info').textContent).toBe('Check!');
    expect(square('e8').getAttribute('aria-label')).toContain('in check');
  });

  it('castles by moving the king two squares or onto its rook', async () => {
    await startLocal();
    for (const [a, b] of [
      ['e2', 'e4'],
      ['e7', 'e5'],
      ['g1', 'f3'],
      ['g8', 'f6'],
      ['f1', 'c4'],
      ['f8', 'c5'],
    ])
      play(a!, b!);
    fireEvent.click(square('e1'));
    expect(square('h1').getAttribute('aria-label')).toContain('move here');
    fireEvent.click(square('h1'));
    expect(square('g1').getAttribute('aria-label')).toBe('g1, white king');
    expect(square('f1').getAttribute('aria-label')).toBe('f1, white rook');
    play('e8', 'g8');
    expect(screen.getByTestId('move-list').textContent).toContain('4.O-OO-O');
  });

  it('asks which piece to promote to', async () => {
    await startLocal();
    // Race the h-pawn up the board: h4 g5 hxg5 h6 gxh6 Nf6 hxg7 Ng8?? — then g7xf8 promotes.
    for (const [a, b] of [
      ['h2', 'h4'],
      ['g7', 'g5'],
      ['h4', 'g5'],
      ['h7', 'h6'],
      ['g5', 'h6'],
      ['g8', 'f6'],
      ['h6', 'h7'],
      ['f6', 'g8'],
    ])
      play(a!, b!);
    play('h7', 'g8');
    expect(screen.getByRole('dialog', { name: 'Promote to' })).toBeTruthy();
    fireEvent.click(screen.getByTestId('promo-n'));
    expect(square('g8').getAttribute('aria-label')).toBe('g8, white knight');
    expect(screen.getByTestId('move-list').textContent).toContain('hxg8=N');
  });

  it('resigns after a confirming second click and records the result', async () => {
    const { calls } = await startLocal();
    play('e2', 'e4');
    fireEvent.click(screen.getByTestId('resign'));
    expect(screen.getByTestId('resign').textContent).toContain('Confirm resign');
    fireEvent.click(screen.getByTestId('resign'));
    expect(screen.getByTestId('adjudication').textContent).toBe('Player 2 resigned');
    expect(screen.getByTestId('score-x').textContent).toBe('1');
    expect(calls.results).toHaveLength(1);
  });

  it('runs the clock for the side to move and flags it at zero', async () => {
    vi.useFakeTimers({
      toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'performance'],
    });
    await startLocal({ clock: '3+2' });
    expect(screen.getByTestId('clock-0').textContent).toBe('3:00');
    await act(async () => {
      vi.advanceTimersByTime(5_000);
    });
    expect(screen.getByTestId('clock-0').textContent).toBe('2:55');
    play('e2', 'e4');
    // 5 s spent, +2 s increment.
    expect(screen.getByTestId('clock-0').textContent).toBe('2:57');
    await act(async () => {
      vi.advanceTimersByTime(181_000);
    });
    expect(screen.getByTestId('adjudication').textContent).toBe('Player 2 ran out of time');
    expect(screen.getByTestId('score-x').textContent).toBe('1');
  });
});
