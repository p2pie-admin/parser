// rates/exchangerProcessor.ts
import { httpGet } from "./utils/httpClient";
import { emoji, mylog } from "./utils/logger";
import { sendExchangerError, sendTotalRates } from "./rates/ErrorHandler";
import { waitSec, xmlToJson } from "./reload/helper";
import { IExchanger, IExchangerParsingError } from "./types/exchanger";
import { IGeneralData } from "./types/rates";
import RateFormatter from "./rates/ParserHandlers/RateFormatter";
import { idx } from "./utils/settings";
import { rand0to10 } from "./utils/helper";

const MAX_SKIP = 1200;
const PROCESS_TIMEOUT_MS = Number(process.env.PROCESS_TIMEOUT ?? 100) * 1000;

class ProcessingTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Processing exceeded ${timeoutMs} ms`);
    this.name = "ProcessingTimeoutError";
  }
}

const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> => {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race<T>([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new ProcessingTimeoutError(timeoutMs)),
          timeoutMs
        );
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
};

export const processSingleExchanger = async ({
  exchanger,
  skip,
  loopsDone,
  generalData,
  index,
}: {
  exchanger: IExchanger;
  skip: number;
  loopsDone: number;
  generalData: IGeneralData;
  index: number;
}): Promise<void> => {
  const { id, name } = exchanger;

  //await waitSec(index / 100);

  if (skip > 1 && loopsDone % skip !== 0) {
    return;
  }

  const start = Date.now();

  const doProcess = async () => {
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
  };

  try {
    await withTimeout(doProcess(), PROCESS_TIMEOUT_MS);
  } catch (err: any) {
    const time = ((Date.now() - start) / 1000).toFixed(2);

    if (err instanceof ProcessingTimeoutError) {
      const error: IExchangerParsingError = {
        code: "ETIMEDOUT",
        autoMessage: err.message,
        comment: "Превышено время обработки обменника",
      };
      await sendExchangerError(
        exchanger,
        error,
        Math.min((skip + rand0to10()) * 2, MAX_SKIP),
        time
      );
      return;
    }

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
