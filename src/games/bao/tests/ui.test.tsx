// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { applyBaoAction, createBaoState } from '../engine';
import { Game } from '../Game';

const pit = (p: number) => document.querySelector(`[data-pit="${p}"]`) as HTMLButtonElement;

afterEach(cleanup);

describe('Bao UI', () => {
  it('chooses a pit, then a neighbor to set the direction', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    expect(document.querySelectorAll('[data-pit]')).toHaveLength(32);
    fireEvent.click(pit(20)); // North's pit: nothing happens
    expect(screen.queryByTestId('sow+')).toBeNull();
    fireEvent.click(pit(1));
    expect(screen.getByTestId('sow+')).toBeTruthy();
    expect(screen.queryByTestId('sow-')).toBeNull(); // only the capturing direction
    expect(pit(2).getAttribute('aria-label')).toContain('sow this way');
    fireEvent.click(pit(2));
    const expected = applyBaoAction(createBaoState(), '1+');
    for (const p of [0, 1, 2, 3, 20])
      expect(pit(p).getAttribute('aria-label')).toContain(`${expected.pits[p]} seeds`);
    expect(screen.getByTestId('totals').textContent).toContain(
      `South ${expected.pits.slice(0, 16).reduce((a, b) => a + b, 0)}`,
    );
  });
});
