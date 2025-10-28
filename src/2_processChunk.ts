// 2_processChunk.ts
import pLimit from "p-limit";
import { processSingleExchanger } from "./rates/exchangerProcessor";
import { emoji } from "./utils/logger.ts";
import { measure } from "./utils/helper";
import { IExchanger } from "./types/exchanger";

export async function processChunk(
  exchangers: IExchanger[],
  loopsDone: number,
  idx: number
) {
  const poolLimit = Number(process.env.POOL_LIMIT ?? 30);
  const limit = pLimit(poolLimit);

  await measure(
    "loop",
    `${emoji(idx)} Worker ${idx} finished loop #${loopsDone} in`,
    async () => {
      const tasks = exchangers.map((exchanger) =>
        limit(async () => {
          try {
            await processSingleExchanger(exchanger, loopsDone, idx);
          } catch {
            // без лишнего шума — measure и верхний цикл зафиксируют факт
          }
        })
      );
      await Promise.allSettled(tasks);
    }
  );
}
