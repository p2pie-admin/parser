// rates/exchangerProcessor.ts
import { httpGet } from "./utils/httpClient";
import { emoji, mylog } from "./utils/logger";
import { sendExchangerError, sendTotalRates } from "./rates/ErrorHandler";
import { xmlToJson } from "./reload/helper";
import { IExchanger, IExchangerParsingError } from "./types/exchanger";
import { IGeneralData } from "./types/rates";
import RateFormatter from "./rates/ParserHandlers/RateFormatter";
import { idx } from "./utils/settings";
import { rand0to10 } from "./utils/helper";

const MAX_SKIP = 1200;

export const processSingleExchanger = async ({
  exchanger,
  skip,
  loopsDone,
  generalData,
}: {
  exchanger: IExchanger;
  skip: number;
  loopsDone: number;
  generalData: IGeneralData;
}): Promise<void> => {
  const { id, name } = exchanger;

  if (skip > 1 && loopsDone % skip !== 0) {
    mylog(` ~ ${emoji(idx)}  ${name} skipping`, "warning");
    return;
  }

  const start = Date.now();

  try {
    const response = await httpGet(exchanger.rates_link);

    const parsed = xmlToJson(response.data);
    const rates = parsed?.rates?.item;

    if (!rates || !rates.length) {
      sendExchangerError(
        exchanger,
        { comment: "Ошибка обработки полученного XML/JSON" },
        (skip || 0) + rand0to10() * rand0to10()
      );
      return;
    }

    const rateFormatter = new RateFormatter(
      exchanger,
      generalData,
      generalData.cities
    );

    await rateFormatter.formatAndMatchRatesWithDirs(rates);

    const time = ((Date.now() - start) / 1000).toFixed(2);
    await sendTotalRates(exchanger, rates.length, time);
    await sendExchangerError(exchanger, undefined, 0, time); // обнуляем скип и ошибку
  } catch (err: any) {
    const time = ((Date.now() - start) / 1000).toFixed(2);
    const message = err?.message ? String(err.message) : String(err);

    const error: IExchangerParsingError = {
      code: err?.code,
      autoMessage: message,
      comment: "Не удалось получить корректный XML от обменника",
    };
    await sendExchangerError(
      exchanger,
      error,
      Math.min(skip * 2, MAX_SKIP) + rand0to10(),
      time
    );
    return;
  }
};
