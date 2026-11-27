/**
 * Original silhouettes, one per object family, each drawn in its own viewBox at the family's
 * typical proportions. Vertical families are 100 units tall (width = aspect × 100) and measured
 * by height; horizontal ones are 100 units long (height = aspect × 100) and measured by length;
 * discs are 100 × 100 and measured by diameter. Everything uses currentColor.
 */
import type { ReactNode } from 'react';
import { axisOf, type Family } from './engine';

/** width ÷ height for vertical families, height ÷ length for horizontal ones, 1 for discs. */
export const ASPECT: Record<Family, number> = {
  skyscraper: 0.22,
  tower: 0.16,
  lighthouse: 0.22,
  statue: 0.32,
  pyramid: 1.57,
  dam: 2.5,
  wheel: 0.95,
  coaster: 1.6,
  tree: 0.55,
  rocket: 0.12,
  person: 0.3,
  bridge: 0.09,
  ship: 0.2,
  sailship: 0.55,
  submarine: 0.13,
  plane: 0.3,
  wings: 0.85,
  car: 0.34,
  train: 0.27,
  card: 0.63,
  pitch: 0.65,
  disc: 1,
  coin: 1,
  planet: 1,
  star: 1,
};

/** Size of the drawing box in units of the measured dimension: [width, height]. */
export function box(family: Family): [number, number] {
  const a = ASPECT[family];
  const axis = axisOf(family);
  return axis === 'vertical' ? [a, 1] : axis === 'horizontal' ? [1, a] : [1, 1];
}

const SHAPES: Record<Family, ReactNode> = {
  skyscraper: (
    <>
      <path d="M2 100V32h3V20h3V10h2.3V0h1.4v10H14v10h3v12h3v68z" />
      <path
        d="M4 36h4v3H4zm6 0h4v3h-4zm-6 7h4v3H4zm6 0h4v3h-4zm-6 7h4v3H4zm6 0h4v3h-4zm-6 7h4v3H4zm6 0h4v3h-4zm-6 7h4v3H4zm6 0h4v3h-4zm-6 7h4v3H4zm6 0h4v3h-4zm-6 7h4v3H4zm6 0h4v3h-4z"
        className="cut"
      />
    </>
  ),
  tower: (
    <path d="M1.5 100 6.6 46H4l-1.2-5Q8 35 13.2 41L12 46H9.4l5.1 54zM7.2 35V7h1.6v28zm.5-28V0h.6v7z" />
  ),
  lighthouse: (
    <>
      <path d="M4 100 7 31h8l3 69zM5 31h12v-3H5zm2.5-3V18h7v10zM7 18q4-8 8 0zm3.6-5V7h.8v6z" />
      <path d="M6.2 50h9.6v6H6.2zm-.9 22h11.4v6H5.3z" className="cut" />
    </>
  ),
  statue: (
    <>
      <path d="M3 100V84h26v16z" />
      <path d="M9.5 84 11 50q-1-8 2-13v-6q3-5 6 0v6q3 3 3 9L23.5 9h2.6L25.4 46q-2 6-2 14l1.2 24z" />
      <circle cx="16" cy="25" r="4.2" />
      <path d="M23.2 9 24 1l1.6 3 1-3 .8 8z" />
    </>
  ),
  pyramid: (
    <>
      <path d="M0 100 78.5 0 157 100z" />
      <path d="M78.5 0 100 100H96L78.5 8z" className="cut" />
    </>
  ),
  dam: (
    <>
      <path d="M0 100Q32 42 40 0h170q8 42 40 100z" />
      <path d="M60 12h130v5H60zm-4 20h138v5H56z" className="cut" />
    </>
  ),
  wheel: (
    <>
      <path d="M47.5 6a41 41 0 1 1 0 82 41 41 0 0 1 0-82m0 5a36 36 0 1 0 0 72 36 36 0 0 0 0-72" />
      <path d="m46 47 1.5-36 1.5 36 33-14-32 17 32 17-33-14-1.5 36-1.5-36-33 14 32-17-32-17z" />
      <path d="M47.5 47 30 100h6l11.5-40L59 100h6z" />
    </>
  ),
  coaster: (
    <>
      <path d="M0 96q20-100 40-30t35-20 25 10 25 10 35-26v8q-20 26-35 26t-25-10-25-10-35 22T0 100z" />
      <path d="M17 54h2v46h-2zm40 1h2v45h-2zm40 4h2v41h-2zm40-6h2v47h-2z" />
    </>
  ),
  tree: (
    <path d="M24 100l2-36q-14 2-22-8Q-2 44 6 30 4 14 18 9 26-2 38 6q14 1 14 16 8 12-2 24-7 12-21 12l2 42z" />
  ),
  rocket: <path d="M6 0q3 8 3 20v65l3 15H0l3-15V20q0-12 3-20z" />,
  person: (
    <>
      <circle cx="15" cy="7" r="6.5" />
      <path d="M8 16h14q4 0 4 5v30h-4.5V24h-.5v76h-6V58h-1v42H8V24h-.5v27H3V21q0-5 5-5z" />
    </>
  ),
  bridge: (
    <>
      <path d="M0 6h100v1.6H0zM24 0h2v9h-2zm50 0h2v9h-2z" />
      <path
        d="M0 6Q12 6 25 .3 37 6 50 6t25-5.7Q88 6 100 6"
        fill="none"
        stroke="currentColor"
        strokeWidth=".6"
      />
    </>
  ),
  ship: (
    <>
      <path d="M0 11h100l-6 9H5z" />
      <path d="M30 11V6h40v5zm10-5V2h16v4zm14-4V0h5v2z" />
    </>
  ),
  sailship: (
    <>
      <path d="M2 44h96l-8 11H10z" />
      <path d="M30 44V2h1.6v42zm34 0V0h1.6v44z" />
      <path d="M33 6q12 8 0 34zm34-4q14 10 0 38zM12 40l17-30v30z" />
    </>
  ),
  submarine: <path d="M8 5h84q8 0 8 4t-8 4H8q-8 0-8-4t8-4zm24 0 3-5h12l2 5z" />,
  plane: (
    <>
      <path d="M2 18q0-4 8-5h70l12-12h5l-4 13 7 1v6l-8 2H10q-8-1-8-5z" />
      <path d="M38 20h22l-12 8h-6z" className="cut" />
    </>
  ),
  wings: <path d="M47 0h6l2 30 45 18v6L55 47l-1 26 10 8v4H36v-4l10-8-1-26L0 54v-6l45-18z" />,
  car: (
    <>
      <path d="M2 22q0-6 6-7l18-2 12-10h32l14 10 12 2q4 1 4 7v4H2z" />
      <circle cx="22" cy="27" r="6.5" />
      <circle cx="78" cy="27" r="6.5" />
      <path d="M40 6h12v7H32zm16 0h12l9 7H56z" className="cut" />
    </>
  ),
  train: (
    <>
      <path d="M0 4h86q14 0 14 10v6H0z" />
      <circle cx="14" cy="23" r="4" />
      <circle cx="26" cy="23" r="4" />
      <circle cx="72" cy="23" r="4" />
      <circle cx="84" cy="23" r="4" />
      <path
        d="M8 8h10v6H8zm16 0h10v6H24zm16 0h10v6H40zm16 0h10v6H56zm32 0h7v6h-7z"
        className="cut"
      />
    </>
  ),
  card: (
    <>
      <rect width="100" height="63" rx="5" />
      <rect x="10" y="20" width="14" height="11" rx="2" className="cut" />
      <path d="M10 46h60v4H10z" className="cut" />
    </>
  ),
  pitch: (
    <>
      <rect width="100" height="65" rx="1" />
      <path
        d="M49.6 1h.8v63h-.8zM50 23.5a9 9 0 1 1 0 18 9 9 0 0 1 0-18m0 .8a8.2 8.2 0 1 0 0 16.4 8.2 8.2 0 0 0 0-16.4M1 14h15v37H1zm.8.8v35.4h13.4V14.8zM84 14h15v37H84zm.8.8v35.4h13.4V14.8z"
        className="cut"
      />
    </>
  ),
  disc: (
    <>
      <path
        d="M50 0a50 50 0 1 1 0 100A50 50 0 0 1 50 0m0 43a7 7 0 1 0 0 14 7 7 0 0 0 0-14"
        fillRule="evenodd"
      />
      <circle cx="50" cy="50" r="18" className="cut" fillOpacity=".3" />
    </>
  ),
  coin: (
    <>
      <circle cx="50" cy="50" r="50" />
      <circle cx="50" cy="50" r="40" className="cut" fillOpacity=".35" />
    </>
  ),
  planet: (
    <>
      <circle cx="50" cy="50" r="50" />
      <path
        d="M6 34q44 8 88 0v6Q50 48 6 40zm-4 22q48 10 96 0v5Q50 70 2 61z"
        className="cut"
        fillOpacity=".3"
      />
    </>
  ),
  star: (
    <>
      <circle cx="50" cy="50" r="50" />
      <circle cx="40" cy="38" r="22" className="cut" fillOpacity=".25" />
    </>
  ),
};

/**
 * A family's silhouette filling `width` × `height` pixels at (x, y) (top-left corner). The
 * viewBox keeps the drawing undistorted as long as width/height follows `box(family)`.
 */
export function Silhouette({
  family,
  x,
  y,
  width,
  height,
  className,
  testId,
}: {
  family: Family;
  x: number;
  y: number;
  width: number;
  height: number;
  className?: string;
  testId?: string;
}) {
  const [bw, bh] = box(family);
  return (
    <svg
      x={x}
      y={y}
      width={Math.max(0.5, width)}
      height={Math.max(0.5, height)}
      viewBox={`0 0 ${bw * 100} ${bh * 100}`}
      preserveAspectRatio="none"
      className={className}
      data-testid={testId}
      overflow="visible"
    >
      <g fill="currentColor">{SHAPES[family]}</g>
    </svg>
  );
}
