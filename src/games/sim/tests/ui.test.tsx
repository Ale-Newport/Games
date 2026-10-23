// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

const line = (a: string) => document.querySelector(`[data-line="${a}"]`) as SVGPolygonElement;

afterEach(cleanup);

describe('Sim UI', () => {
  it('colors lines and warns about a line that would close your triangle', async () => {
    const { services } = createTestServices();
    render(<Game services={services} />);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('start-match'));
    for (const a of ['0-1', '3-4', '1-2', '3-5']) fireEvent.click(line(a));
    expect(line('0-1').getAttribute('aria-label')).toMatch(/^A–B, (red|blue)$/);
    expect(line('0-2').getAttribute('aria-label')).toBe('A–C, free — would close your triangle');
    expect(line('0-3').getAttribute('aria-label')).toBe('A–D, free');
    fireEvent.click(line('0-2'));
    expect(document.querySelector('[data-line="0-3"]')!.getAttribute('aria-disabled')).toBe('true');
  });
});
