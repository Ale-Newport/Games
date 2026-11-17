/**
 * A world map to drop a pin on (any point, not just countries). Zoom with the buttons or the wheel
 * and drag to pan when zoomed; a click (not a drag) places the pin. After a guess it also shows the
 * true place and a great-circle line between the two.
 */
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { useEffect, useMemo, useRef, useState } from 'react';
import { loadShapes, type Shapes } from '../shared/world/world';
import styles from './WhenWhere.module.css';

const W = 960;
const H = 500;

export function PinMap({
  pin,
  truth,
  onPin,
  label,
  zoomIn,
  zoomOut,
}: {
  pin: [number, number] | null;
  truth: [number, number] | null;
  onPin?: (lat: number, lon: number) => void;
  label: string;
  zoomIn: string;
  zoomOut: string;
}) {
  const [shapes, setShapes] = useState<Shapes | null>(null);
  const [view, setView] = useState({ k: 1, x: W / 2, y: H / 2 });
  const svgRef = useRef<SVGSVGElement | null>(null);
  const drag = useRef<{ x: number; y: number; moved: boolean; vx: number; vy: number } | null>(
    null,
  );
  useEffect(() => {
    let alive = true;
    void loadShapes().then((s) => alive && setShapes(s));
    return () => {
      alive = false;
    };
  }, []);
  const projection = useMemo(
    () =>
      geoNaturalEarth1().fitExtent(
        [
          [4, 4],
          [W - 4, H - 4],
        ],
        { type: 'Sphere' },
      ),
    [],
  );
  const path = useMemo(() => geoPath(projection), [projection]);
  const countries = useMemo(
    () =>
      shapes ? shapes.collection.features.map((f) => ({ id: String(f.id), d: path(f) ?? '' })) : [],
    [shapes, path],
  );
  const vw = W / view.k;
  const vh = H / view.k;
  const vx = Math.max(0, Math.min(W - vw, view.x - vw / 2));
  const vy = Math.max(0, Math.min(H - vh, view.y - vh / 2));

  const toSvg = (cx: number, cy: number): [number, number] | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const r = svg.getBoundingClientRect();
    if (!r.width) return null;
    return [vx + ((cx - r.left) / r.width) * vw, vy + ((cy - r.top) / r.height) * vh];
  };
  const zoom = (f: number) => setView((v) => ({ ...v, k: Math.max(1, Math.min(8, v.k * f)) }));
  const at = (ll: [number, number] | null) => (ll ? projection([ll[1], ll[0]]) : null);
  const p = at(pin);
  const t = at(truth);
  const line =
    pin && truth
      ? path({
          type: 'LineString',
          coordinates: [
            [pin[1], pin[0]],
            [truth[1], truth[0]],
          ],
        })
      : null;
  const r = 7 / Math.sqrt(view.k);

  return (
    <div className={styles.mapBox}>
      <svg
        ref={svgRef}
        className={styles.map}
        viewBox={`${vx} ${vy} ${vw} ${vh}`}
        role="img"
        aria-label={label}
        data-testid="ww-map"
        onWheel={(e) => zoom(e.deltaY < 0 ? 1.25 : 0.8)}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture?.(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY, moved: false, vx: view.x, vy: view.y };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d || !e.buttons) return;
          const dx = e.clientX - d.x;
          const dy = e.clientY - d.y;
          if (Math.hypot(dx, dy) > 5) d.moved = true;
          if (d.moved && view.k > 1) {
            const rect = e.currentTarget.getBoundingClientRect();
            setView((v) => ({
              ...v,
              x: d.vx - (dx / rect.width) * vw,
              y: d.vy - (dy / rect.height) * vh,
            }));
          }
        }}
        onPointerUp={(e) => {
          const d = drag.current;
          drag.current = null;
          if (d?.moved || !onPin) return;
          const s = toSvg(e.clientX, e.clientY);
          const ll = s ? projection.invert?.(s) : null;
          if (ll && Number.isFinite(ll[0]) && Number.isFinite(ll[1])) onPin(ll[1], ll[0]);
        }}
      >
        <path d={path({ type: 'Sphere' }) ?? ''} className={styles.sea} />
        {countries.map((c) => (
          <path key={c.id} d={c.d} className={styles.land} />
        ))}
        {line && <path d={line} className={styles.line} strokeWidth={2 / view.k} />}
        {t && <circle cx={t[0]} cy={t[1]} r={r} className={styles.truth} data-testid="ww-truth" />}
        {p && (
          <g data-testid="ww-pin">
            <circle cx={p[0]} cy={p[1]} r={r} className={styles.pin} />
          </g>
        )}
      </svg>
      <div className={styles.zoom}>
        <button
          type="button"
          className="btn btn-small"
          onClick={() => zoom(1.6)}
          aria-label={zoomIn}
        >
          +
        </button>
        <button
          type="button"
          className="btn btn-small"
          onClick={() => zoom(1 / 1.6)}
          aria-label={zoomOut}
        >
          −
        </button>
      </div>
    </div>
  );
}
