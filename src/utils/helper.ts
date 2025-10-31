import { emoji, mylog } from "./logger";
import { getData, setData } from "./redis";
import { bigTTL } from "./settings";

export async function measure<T>(
  {
    idx,
    length,
    loopsDone,
  }: { idx: number; length: number; loopsDone: number },
  fn: () => Promise<T> | T
): Promise<T> {
  const start = performance.now();

  try {
    const result = await fn();

    const duration = performance.now() - start;
    const formatted =
      duration < 1000
        ? `${duration.toFixed(1)} ms`
        : `${(duration / 1000).toFixed(2)} s`;

    mylog(`---------------------`, "important");
    mylog(`---------------------`, "important");
    mylog(
      `${emoji(
        idx
      )} Worker ${idx} processed ${length} exchangers on loop ${loopsDone} in ${formatted}`,
      "important"
    );
    mylog(`---------------------`, "important");

    await setData(
      `stats:${idx}`,
      {
        durationMs: duration,
        formatted,
        length,
        loopsDone,
        recordedAt: Date.now(),
      },
      bigTTL
    );
    return result;
  } catch (err: any) {
    const duration = performance.now() - start;
    mylog(
      `Worker ${idx} failed after ${duration.toFixed(1)} ms (loop ${loopsDone})`,
      "error"
    );
    throw err;
  }
}

export function rand0to10(): number {
  return Math.floor(Math.random() * 11);
}

const parseDurationMs = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "object") {
    const maybeRecord = value as Record<string, unknown>;
    const direct =
      typeof maybeRecord.durationMs === "number" &&
      Number.isFinite(maybeRecord.durationMs)
        ? maybeRecord.durationMs
        : null;
    if (direct !== null) return direct;

    if (
      typeof maybeRecord.duration === "number" &&
      Number.isFinite(maybeRecord.duration)
    ) {
      return maybeRecord.duration;
    }

    if (typeof maybeRecord.formatted === "string") {
      return parseDurationMs(maybeRecord.formatted);
    }
  }

  if (typeof value === "string") {
    const match = value.match(/([\d.,]+)\s*(ms|s)/i);
    if (match) {
      const numeric = Number(match[1].replace(",", "."));
      if (Number.isFinite(numeric)) {
        return match[2].toLowerCase() === "s" ? numeric * 1000 : numeric;
      }
    }
  }

  return null;
};

export async function getAdaptiveWorkerWeights(
  count: number
): Promise<number[]> {
  const durations = await Promise.all(
    Array.from({ length: count }, (_, i) =>
      getData(`stats:${i}`).then((value) => parseDurationMs(value))
    )
  );

  const validDurations = durations.filter(
    (d): d is number => typeof d === "number" && Number.isFinite(d) && d > 0
  );

  if (!validDurations.length) {
    return Array.from({ length: count }, () => 1);
  }

  const slowest = Math.max(...validDurations);
  const fastest = Math.min(...validDurations);
  const epsilon = Math.max(fastest * 0.1, 1);

  return durations.map((duration) => {
    if (!duration || !Number.isFinite(duration) || duration <= 0) {
      return 1;
    }

    const weight = Math.max(fastest, epsilon) / Math.max(duration, epsilon);
    const clamped = Math.min(Math.max(weight, 0.25), 2);
    return Number.isFinite(clamped) ? clamped : 1;
  });
}
