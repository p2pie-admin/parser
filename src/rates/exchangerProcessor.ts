import { setData } from "../redis";
import { emoji, mylog } from "../helper";
import RatesParser from "./ParserHandlers/RateParser";
import { IExchanger } from "../types/exchanger";
import { IGeneralData } from "../types/rates";
import { prepareGeneralData } from "./generalDataLoader";

/**
 * Processes one exchanger: skip logic, parsing, logging
 */
export const processSingleExchanger = async (
  exchanger: IExchanger,
  loopsDone: number,
  idx: number
) => {
  const generalData = await prepareGeneralData();
  const shouldSkip = exchanger.skip && loopsDone % exchanger.skip !== 0;

  if (exchanger.skip && exchanger.skip > 1024) {
    setData(`exchangers:${exchanger.id}:skip`, 0);
  }

  if (shouldSkip) {
    mylog(
      ` ${emoji(idx)} #${exchanger.id} ${exchanger.name} will skip ${
        exchanger.skip
      } loops`,
      "warning"
    );
    return;
  }

  const parser = new RatesParser(exchanger, generalData);
  parser.getExchangerRates();
};
