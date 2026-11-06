export interface FixedStepLoopOptions {
  /** Simulation steps per second. */
  hz: number;
  /** Advances the simulation by exactly one step of 1/hz seconds. */
  update: (dtSeconds: number) => void;
  /** Draws; alpha in [0,1) is the fraction toward the next step for interpolation. */
  render: (alpha: number) => void;
  /** Avoids the spiral of death after tab switches. */
  maxStepsPerFrame?: number;
  requestFrame?: (cb: (time: number) => void) => number;
  cancelFrame?: (handle: number) => void;
}

export interface FixedStepLoop {
  start(): void;
  stop(): void;
  readonly running: boolean;
  /** Runs one frame at the given timestamp (exposed for deterministic tests). */
  frame(time: number): void;
}

/**
 * Deterministic fixed-timestep game loop: the simulation always advances in equal steps,
 * independent of display refresh rate. Rendering never drives game logic.
 */
export function createFixedStepLoop(options: FixedStepLoopOptions): FixedStepLoop {
  const step = 1000 / options.hz;
  const maxSteps = options.maxStepsPerFrame ?? 5;
  const request = options.requestFrame ?? ((cb) => requestAnimationFrame(cb));
  const cancel = options.cancelFrame ?? ((h) => cancelAnimationFrame(h));
  let handle = 0;
  let running = false;
  let last: number | null = null;
  let accumulator = 0;

  const frame = (time: number) => {
    if (last === null) last = time;
    accumulator += Math.min(time - last, step * maxSteps);
    last = time;
    let steps = 0;
    while (accumulator >= step - 1e-6 && steps < maxSteps) {
      options.update(step / 1000);
      accumulator = Math.max(0, accumulator - step);
      steps++;
    }
    if (steps === maxSteps) accumulator = Math.min(accumulator, step);
    options.render(accumulator / step);
  };

  const tick = (time: number) => {
    if (!running) return;
    frame(time);
    handle = request(tick);
  };

  return {
    start() {
      if (running) return;
      running = true;
      last = null;
      accumulator = 0;
      handle = request(tick);
    },
    stop() {
      running = false;
      cancel(handle);
    },
    get running() {
      return running;
    },
    frame,
  };
}
