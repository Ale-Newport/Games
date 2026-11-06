// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { chess960Fen, createChessState, legalActions } from '../../shared/chess/game';
import { defaultSetup, newMatch } from '../../shared/two-player/match';
import { CHESS960_GAME, Game } from '../Game';
import { VARIANT } from '../rules';

const square = (name: string) =>
  document.querySelector(`[data-square="${name}"]`) as HTMLButtonElement;

afterEach(cleanup);

describe('Chess960 UI', () => {
  it('shows the start position number of the shuffled setup', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    const n = Number(/#(\d+)/.exec(screen.getByTestId('status-info').textContent ?? '')![1]);
    const back = chess960Fen(n).split(' ')[0]!.split('/')[7]!;
    const names = {
      K: 'white king',
      Q: 'white queen',
      R: 'white rook',
      B: 'white bishop',
      N: 'white knight',
    };
    [...back].forEach((ch, f) => {
      expect(square(`${'abcdefgh'[f]}1`).getAttribute('aria-label')).toBe(
        `${'abcdefgh'[f]}1, ${names[ch as keyof typeof names]}`,
      );
    });
  });

  it('castles by moving the king onto its rook when that is the only way', async () => {
    // A setup where short castling is legal on move one (king on f1, rook on g1).
    const n = [...Array(960).keys()].find((k) =>
      legalActions(VARIANT, createChessState(VARIANT, k)).includes('O-O'),
    )!;
    expect(n).toBeDefined();
    const cfg = CHESS960_GAME.match;
    const saved = {
      ...newMatch(cfg, { ...defaultSetup(cfg), mode: 'local' }),
      round: createChessState(VARIANT, n),
    };
    const { services } = createTestServices({}, saved);
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('resume-match'));
    const back = chess960Fen(n).split(' ')[0]!.split('/')[7]!;
    const king = `${'abcdefgh'[back.indexOf('K')]}1`;
    const rook = `${'abcdefgh'[back.lastIndexOf('R')]}1`;
    fireEvent.click(square(king));
    expect(square(rook).getAttribute('aria-label')).toContain('move here');
    fireEvent.click(square(rook));
    expect(screen.getByTestId('move-list').textContent).toBe('1.O-O');
    expect(square('g1').getAttribute('aria-label')).toBe('g1, white king');
    expect(square('f1').getAttribute('aria-label')).toBe('f1, white rook');
  });
});
