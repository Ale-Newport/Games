/** A domino tile drawn in SVG: two halves of pips, horizontal or vertical, face up or face down. */
const SPOTS: Record<number, [number, number][]> = {
  0: [],
  1: [[1, 1]],
  2: [
    [0, 0],
    [2, 2],
  ],
  3: [
    [0, 0],
    [1, 1],
    [2, 2],
  ],
  4: [
    [0, 0],
    [0, 2],
    [2, 0],
    [2, 2],
  ],
  5: [
    [0, 0],
    [0, 2],
    [1, 1],
    [2, 0],
    [2, 2],
  ],
  6: [
    [0, 0],
    [0, 2],
    [1, 0],
    [1, 2],
    [2, 0],
    [2, 2],
  ],
};

function Half({ n, x, y }: { n: number; x: number; y: number }) {
  return (
    <>
      {SPOTS[n]!.map(([r, c], i) => (
        <circle key={i} cx={x + 6 + c * 8} cy={y + 6 + r * 8} r={2.4} />
      ))}
    </>
  );
}

/** `a` is drawn on the left (or top), `b` on the right (or bottom); `back` hides the pips. */
export function TileFace({
  a,
  b,
  vertical,
  back,
}: {
  a: number;
  b: number;
  vertical?: boolean;
  back?: boolean;
}) {
  const w = vertical ? 28 : 56;
  const h = vertical ? 56 : 28;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      aria-hidden="true"
      data-back={back || undefined}
    >
      <rect
        x={1}
        y={1}
        width={w - 2}
        height={h - 2}
        rx={5}
        fill={back ? '#3a4a6b' : '#f8f4ea'}
        stroke="#2a2a2a"
        strokeWidth={1}
      />
      {!back && (
        <>
          {vertical ? (
            <line x1={5} y1={28} x2={23} y2={28} stroke="#8a8578" strokeWidth={1} />
          ) : (
            <line x1={28} y1={5} x2={28} y2={23} stroke="#8a8578" strokeWidth={1} />
          )}
          <g fill="#1b1b22">
            <Half n={a} x={0} y={0} />
            <Half n={b} x={vertical ? 0 : 28} y={vertical ? 28 : 0} />
          </g>
        </>
      )}
    </svg>
  );
}
