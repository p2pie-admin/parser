import pLimit from "p-limit";
import { processSingleExchanger } from "./2_exchangerProcessor";
import reload from "./reload";
import { splitArrayToNChunks, waitSec } from "./reload/helper";
import { updateStatusesBySkip } from "./reload/updateStatuses";
import { IExchanger, IExchangerStats } from "./types/exchanger";
import { measure } from "./utils/helper";

import { emoji, mylog } from "./utils/logger";
import { getData, getObject } from "./utils/redis";
import { idx, numCPUs } from "./utils/settings";
import { finishPrimaryLoop } from "./finishPrimaryLoop";
import { prepareGeneralData } from "./rates/generalDataLoader";
import { IGeneralData } from "./types/rates";

let loopRunning = false;

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
      reload();
    }

    const chunk = splitArrayToNChunks(exchangers, numCPUs)[idx] || [];
    mylog(`${emoji(idx)} Got ${chunk.length} exchangers`);

    const generalData: IGeneralData = await prepareGeneralData();
    await measure(
      "chunk",
      `${emoji(idx)} Worker ${idx} processed ${chunk.length} exchangers in`,
      async () => {
        const limit = pLimit(30);
        await Promise.allSettled(
          chunk.map((exchanger) => {
            return limit(async () => {
              processSingleExchanger({
                exchanger,
                loopsDone,
                skip: exchanger_stats?.[exchanger.id]?.skip || 0,
                generalData,
              });
            });
          })
        );
      }
    );

    !idx && (await finishPrimaryLoop(exchangersObj));
    await waitSec(loopPause);
    loopsDone++;
    mylog(`${emoji(idx)} Loops done : ${loopsDone}`, "hidden");
  }
};

// () =>
//   Promise.resolve(
//     setTimeout(() => mylog(exchanger.name), getRandom10() * 1000)
//   )
