import RatesParser from "./ParserHandlers/RateParser";
import { IExchanger } from "../types/exchanger";
import { getData, getObject } from "../redis";
import { IGeneralData } from "../types/rates";

import { mylog } from "../helper";
import { splitToNChunks, waitSec } from "../loops/helper";
import startWorkers from "../workers";
import { cpus } from "os";

let loopsDone = 0;

export const processExchangers = async () => {
  const pauseBetweenLoops = await getData("parser_setting:pause_between_loops");
  const numCPUs = cpus().length;
  const idx = parseInt(process.env.IDX || "");
  mylog(` • #${idx} core processing...`, "info");
  const exchangers = (await getObject("exchangers")) as {
    [key: string]: IExchanger;
  };

  const chunkedExchangers = splitToNChunks(Object.values(exchangers), numCPUs);
  const exchangersChunk = chunkedExchangers[idx];

  let leftToProcess = exchangersChunk.length;
  const generalData = await prepareGeneralData();

  exchangersChunk.map(async (exchanger, idx) => {
    await new Promise(
      (resolve) => setTimeout(resolve, idx * 333)
      //setTimeout(resolve, idx * pauseBetweenCalls + +(exchanger.pause || 0))
    );
    leftToProcess -= 1;

    if (!leftToProcess) {
      loopsDone += 1;
      await waitSec(pauseBetweenLoops); // чтобы все успели допарситься
      processExchangers();
    }
    if (!exchanger.skip || !(loopsDone % exchanger.skip)) {
      const exchangerParser = new RatesParser(exchanger, generalData);
      exchangerParser.getExchangerRates();
      return;
    }
    mylog(
      ` - #${exchanger.id} ${exchanger.name} will skip ${exchanger.skip} loops`,
      "warning"
    );
  });

  //await wait(5); // чтобы все успели допарситься
};

const prepareGeneralData = async () => {
  // чтобы не обращаться к базе по сто раз
  const dirsDisabled = (await getData(
    "parser_setting:dirs_disabled"
  )) as string;

  const allPmCodesThatExist = (await getData(
    "all_pm_codes_that_exist"
  )) as string[];

  const alternativePmCodes = (await getData(
    "alternative_pm_codes"
  )) as string[][];

  return {
    dirsDisabled,
    allPmCodesThatExist,
    alternativePmCodes,
  } as IGeneralData;
};
