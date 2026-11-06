import { useEffect, useRef } from 'react';
import type { Direction } from '../game-engine/grid';

/** True when the event originates from a text field, where game shortcuts must not fire. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

export function arrowDirection(key: string): Direction | null {
  switch (key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      return 'up';
    case 'ArrowDown':
    case 's':
    case 'S':
      return 'down';
    case 'ArrowLeft':
    case 'a':
    case 'A':
      return 'left';
    case 'ArrowRight':
    case 'd':
    case 'D':
      return 'right';
    default:
      return null;
  }
}

/**
 * Subscribes to window keydown while `enabled`. The handler returns true when it consumed the key,
 * which prevents the browser default (e.g. page scrolling on arrow keys). Events are ignored while
 * a modal dialog is open or the user is typing.
 */
export function useKeyboard(
  handler: (event: KeyboardEvent) => boolean | void,
  enabled = true,
): void {
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  });
  useEffect(() => {
    if (!enabled) return;
    const listener = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (isTypingTarget(event.target)) return;
      if (document.querySelector('dialog[open]')) return;
      if (ref.current(event) === true) event.preventDefault();
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [enabled]);
}
