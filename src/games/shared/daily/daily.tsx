/**
 * Small pieces shared by the daily-challenge estimation games (#232 onwards): the streak count
 * and an animated score counter.
 */
import { useEffect, useState } from 'react';

/** Consecutive daily numbers with a recorded result, ending today or yesterday. */
export function dailyStreak(daily: { [day: string]: number }, today: number): number {
  let d = daily[today] !== undefined ? today : today - 1;
  let n = 0;
  while (daily[d] !== undefined) {
    n++;
    d--;
  }
  return n;
}

/** Counts up to `to` over ~0.9 s (shows it at once when `instant`). */
export function CountUp({ to, instant }: { to: number; instant: boolean }) {
  const [n, setN] = useState(instant ? to : 0);
  useEffect(() => {
    if (instant) return;
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / 900);
      setN(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, instant]);
  return <>{instant ? to : n}</>;
}
