import { cpus } from "os";
import { waitSec } from "../loops/helper";
import { getObject } from "../redis";
import { emoji, mylog } from "../helper";
import { IExchanger } from "../types/exchanger";

import reload from "../loops/reload";
import { splitArrayToNChunks } from "../loops/helper";
import { processSingleExchanger } from "./exchangerProcessor";
import { filterRates } from "./top";
import { checkInternetConnection, withRetry } from "../internetCheck";

let loopsDone = 0;

export const processExchangers = async () => {
  const idx = parseInt(process.env.IDX || "0");
  const numCPUs = cpus().length;

  const pause = (await import("../redis"))
    .getData("parser_setting")
    .then((data) => data?.pause_between_loops || 10);

  const isOnline = await checkInternetConnection();
  if (!isOnline) {
    mylog("🛑 No internet connection. Retrying in 30s...", "error");
    await waitSec(30);
    processExchangers();
  }

  await waitSec((await pause) / 3);
  mylog(`${emoji(idx)} Filtering rates..`, "info");
  await filterRates(idx, numCPUs);
  await waitSec((await pause) / 3);
  !idx && reload();
  await waitSec((await pause) / 3);

  mylog(`• Core ${emoji(idx)} starting processing...`, "info");

  const exchangers = (await getObject("exchangers")) as Record<
    string,
    IExchanger
  >;
  if (!exchangers || !Object.keys(exchangers).length) {
    mylog("No exchangers found!", "error");
    await waitSec(30);
    return;
  }

  const chunk = splitArrayToNChunks(Object.values(exchangers), numCPUs)[idx];

  chunk.map(async (exchanger, i) => {
    await new Promise((res) => setTimeout(res, i * (100 + chunk.length * 2.5)));

    try {
      await withRetry(() => processSingleExchanger(exchanger, loopsDone, idx));
    } catch (error: any) {
      mylog(
        `❌ Failed to process exchanger ${exchanger.name || exchanger.id}: ${
          error.message
        }`,
        "error"
      );
    }

    if (i === chunk.length - 1) {
      loopsDone += 1;
      await processExchangers(); // loop again
    }
  });
};
