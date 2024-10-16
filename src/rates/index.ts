import RatesParser from "./ParserHandlers/RateParser";
import { IExchanger } from "../types/exchanger";
import { getData } from "../redis";
import { IGeneralData } from "../types/rates";
import { wait } from "../loops/helper";

export const processExchangers = async (exchangersChunk: IExchanger[]) => {
  // const pauseBetweenLoops = await getData("parser_setting:pause_between_loops"); // sec
  // const pauseBetweenCalls = +(
  //   +pauseBetweenLoops / exchangersChunk.length
  // ).toFixed(3);
  // const pause = pauseBetweenCalls < 0.2 ? 200 : pauseBetweenCalls * 1000;

  // mylog(
  //   `--- Cycle time: ${pauseBetweenLoops}s with ${pause}s pause ---`,
  //   "info"
  // );

  const generalData = await prepareGeneralData();

  exchangersChunk.map(async (exchanger, idx) => {
    const pause = exchanger?.pause || 200;
    await new Promise((resolve) => setTimeout(resolve, idx * pause));
    const exchangerParser = new RatesParser(exchanger, generalData);
    exchangerParser.getExchangerRates();
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
