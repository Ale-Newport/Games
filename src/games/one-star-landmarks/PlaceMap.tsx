/**
 * A small world map (Natural Earth shapes, shared with the geography games) with the guesses as
 * numbered pins and, once the round is over, the answer as a star with a dashed line from each
 * guess. It frames the points it shows, so a European round zooms into Europe.
 */
import type { GeoPermissibleObjects } from 'd3-geo';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { useEffect, useMemo, useState } from 'react';
import { loadShapes, type Shapes } from '../shared/world/world';
import styles from './OneStar.module.css';

const W = 640;
const H = 340;

interface Pin {
  lat: number;
  lon: number;
  label: string;
}

/** A lon/lat box around the points, padded and at least 40° × 25°, as a GeoJSON polygon. */
function frame(points: Pin[]): GeoPermissibleObjects {
  if (!points.length) return { type: 'Sphere' };
  let x0 = Math.min(...points.map((p) => p.lon));
  let x1 = Math.max(...points.map((p) => p.lon));
  let y0 = Math.min(...points.map((p) => p.lat));
  let y1 = Math.max(...points.map((p) => p.lat));
  const grow = (a: number, b: number, min: number): [number, number] => {
    const pad = Math.max(min - (b - a), 0) / 2 + (b - a) * 0.15 + 4;
    return [a - pad, b + pad];
  };
  [x0, x1] = grow(x0, x1, 40);
  [y0, y1] = grow(y0, y1, 25);
  x0 = Math.max(-180, x0);
  x1 = Math.min(180, x1);
  y0 = Math.max(-85, y0);
  y1 = Math.min(85, y1);
  if (x1 - x0 > 200) return { type: 'Sphere' };
  const ring: [number, number][] = [];
  for (let i = 0; i <= 8; i++) ring.push([x0 + ((x1 - x0) * i) / 8, y0]);
  for (let i = 0; i <= 8; i++) ring.push([x1, y0 + ((y1 - y0) * i) / 8]);
  for (let i = 0; i <= 8; i++) ring.push([x1 - ((x1 - x0) * i) / 8, y1]);
  for (let i = 0; i <= 8; i++) ring.push([x0, y1 - ((y1 - y0) * i) / 8]);
  return { type: 'Polygon', coordinates: [ring.reverse()] };
}

export function PlaceMap({
  pins,
  answer,
  label,
}: {
  pins: Pin[];
  answer: Pin | null;
  label: string;
}) {
  const [shapes, setShapes] = useState<Shapes | null>(null);
  useEffect(() => {
    let alive = true;
    void loadShapes().then((s) => alive && setShapes(s));
    return () => {
      alive = false;
    };
  }, []);
  const all = useMemo(() => (answer ? [...pins, answer] : pins), [pins, answer]);
  const drawn = useMemo(() => {
    if (!shapes) return null;
    const projection = geoNaturalEarth1().fitExtent(
      [
        [8, 8],
        [W - 8, H - 8],
      ],
      frame(all),
    );
    const path = geoPath(projection);
    const at = (p: Pin) => projection([p.lon, p.lat]) ?? [0, 0];
    return { countries: shapes.collection.features.map((f) => path(f) ?? ''), at };
  }, [shapes, all]);

  if (!drawn)
    return (
      <div className={styles.mapLoading} aria-hidden>
        …
      </div>
    );
  const target = answer ? drawn.at(answer) : null;
  return (
    <svg
      className={styles.map}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={label}
      data-testid="os-map"
    >
      <rect width={W} height={H} className={styles.sea} />
      {drawn.countries.map((d, i) => (
        <path key={i} d={d} className={styles.land} />
      ))}
      {target &&
        pins.map((p, i) => {
          const [x, y] = drawn.at(p);
          return (
            <line
              key={`l${i}`}
              x1={x}
              y1={y}
              x2={target[0]}
              y2={target[1]}
              className={styles.trail}
            />
          );
        })}
      {pins.map((p, i) => {
        const [x, y] = drawn.at(p);
        return (
          <g key={`p${i}`} data-testid={`os-pin-${i}`}>
            <circle cx={x} cy={y} r={9} className={styles.pin} />
            <text x={x} y={y + 4} className={styles.pinLabel}>
              {p.label}
            </text>
          </g>
        );
      })}
      {target && (
        <path
          d={`M${target[0]} ${target[1] - 13}l3.8 7.8 8.6 1.2-6.2 6 1.5 8.5-7.7-4-7.7 4 1.5-8.5-6.2-6 8.6-1.2z`}
          className={styles.star}
          data-testid="os-star"
        />
      )}
    </svg>
  );
}
