/** A pixel-art joystick, drawn from a character grid so the sprite stays crisp at any size. */
const SPRITE = [
  '....pppp....',
  '...pPPPPp...',
  '...pPPPPp...',
  '....pppp....',
  '.....ss.....',
  '.....ss.....',
  '.....ss.....',
  '.cccccccccc.',
  'cCCCCCCCCCCc',
  'cCyCCCCCCrCc',
  'cCCCCCCCCCCc',
  '.cccccccccc.',
];

const FILL: Record<string, string> = {
  p: '#c2175f',
  P: '#ff3d8b',
  s: '#e9e4f7',
  c: '#0f8ea3',
  C: '#22e5ff',
  y: '#ffd23f',
  r: '#ff3d8b',
};

export function PixelLogo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      {SPRITE.flatMap((row, y) =>
        [...row].map((ch, x) => {
          const fill = FILL[ch];
          return fill ? (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />
          ) : null;
        }),
      )}
    </svg>
  );
}
