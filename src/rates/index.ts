import { cpus } from "os";
import { waitSec } from "../loops/helper";
import { getObject } from "../redis";
import { emoji, mylog } from "../helper";
import { IExchanger } from "../types/exchanger";

import reload from "../loops/reload";
import { splitArrayToNChunks } from "../loops/helper";
import { processSingleExchanger } from "./exchangerProcessor";
import { filterRates } from "./top";

let loopsDone = 0;

export const processExchangers = async () => {
  const idx = parseInt(process.env.IDX || "0");
  const numCPUs = cpus().length;

  const pause = (await import("../redis"))
    .getData("parser_setting")
    .then((data) => data?.pause_between_loops || 10);

  //.....
  await waitSec((await pause) / 3);
  mylog(`${emoji(idx)} Filtering rates..`, "info");
  await filterRates(idx, numCPUs);
  await waitSec((await pause) / 3);
  !idx && reload(); // один раз
  await waitSec((await pause) / 3);
  //.....

  mylog(` • Core ${emoji(idx)} starting processing...`, "info");

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
    await processSingleExchanger(exchanger, loopsDone, idx);

    if (i === chunk.length - 1) {
      loopsDone += 1;
      await processExchangers(); // loop again
    }
  });
};
