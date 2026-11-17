// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { newRun, sheetById } from '../../shared/survey/engine';
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

const answer = (text: string) => {
  fireEvent.change(screen.getByTestId('sv-input'), { target: { value: text } });
  fireEvent.click(screen.getByTestId('sv-go'));
};

describe('Rare Answer Dive UI', () => {
  it('plays a full unlimited dive: preview, misses, typos, timeouts, reveal and review', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { deal: '42' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('sv-lang-en'));
    fireEvent.click(screen.getByTestId('sv-unlimited'));
    const run = newRun({ polarity: 'rare', lang: 'en', kind: 'unlimited', seed: 42 });
    const first = sheetById(run.prompts[0]!);
    expect(screen.getByTestId('sv-question').textContent).toBe(first.q.en);
    expect(screen.getByTestId('sv-input')).toHaveProperty('disabled', true);
    await settle(3100);
    expect(screen.getByTestId('sv-input')).toHaveProperty('disabled', false);
    answer('zzzz qqq');
    expect(screen.getByTestId('sv-feedback').textContent).toMatch(/No echo/);
    const prize = first.entries.find((e) => e.band === 'f')!;
    answer(prize.name.en.slice(0, -1) + prize.name.en.slice(-1).repeat(2)); // typo: doubled last letter
    expect(screen.getByTestId('sv-reveal').textContent).toContain('Abyssal Pearl');
    expect(screen.getByTestId('sv-points').textContent).toBe('+100');
    expect(screen.getByTestId('sv-score').textContent).toBe('1,000 m');
    fireEvent.click(screen.getByTestId('sv-next'));
    // Let the second prompt time out.
    await settle(3100 + 25_200);
    expect(screen.getByTestId('sv-timeout')).toBeTruthy();
    for (let p = 2; p < 7; p++) {
      fireEvent.click(screen.getByTestId('sv-next'));
      await settle(3100);
      const sheet = sheetById(run.prompts[p]!);
      answer(sheet.entries.find((e) => e.band === 'a')!.name.en);
    }
    fireEvent.click(screen.getByTestId('sv-next'));
    expect(screen.getByTestId('sv-end')).toBeTruthy();
    expect(screen.getByTestId('sv-total').textContent).toContain('1,500 m');
    expect(calls.results.at(-1)).toMatchObject({
      outcome: 'complete',
      score: 150,
      mode: 'unlimited',
    });
    expect(calls.achievements).toEqual(expect.arrayContaining(['first-dive', 'pearl']));
    expect(screen.getByTestId('sv-review').querySelectorAll('li')).toHaveLength(7);
  });

  it('runs a two-player party with hidden hand-overs and a winner', async () => {
    vi.useFakeTimers();
    const { services } = createTestServices({ launchParams: { deal: '7' } });
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('sv-lang-es'));
    fireEvent.change(screen.getByTestId('sv-players'), { target: { value: '2' } });
    fireEvent.click(screen.getByTestId('sv-party'));
    const run = newRun({ polarity: 'rare', lang: 'es', kind: 'party', seed: 7, players: 2 });
    for (let p = 0; p < 7; p++) {
      for (let player = 0; player < 2; player++) {
        expect(screen.getByTestId('sv-pass')).toBeTruthy();
        fireEvent.click(screen.getByTestId('sv-ready'));
        await settle(3100);
        const sheet = sheetById(run.prompts[p]!);
        answer(sheet.entries.find((e) => e.band === (player === 0 ? 'e' : 'a'))!.name.es);
        fireEvent.click(screen.getByTestId('sv-next'));
      }
    }
    expect(screen.getByTestId('sv-winner').textContent).toBeTruthy();
  });

  it('lets the AI play a whole run in watch mode', async () => {
    vi.useFakeTimers();
    const { services, calls } = createTestServices({ launchParams: { mode: 'watch', deal: '3' } });
    render(<Game services={services} />);
    await settle(0);
    for (let i = 0; i < 7 * 110 && !screen.queryByTestId('sv-end'); i++) await settle(100);
    expect(screen.getByTestId('sv-end')).toBeTruthy();
    expect(calls.results).toHaveLength(0);
  });
});
