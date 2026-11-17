// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { puzzleById } from '../engine';
import { Game } from '../Game';

afterEach(() => cleanup());

describe('Word Groups UI', () => {
  it('solves groups, reports one away, and finishes with a share grid', async () => {
    const { services, calls } = createTestServices();
    render(<Game services={services} />);
    await screen.findByTestId('wg2-menu');
    fireEvent.click(screen.getByTestId('wg2-lang-en'));
    fireEvent.click(screen.getByTestId('wg2-pick-en-1'));
    const p = puzzleById('en-1');
    const pick = (words: readonly string[]) => {
      for (const w of words) fireEvent.click(screen.getByTestId(`wg2-tile-${w}`));
      fireEvent.click(screen.getByTestId('wg2-submit'));
    };
    pick(['BANANA', 'GRAPE', 'LEMON', 'APPLE']);
    expect(screen.getByTestId('wg2-toast').textContent).toBe('One away…');
    expect(screen.getByTestId('wg2-mistakes').querySelectorAll('span')).toHaveLength(3);
    fireEvent.click(screen.getByTestId('wg2-deselect'));
    for (const g of [3, 0, 1, 2]) pick(p.groups[g]!.words);
    expect(screen.getByTestId('wg2-result').getAttribute('data-status')).toBe('won');
    expect(screen.getByTestId('wg2-bar-3')).toBeTruthy();
    expect(calls.results[0]).toMatchObject({ outcome: 'win', score: 3 });
    expect(calls.achievements).toEqual(expect.arrayContaining(['first-solve', 'purple-first']));
  });
});
