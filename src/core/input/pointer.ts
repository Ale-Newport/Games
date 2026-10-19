/** Converts a pointer event to coordinates in an element's own (logical) coordinate space. */
export function localPoint(
  event: { clientX: number; clientY: number },
  element: Element,
  logicalWidth?: number,
  logicalHeight?: number,
): { x: number; y: number } {
  const rect = element.getBoundingClientRect();
  const sx = logicalWidth ? logicalWidth / rect.width : 1;
  const sy = logicalHeight ? logicalHeight / rect.height : 1;
  return { x: (event.clientX - rect.left) * sx, y: (event.clientY - rect.top) * sy };
}
