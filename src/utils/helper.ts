import { mylog } from "./logger.ts";
import { setData } from "./redis";
import { idx } from "./settings";

export async function measure<T>(
  key: string,
  label: string,
  fn: () => Promise<T> | T
): Promise<T> {
  const start = performance.now();

  try {
    const result = await fn(); // ждём полностью выполнение fn()
    if (idx) return result; // только primary логирует

    const duration = performance.now() - start;
    const formatted =
      duration < 1000
        ? `${duration.toFixed(1)} ms`
        : `${(duration / 1000).toFixed(2)} s`;

    mylog(`---------------------`, "important");
    mylog(`${label} ${formatted}`, "important");
    mylog(`---------------------`, "important");

    // не ждём Redis, просто отправляем
    void setData(`stats:${key}`, `${label} ${formatted}`);
    return result;
  } catch (err: any) {
    const duration = performance.now() - start;
    mylog(`${label} failed after ${duration.toFixed(1)} ms`, "error");
    throw err;
  }
}
