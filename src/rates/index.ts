import RatesParser from "./ParserHandlers/RateParser";
import { IExchanger } from "../types/exchanger";
import { getData, getObject, setObject } from "../redis";
import { IAllDirsRates, IGeneralData } from "../types/rates";

import { logMemoryUsage, mylog } from "../helper";
import {
  splitArrayToNChunks,
  splitObjectToNChunks,
  waitSec,
} from "../loops/helper";
import { cpus } from "os";
import { memoryUsage } from "process";
import { ICity, IParserSetting } from "../types";
import getAllDirTops from "./Tops";
import reload from "../loops/reload";

let loopsDone = 0;

export const processExchangers = async () => {
  const pauseBetweenLoops =
    (await getData("parser_setting"))?.pause_between_loops || 10;
  const numCPUs = cpus().length;
  const idx = parseInt(process.env.IDX || "");
  //if (idx) return; // вылючатель остальных ядер для теста
  mylog(` • #${idx} core processing...`, "info");
  const exchangers = (await getObject("exchangers")) as {
    [key: string]: IExchanger;
  };
  if (!exchangers || !Object.keys(exchangers || {}).length) {
    mylog(`No exchangers found!`, "error");
    await waitSec(30);
    return;
  }

  const chunkedExchangers = splitArrayToNChunks(
    Object.values(exchangers),
    numCPUs
  );
  const exchangersChunk = chunkedExchangers[idx];

  let leftToProcess = exchangersChunk.length;
  const generalData = await prepareGeneralData();

  exchangersChunk.map(async (exchanger, i) => {
    await new Promise((resolve) => setTimeout(resolve, i * 333));
    leftToProcess -= 1;

    if (!leftToProcess) {
      // finished
      loopsDone += 1;
      // чтобы все успели допарситься

      await waitSec(pauseBetweenLoops);
      await calculateTops(idx, numCPUs);
      await reload();
      await processExchangers();
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
};

const prepareGeneralData = async () => {
  // чтобы не обращаться к базе по сто раз
  const dirsDisabled =
    (await getData("parser_setting"))?.dirs_disabled || ("" as string);

  const allPmCodesThatExist = (await getData(
    "all_pm_codes_that_exist"
  )) as string[];

  const alternativePmCodes = (await getData(
    "alternative_pm_codes"
  )) as string[][];

  const cities = (await getData("parser_setting"))?.cities || ([] as ICity[]);

  return {
    dirsDisabled,
    allPmCodesThatExist,
    alternativePmCodes,
    cities,
  } as IGeneralData;
};

const calculateTops = async (idx: number, numCPUs: number) => {
  !idx && logMemoryUsage();
  const allDirRates = (await getObject("allDirRates")) as IAllDirsRates;
  const parserSetting = (await getData("parser_setting")) as IParserSetting;

  if (!parserSetting) {
    mylog("Error loading parser settings", "error");
    return;
  }

  if (!allDirRates || !Object.keys(allDirRates || {}).length) {
    mylog("No rates found", "error");
    return;
  }

  const chunks = splitObjectToNChunks(allDirRates, numCPUs);
  mylog(`#${idx} Total dirs: ${Object.keys(chunks[idx]).length}`, "important");
  mylog("Calculating top rates... ", "important");
  const newDirTops = await getAllDirTops(chunks[idx], parserSetting);
  const prevDirTops = !idx ? {} : ((await getObject("allDirTops")) as any);
  setObject("allDirTops", { ...prevDirTops, ...newDirTops });
};
