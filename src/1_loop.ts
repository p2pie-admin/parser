import pLimit from "p-limit";
import { processSingleExchanger } from "./2_exchangerProcessor";
import reload from "./reload";
import { splitArrayToNChunks, waitSec } from "./reload/helper";
import { IExchanger, IExchangerStats } from "./types/exchanger";
import { measure } from "./utils/helper";

import { emoji, mylog } from "./utils/logger";
import { getData, getObject } from "./utils/redis";
import { idx, numCPUs } from "./utils/settings";

import { prepareGeneralData } from "./rates/generalDataLoader";
import { IGeneralData } from "./types/rates";
import { updateStatusesBySkip } from "./reload/updateStatuses";

let loopRunning = false;
const GENERAL_DATA_TTL_MS = Number(process.env.GENERAL_DATA_TTL_MS ?? 300_000);

let generalDataCache: {
  data: IGeneralData;
  expiresAt: number;
} | null = null;

const getGeneralData = async (): Promise<IGeneralData> => {
  const now = Date.now();
  if (generalDataCache && generalDataCache.expiresAt > now) {
    return generalDataCache.data;
  }

  const data = await prepareGeneralData();
  generalDataCache = {
    data,
    expiresAt: now + GENERAL_DATA_TTL_MS,
  };
  return data;
};

export const loop = async (): Promise<void> => {
  if (loopRunning) {
    // на всякий случай защита от повторного запуска
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
  const loopPause = Math.max(pause_between_loops, 5);

  const big_loop = ((await getData("parser_setting:big_loop")) as number) || 10;

  while (true) {
    let exchangersObj =
      ((await getObject("exchangers")) as { [key: string]: IExchanger }) ?? {};

    const exchangers = Object.values(exchangersObj);

    const exchanger_stats = (await getObject("exchanger_stats")) as Record<
      string,
      IExchangerStats
    >;

    if (idx === 0 && loopsDone % big_loop === 0 && loopsDone > 0) {
      // -------------------------------------------------------------
      await reload();
      generalDataCache = null;
    }

    const chunk = splitArrayToNChunks(exchangers, numCPUs)[idx] || [];
    mylog(`${emoji(idx)} Got ${chunk.length} exchangers`);

    const generalData: IGeneralData = await getGeneralData();
    await measure(
      "chunk",
      `${emoji(idx)} Worker ${idx} processed ${chunk.length} exchangers in`,
      async () => {
        const limit = pLimit(300);
        await Promise.allSettled(
          chunk.map((exchanger, index) => {
            return limit(() =>
              processSingleExchanger({
                exchanger,
                loopsDone,
                skip: exchanger_stats?.[exchanger.id]?.skip || 0,
                generalData,
                index,
              })
            );
          })
        );
      }
    );

    !idx && updateStatusesBySkip(exchangersObj); // не авейтим, пусть фигачит на фоне
    await waitSec(loopPause);
    loopsDone++;
    mylog(
      `${emoji(idx)} Loops done : ${loopsDone}. Waiting ${loopPause}s...`,
      "hidden"
    );
  }
};

// () =>
//   Promise.resolve(
//     setTimeout(() => mylog(exchanger.name), getRandom10() * 1000)
//   )
