import { startMovementSample, finishMovementSample } from "./movement-trace";

/** Synthetic input pressure, not a measurement of hardware mouse latency. */
export async function continuousMovement(move: (index: number) => void) {
  const frameIntervalsMs: number[] = [];
  const dispatchIntervalsMs: number[] = [];
  const handlerMs: number[] = [];
  let previousFrame = performance.now();
  let previousInput = previousFrame;
  let raf = 0;
  const observe = (now: number) => {
    frameIntervalsMs.push(now - previousFrame);
    previousFrame = now;
    raf = requestAnimationFrame(observe);
  };
  raf = requestAnimationFrame(observe);
  startMovementSample();
  try {
    for (let i = 0; i < 240; i++) {
      // Do not await a rendered preview between inputs: this is deliberately
      // different from the sequential latency/geometry test.
      await new Promise<void>((resolve) => setTimeout(resolve, 4));
      const start = performance.now();
      dispatchIntervalsMs.push(start - previousInput);
      previousInput = start;
      move(i);
      handlerMs.push(performance.now() - start);
    }
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    return {
      requestedIntervalMs: 4,
      inputs: 240,
      frameIntervalsMs,
      dispatchIntervalsMs,
      handlerMs,
      trace: finishMovementSample(),
    };
  } finally {
    cancelAnimationFrame(raf);
  }
}
