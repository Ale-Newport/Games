/**
 * Simple, honest forecasting methods over the visible part of a series (no peeking at hidden
 * values). Used by the graph games' computer forecaster and as the AI environments' actions.
 */

export type Method =
  'flat' | 'drift' | 'linear-5' | 'linear-10' | 'linear-all' | 'damped' | 'growth' | 'mean';

export const METHODS: Method[] = [
  'flat',
  'drift',
  'linear-5',
  'linear-10',
  'linear-all',
  'damped',
  'growth',
  'mean',
];

/** Least-squares line through (i, y[i]); returns [intercept at the last point, slope]. */
function fitLine(y: number[]): [number, number] {
  const n = y.length;
  if (n < 2) return [y[n - 1] ?? 0, 0];
  const mx = (n - 1) / 2;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let sxy = 0;
  let sxx = 0;
  for (let i = 0; i < n; i++) {
    sxy += (i - mx) * (y[i]! - my);
    sxx += (i - mx) * (i - mx);
  }
  const slope = sxy / sxx;
  return [my + slope * (n - 1 - mx), slope];
}

/** `h` predicted values after the visible ones. */
export function forecast(method: Method, visible: number[], h: number): number[] {
  const n = visible.length;
  const last = visible[n - 1]!;
  const out: number[] = [];
  switch (method) {
    case 'flat':
      for (let k = 1; k <= h; k++) out.push(last);
      return out;
    case 'drift': {
      const d = n > 1 ? (last - visible[0]!) / (n - 1) : 0;
      for (let k = 1; k <= h; k++) out.push(last + d * k);
      return out;
    }
    case 'linear-5':
    case 'linear-10':
    case 'linear-all': {
      const w = method === 'linear-5' ? 5 : method === 'linear-10' ? 10 : n;
      const [, slope] = fitLine(visible.slice(-w));
      // Anchor at the last real value so the forecast continues the line without a jump.
      for (let k = 1; k <= h; k++) out.push(last + slope * k);
      return out;
    }
    case 'damped': {
      const [, slope] = fitLine(visible.slice(-10));
      let v = last;
      let s = slope;
      for (let k = 1; k <= h; k++) {
        s *= 0.85;
        v += s;
        out.push(v);
      }
      return out;
    }
    case 'growth': {
      const tail = visible.slice(-10);
      if (tail.some((v) => v <= 0)) return forecast('linear-10', visible, h);
      const [, slope] = fitLine(tail.map(Math.log));
      for (let k = 1; k <= h; k++) out.push(last * Math.exp(slope * k));
      return out;
    }
    case 'mean': {
      const tail = visible.slice(-15);
      const m = tail.reduce((a, b) => a + b, 0) / tail.length;
      // Halfway back towards the recent mean, then level.
      for (let k = 1; k <= h; k++) out.push(m + (last - m) * Math.pow(0.6, k));
      return out;
    }
  }
}

/**
 * Mean absolute error of each method when the last `k` visible points are held out and forecast
 * from the ones before them (several origins, so one lucky fit does not decide).
 */
export function backtestErrors(visible: number[], horizon: number): number[] {
  const n = visible.length;
  const k = Math.max(2, Math.min(horizon, Math.floor(n / 3)));
  return METHODS.map((m) => {
    let err = 0;
    let count = 0;
    for (let origin = n - k; origin >= Math.max(5, n - k - 6); origin -= 3) {
      const pred = forecast(m, visible.slice(0, origin), Math.min(k, n - origin));
      pred.forEach((p, i) => {
        err += Math.abs(p - visible[origin + i]!);
        count++;
      });
    }
    return count ? err / count : Infinity;
  });
}

/** The single method with the lowest backtest error. */
export function backtestMethod(visible: number[], horizon: number): Method {
  const errs = backtestErrors(visible, horizon);
  let best = 0;
  errs.forEach((e, i) => {
    if (e < errs[best]! - 1e-12) best = i;
  });
  return METHODS[best]!;
}

/**
 * The computer forecaster: every method's forecast, weighted by the inverse of its backtest error
 * (relative to `scale`, the chart height). Combining forecasts this way beat every single method
 * and the best-backtest pick on 1,500 graphs per difficulty (see the Graph Forecast README).
 */
export function blendForecast(
  visible: number[],
  horizon: number,
  scale: number,
): { pred: number[]; weights: number[]; lead: Method } {
  const errs = backtestErrors(visible, horizon);
  const weights = errs.map((e) => (Number.isFinite(e) ? 1 / (e / scale + 0.01) : 0));
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  const preds = METHODS.map((m) => forecast(m, visible, horizon));
  const pred = Array.from({ length: horizon }, (_, i) =>
    preds.reduce((a, p, j) => a + (weights[j]! * p[i]!) / total, 0),
  );
  let lead = 0;
  weights.forEach((w, i) => {
    if (w > weights[lead]!) lead = i;
  });
  return { pred, weights: weights.map((w) => w / total), lead: METHODS[lead]! };
}
