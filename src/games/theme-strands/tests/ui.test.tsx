// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { puzzleById } from '../engine';
import { Game } from '../Game';

afterEach(() => cleanup());

describe('Theme Strands UI', () => {
  it('traces theme words by tapping and finishes a puzzle', async () => {
    const { services, calls } = createTestServices();
    render(<Game services={services} />);
    await screen.findByTestId('ts-menu');
    fireEvent.click(screen.getByTestId('ts-lang-en'));
    fireEvent.click(screen.getByTestId('ts-pick-en-cats'));
    await new Promise((r) => setTimeout(r, 300)); // dictionary
    const p = puzzleById('en-cats');
    const words = [p.spangram, ...p.words];
    for (const w of words) {
      const path = p.paths[w]!;
      for (const c of path) fireEvent.pointerDown(screen.getByTestId(`ts-cell-${c}`));
      fireEvent.pointerDown(screen.getByTestId(`ts-cell-${path.at(-1)}`));
      fireEvent.pointerUp(window);
    }
    expect(screen.getByTestId('ts-result')).toBeTruthy();
    expect(calls.achievements).toEqual(
      expect.arrayContaining(['first-solve', 'no-hints', 'spangram-first']),
    );
  });
});
