// rates/exchangerProcessor.ts
import { httpGet } from "./utils/httpClient";
import {
  sendExchangerError,
  sendExchangerWarning,
  sendTotalRates,
} from "./rates/ErrorHandler";
import { parseRatesFromXml } from "./reload/helper";
import { IExchanger, IExchangerParsingError } from "./types/exchanger";
import { IGeneralData } from "./types/rates";
import RateFormatter from "./rates/ParserHandlers/RateFormatter";
import { rand0to10 } from "./utils/helper";
import { mylog } from "./utils/logger";
import statusChange from "./utils/statusChange";
import { setData } from "./utils/redis";
import zlib from "zlib";

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

const computeNextSkip = (currentSkip: number): number => {
  const base = currentSkip > 0 ? currentSkip : 1;
  const candidate = base * 2 + rand0to10();
  return candidate >= MAX_SKIP ? 0 : candidate;
};

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
  if (skip > 1 && loopsDone % skip !== 0) {
    return;
  }

  const start = Date.now();

  const doProcess = async () => {
    const response = await httpGet(exchanger.rates_link);
    const contentEncoding =
      response.headers?.["content-encoding"]?.toLowerCase() || "";

    const decompressResponseBody = (body: any) => {
      if (!contentEncoding || !Buffer.isBuffer(body)) return body;

      try {
        if (contentEncoding.includes("br")) {
          return zlib.brotliDecompressSync(body);
        }
        if (contentEncoding.includes("gzip")) {
          return zlib.gunzipSync(body);
        }
        if (contentEncoding.includes("deflate")) {
          return zlib.inflateSync(body);
        }
      } catch (err: any) {
        mylog(
          `Decompress failed for #${exchanger.id} ${
            exchanger.name || ""
          } | encoding: ${contentEncoding} | ${err?.message || err}`,
          "warning",
          true
        );
      }

      return body;
    };

    const decodedBody = decompressResponseBody(response.data);

    const { rates, errors: parsingErrors } = parseRatesFromXml(decodedBody);

    if (!rates || !rates.length) {
      const preview =
        typeof decodedBody === "string"
          ? decodedBody.slice(0, 200)
          : Buffer.isBuffer(decodedBody)
          ? decodedBody.toString("utf8").slice(0, 200)
          : JSON.stringify(decodedBody ?? "").slice(0, 200);
      const contentType = response.headers?.["content-type"];
      const contentLengthHeader = response.headers?.["content-length"];
      const bodyLength =
        typeof decodedBody === "string"
          ? decodedBody.length
          : Buffer.isBuffer(decodedBody)
          ? decodedBody.byteLength
          : JSON.stringify(decodedBody ?? "").length;
      mylog(
        `no-rates debug #${exchanger.id} ${
          exchanger.name || ""
        } | status: ${response.status} | content-type: ${
          contentType || "?"
        } | content-encoding: ${
          contentEncoding || "-"
        } | content-length(hdr/body): ${
          contentLengthHeader || "?"
        }/${bodyLength} | parsingErrors: ${
          parsingErrors.length ? parsingErrors.join("; ") : "none"
        } | url: ${exchanger.rates_link} | preview: ${preview}...`,
        "warning",
        true
      );
      const nextSkip = computeNextSkip(skip);
      const errorDetails: IExchangerParsingError = {
        code: parsingErrors.length ? "json-parsing-error" : "no-rates",
        autoMessage: parsingErrors.length
          ? `Ошибка парсинга XML/JSON: ${parsingErrors[0]} | preview: ${preview}...`
          : `Ответ обменника не содержит списка курсов | preview: ${preview}...`,
        comment: "Ошибка обработки полученного XML/JSON",
      };
      await sendExchangerError(
        exchanger,
        errorDetails,
        nextSkip
      );
      await statusChange("active", "suspended", exchanger.id);
      await setData(
        `exchanger_stats:${exchanger.id}:status`,
        "suspended",
        Number(process.env.STATUS_CACHE_TTL ?? 60 * 60) || 60 * 60
      );
      return;
    }

    if (parsingErrors.length) {
      const warnings = parsingErrors.map((msg, idxWarn) =>
        sendExchangerWarning(
          exchanger.id,
          `item-${idxWarn + 1}`,
          `Ошибка парсинга XML/JSON: ${msg}`
        )
      );
      await Promise.allSettled(warnings);
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
      const nextSkip = computeNextSkip(skip);
      const error: IExchangerParsingError = {
        code: "ETIMEDOUT",
        autoMessage: err.message,
        comment: "Превышено время обработки обменника",
      };
      await sendExchangerError(
        exchanger,
        error,
        nextSkip,
        time
      );
      return;
    }

    const nextSkip = computeNextSkip(skip);
    const message = err?.message ? String(err.message) : String(err);
    const error: IExchangerParsingError = {
      code: err?.code,
      autoMessage: message,
      comment: "Не удалось получить корректный XML от обменника",
    };
    await sendExchangerError(
      exchanger,
      error,
      nextSkip,
      time
    );
    return;
  }
};
