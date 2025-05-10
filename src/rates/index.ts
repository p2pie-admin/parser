import { cpus } from "os";
import { waitSec } from "../loops/helper";
import { getObject } from "../redis";
import { mylog } from "../helper";
import { IExchanger } from "../types/exchanger";

import reload from "../loops/reload";
import { splitArrayToNChunks } from "../loops/helper";
import { processSingleExchanger } from "./exchangerProcessor";
import { prepareGeneralData } from "./generalDataLoader";
import { calculateTops } from "./top";

let loopsDone = 0;

export const processExchangers = async () => {
  const idx = parseInt(process.env.IDX || "0");
  const numCPUs = cpus().length;

  const pause = (await import("../redis"))
    .getData("parser_setting")
    .then((data) => data?.pause_between_loops || 10);

  await waitSec((await pause) / 3);
  await calculateTops(idx, numCPUs);
  await waitSec((await pause) / 3);
  await reload();
  await waitSec((await pause) / 3);

  mylog(` • Core #${idx} starting processing...`, "info");

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
    await new Promise((res) => setTimeout(res, i * 333));
    await processSingleExchanger(exchanger, loopsDone);

    if (i === chunk.length - 1) {
      loopsDone += 1;
      await processExchangers(); // loop again
    }
  });
};
