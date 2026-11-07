// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const pit = (p: number) => document.querySelector(`[data-pit="${p}"]`) as HTMLButtonElement;

afterEach(cleanup);

describe('Congkak UI', () => {
  it('sows from a pit and updates the counts', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    const before = Number(
      pit(1)
        .getAttribute('aria-label')!
        .match(/(\d+) seeds/)![1],
    );
    expect(pit(7).getAttribute('aria-disabled')).toBe('true'); // North's pit
    fireEvent.click(pit(1));
    expect(pit(1).getAttribute('aria-label')).toBe('South pit 2, 0 seeds');
    expect(
      Number(
        pit(2)
          .getAttribute('aria-label')!
          .match(/(\d+) seeds/)![1],
      ),
    ).toBeGreaterThan(0);
    expect(before).toBeGreaterThan(0);
  });
});
