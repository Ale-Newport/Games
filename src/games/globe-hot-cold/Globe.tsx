/**
 * The spinning globe: Natural Earth shapes on an orthographic projection drawn to a canvas.
 * Drag (mouse or touch) to rotate, buttons or the wheel to zoom; it turns to face the latest
 * guess. Countries are filled by a colour function; the rest stay pale.
 */
import { geoGraticule10, geoOrthographic, geoPath } from 'd3-geo';
import { useEffect, useRef, useState } from 'react';
import { centroidOf, loadShapes, type Shapes } from '../shared/world/world';
import styles from './Globe.module.css';

export function Globe({
  fills,
  focus,
  label,
  zoomIn,
  zoomOut,
  reducedMotion,
}: {
  fills: Record<string, string>;
  focus: string | null;
  label: string;
  zoomIn: string;
  zoomOut: string;
  reducedMotion: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shapes, setShapes] = useState<Shapes | null>(null);
  const rotation = useRef<[number, number]>([-10, -20]);
  const target = useRef<[number, number] | null>(null);
  const [scale, setScale] = useState(1);
  const drag = useRef<{ x: number; y: number; r: [number, number] } | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    void loadShapes().then((s) => alive && setShapes(s));
    return () => {
      alive = false;
    };
  }, []);

  const instant = useRef(reducedMotion);
  useEffect(() => {
    instant.current = reducedMotion;
  }, [reducedMotion]);

  useEffect(() => {
    if (!focus) return;
    const [lon, lat] = centroidOf(focus);
    target.current = [-lon, -lat];
  }, [focus]);

  // Ease toward the focus rotation.
  useEffect(() => {
    let raf = 0;
    const step = () => {
      const goal = target.current;
      if (goal && !drag.current) {
        const [r0, r1] = rotation.current;
        let d0 = goal[0] - r0;
        d0 = ((d0 + 540) % 360) - 180;
        const d1 = goal[1] - r1;
        const k = instant.current ? 1 : 0.12;
        if (instant.current || (Math.abs(d0) < 0.3 && Math.abs(d1) < 0.3)) target.current = null;
        rotation.current = [r0 + d0 * k, r1 + d1 * k];
        setTick((n) => n + 1);
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !shapes) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const size = canvas.width;
    const projection = geoOrthographic()
      .scale((size / 2.1) * scale)
      .translate([size / 2, size / 2])
      .rotate([rotation.current[0], rotation.current[1]])
      .clipAngle(90);
    const path = geoPath(projection, ctx);
    ctx.clearRect(0, 0, size, size);
    ctx.beginPath();
    path({ type: 'Sphere' });
    ctx.fillStyle = '#163a6b';
    ctx.fill();
    ctx.beginPath();
    path(geoGraticule10());
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();
    for (const f of shapes.collection.features) {
      ctx.beginPath();
      path(f);
      ctx.fillStyle = fills[String(f.id)] ?? '#dfe6ee';
      ctx.fill();
      ctx.strokeStyle = '#2b3a55';
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }
    ctx.beginPath();
    path({ type: 'Sphere' });
    ctx.strokeStyle = '#0b1530';
    ctx.lineWidth = 3;
    ctx.stroke();
  }, [shapes, fills, tick, scale]);

  const onDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, r: [...rotation.current] as [number, number] };
    target.current = null;
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const k = 0.35 / scale;
    rotation.current = [
      d.r[0] + (e.clientX - d.x) * k,
      Math.max(-85, Math.min(85, d.r[1] - (e.clientY - d.y) * k)),
    ];
    setTick((n) => n + 1);
  };
  const onUp = () => {
    drag.current = null;
  };

  return (
    <div className={styles.box}>
      <canvas
        ref={canvasRef}
        width={640}
        height={640}
        className={styles.canvas}
        role="img"
        aria-label={label}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onWheel={(e) => setScale((z) => Math.max(1, Math.min(6, z * (e.deltaY < 0 ? 1.15 : 0.87))))}
        data-testid="gl-globe"
        data-ready={shapes ? 'true' : 'false'}
      />
      <div className={styles.zoom}>
        <button
          type="button"
          className="btn btn-icon"
          onClick={() => setScale((z) => Math.min(6, z * 1.4))}
          aria-label={zoomIn}
        >
          +
        </button>
        <button
          type="button"
          className="btn btn-icon"
          onClick={() => setScale((z) => Math.max(1, z / 1.4))}
          aria-label={zoomOut}
        >
          −
        </button>
      </div>
    </div>
  );
}
