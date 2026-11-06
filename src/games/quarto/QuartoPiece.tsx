/**
 * Original Quarto piece art, seen from above: size = tall/short, color = dark/light,
 * outline = square/round, a hole in the top = hollow.
 */
export const traitsOf = (p: number) => ({
  tall: !!(p & 1),
  dark: !!(p & 2),
  square: !!(p & 4),
  hollow: !!(p & 8),
});

export function QuartoPiece({ piece }: { piece: number }) {
  const t = traitsOf(piece);
  const r = t.tall ? 40 : 28;
  const fill = t.dark ? '#5a3b26' : '#f1dcb0';
  const stroke = t.dark ? '#2d1c10' : '#a9875a';
  const hole = t.dark ? '#24160c' : '#c9a876';
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      {t.square ? (
        <rect
          x={50 - r}
          y={50 - r}
          width={2 * r}
          height={2 * r}
          rx="6"
          fill={fill}
          stroke={stroke}
          strokeWidth="4"
        />
      ) : (
        <circle cx="50" cy="50" r={r} fill={fill} stroke={stroke} strokeWidth="4" />
      )}
      {t.hollow && (
        <circle cx="50" cy="50" r={r * 0.42} fill={hole} stroke={stroke} strokeWidth="2" />
      )}
      {t.tall && (
        <circle
          cx="50"
          cy="50"
          r={r * 0.82}
          fill="none"
          stroke={stroke}
          strokeWidth="1.5"
          opacity="0.4"
        />
      )}
    </svg>
  );
}
