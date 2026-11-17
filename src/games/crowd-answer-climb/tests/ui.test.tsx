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

describe('Crowd Answer Climb UI', () => {
  it('counts down three tries, then scores crowd favourites and records the daily climb', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 17, 12));
    const { services, calls } = createTestServices();
    render(<Game services={services} />);
    await settle(0);
    fireEvent.click(screen.getByTestId('sv-lang-en'));
    fireEvent.click(screen.getByTestId('sv-daily'));
    const run = newRun({ polarity: 'common', lang: 'en', kind: 'daily', seed: 1, day: 20261117 });
    await settle(3100);
    answer('qqqq zzz');
    expect(screen.getByTestId('sv-feedback').textContent).toContain('2 tries left');
    answer('qqqq yyy');
    expect(screen.getByTestId('sv-feedback').textContent).toContain('Last try');
    answer('qqqq xxx');
    expect(screen.getByTestId('sv-timeout').textContent).toContain('Out of tries');
    for (let p = 1; p < 7; p++) {
      fireEvent.click(screen.getByTestId('sv-next'));
      await settle(3100);
      answer(sheetById(run.prompts[p]!).entries.find((e) => e.band === 'a')!.name.en);
      expect(screen.getByTestId('sv-points').textContent).toBe('+100');
    }
    fireEvent.click(screen.getByTestId('sv-next'));
    expect(screen.getByTestId('sv-total').textContent).toContain('600 km');
    expect(calls.results.at(-1)).toMatchObject({ score: 600, mode: 'daily' });
    expect(calls.achievements).toEqual(expect.arrayContaining(['karman', 'station', 'orbit']));
    fireEvent.click(screen.getByTestId('sv-menu-btn'));
    expect(screen.getByTestId('sv-daily-done').textContent).toContain('600');
  });
});
