import { ChunkProcessingStats, processChunk } from "./2_processChunk";
import reload from "./reload";
import { splitArrayToNChunksAdaptive, waitSec } from "./reload/helper";
import { updateStatusesBySkip } from "./reload/updateStatuses";
import { IExchanger } from "./types/exchanger";

import { emoji, mylog } from "./utils/logger.ts";
import { getData, getObject, setData } from "./utils/redis";
import { idx, numCPUs } from "./utils/settings";

let loopRunning = false;

// сохраняем "скорость" воркеров
let workerSpeeds: number[] = Array(numCPUs).fill(1);

export const loop = async (): Promise<void> => {
  if (loopRunning) {
    mylog(
      `⚠️ Worker ${idx} already running loop — skipping duplicate start`,
      "warning"
    );
    return;
  }
  loopRunning = true;

  let loopsDone = 0;
  const pause_between_loops =
    ((await getData("parser_setting:pause_between_loops")) as number) || 20;
  const loopPause = Math.max(pause_between_loops, 2);

  const big_loop = ((await getData("parser_setting:big_loop")) as number) || 10;

  while (true) {
    const exchangersObj =
      ((await getObject("exchangers")) as { [key: string]: IExchanger }) ?? {};
    const exchangers = Object.values(exchangersObj);

    // -------------------------------------------------------------
    // Primary обновляет веса воркеров раз в big_loop циклов
    if (idx === 0 && loopsDone % big_loop === 0 && loopsDone > 0) {
      const stats: Record<number, number> = {};
      for (let i = 0; i < numCPUs; i++) {
        const t = await getData(`stats:loop_time:${i}`);
        if (typeof t === "number") stats[i] = t;
      }

      if (Object.keys(stats).length > 0) {
        const avg =
          Object.values(stats).reduce((a, b) => a + b, 0) /
          Object.values(stats).length;
        // быстрее → больший вес, медленнее → меньший
        workerSpeeds = Object.entries(stats).map(([i, t]) => avg / t);
        await setData("stats:worker_speeds", workerSpeeds);
        mylog(
          `⚙️ Updated adaptive worker speeds: ${workerSpeeds
            .map((s) => s.toFixed(2))
            .join(", ")}`,
          "info"
        );
      }
    } else if (idx !== 0) {
      // остальные воркеры читают веса, выставленные primary
      const speeds = await getData("stats:worker_speeds");
      if (Array.isArray(speeds) && speeds.length === numCPUs)
        workerSpeeds = speeds;
    }
    // -------------------------------------------------------------

    const chunk =
      splitArrayToNChunksAdaptive(exchangers, numCPUs, workerSpeeds)[idx] || [];
    mylog(`${emoji(idx)} Got ${chunk.length} exchangers`);

    const start = performance.now();
    let chunkStats: ChunkProcessingStats;
    try {
      chunkStats = await processChunk(chunk, loopsDone, idx);
    } catch (error: any) {
      mylog(
        `${emoji(idx)} Worker ${idx} chunk processing failed: ${String(
          error?.message ?? error
        )}`,
        "error"
      );
      chunkStats = {
        processed: chunk.length,
        succeeded: 0,
        failed: chunk.length,
        durationMs: performance.now() - start,
      };
    }
    const duration = chunkStats.durationMs || performance.now() - start;

    // сохраняем время работы этого цикла + стату по чанку
    await Promise.all([
      setData(`stats:loop_time:${idx}`, duration),
      setData(`stats:chunk:${idx}`, chunkStats.processed),
      setData(`stats:chunk:succeeded:${idx}`, chunkStats.succeeded),
      setData(`stats:chunk:failed:${idx}`, chunkStats.failed),
      setData(`stats:last_run:${idx}`, Date.now()),
      setData(`stats:loop:${idx}`, {
        loop: loopsDone,
        duration,
        processed: chunkStats.processed,
        succeeded: chunkStats.succeeded,
        failed: chunkStats.failed,
        updatedAt: Date.now(),
      }),
    ]);

    mylog(
      `${emoji(idx)} Worker ${idx} loop #${loopsDone} → processed ${
        chunkStats.processed
      } (ok: ${chunkStats.succeeded}, fail: ${chunkStats.failed}) in ${duration.toFixed(
        0
      )} ms`,
      idx === 0 ? "important" : "hidden"
    );

    !idx && (await updateStatusesBySkip(exchangersObj));

    await waitSec(loopPause);
    mylog(`${emoji(idx)} Loops done : ${loopsDone}`, "hidden");
    loopsDone++;
  }
};

// -------------------------------------------------------------
// Делит exchangers по весам (чем больше вес, тем больше нагрузка)
// -------------------------------------------------------------
