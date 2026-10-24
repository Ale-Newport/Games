// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const slot = (p: number) => document.querySelector(`[data-slot="${p}"]`) as SVGElement;

afterEach(cleanup);

describe('Gale UI', () => {
  it('builds a bridge in a free gap and passes the turn', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    expect(document.querySelectorAll('[data-slot]')).toHaveLength(41);
    const status = screen.getByTestId('mnk-status').textContent!;
    const orangeFirst = status.includes('Orange links');
    fireEvent.click(slot(60)); // f6, the middle gap
    expect(slot(60).getAttribute('aria-label')).toBe(
      `f6, ${orangeFirst ? 'Orange' : 'Teal'} bridge`,
    );
    expect(screen.getByTestId('mnk-status').textContent).toContain(
      orangeFirst ? 'Teal links left to right' : 'Orange links top to bottom',
    );
    fireEvent.click(slot(60)); // taken: nothing happens
    expect(slot(60).getAttribute('aria-label')).toContain(orangeFirst ? 'Orange' : 'Teal');
  });
});
