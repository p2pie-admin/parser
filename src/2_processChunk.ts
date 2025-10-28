// 2_processChunk.ts
import pLimit from "p-limit";
import { processSingleExchanger } from "./rates/exchangerProcessor";
import { IExchanger } from "./types/exchanger";

export type ChunkProcessingStats = {
  processed: number;
  succeeded: number;
  failed: number;
  durationMs: number;
};

export async function processChunk(
  exchangers: IExchanger[],
  loopsDone: number,
  idx: number
): Promise<ChunkProcessingStats> {
  if (!exchangers.length) {
    return {
      processed: 0,
      succeeded: 0,
      failed: 0,
      durationMs: 0,
    };
  }

  const poolLimit = Number(process.env.POOL_LIMIT ?? 30);
  const limit = pLimit(poolLimit);
  const start = performance.now();

  const tasks = exchangers.map((exchanger) =>
    limit(async () => {
      await processSingleExchanger(exchanger, loopsDone, idx);
    })
  );

  const results = await Promise.allSettled(tasks);
  const durationMs = performance.now() - start;

  let succeeded = 0;
  let failed = 0;

  for (const result of results) {
    if (result.status === "fulfilled") succeeded++;
    else failed++;
  }

  return {
    processed: exchangers.length,
    succeeded,
    failed,
    durationMs,
  };
}
