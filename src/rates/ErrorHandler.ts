import { emoji, mylog } from "../utils/logger";
import { setData } from "../utils/redis";

import {
  IErrorCode,
  IExchanger,
  IExchangerParsingError,
  IExchangerParsingInfo,
} from "../types/exchanger";

const errorCodesExplanation = {
  ENOTFOUND: "Соединение не установлено",
  ECONNREFUSED: "По данному IP:PORT ничто не слушает",
  ECONNRESET: "Соединение сорвалось",
  ETIMEDOUT: "Истекло время ожидания",
  ECONNABORTED: "Соединение сорвалось",
  CERT_HAS_EXPIRED: "Сертификат устарел",
  ERR_FR_TOO_MANY_REDIRECTS: "Превышено число перенаправлений",
  EPERM: "Нет разрешения",
  "307": "Соединение перенаправлено",
  "403": "Соединение запрещено",
  "404": "Страница не найдена",
  "500": "Ошибка сервера",
  "503": "Сервер перегружен",
  "522": "Истекло время ожидания",
  unknown: "⦿",
} as { [key in IErrorCode]: string };

const parseDurationSeconds = (time?: string | number): number | null => {
  if (typeof time === "number" && Number.isFinite(time)) {
    return time;
  }
  if (typeof time === "string") {
    const numeric = Number(time);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }
  return null;
};

export const sendExchangerError = async (
  exchanger: IExchanger,
  error?: IExchangerParsingError,
  nextSkipOverride?: number,
  time?: string
) => {
  const idx = parseInt(process.env.IDX || "0");
  const skipKey = `exchanger_stats:${exchanger.id}:skip`;
  const durationSeconds = parseDurationSeconds(time);

  if (!error) {
    await setData(`exchanger_stats:${exchanger.id}:error`, {});
    if (typeof nextSkipOverride === "number") {
      await setData(skipKey, nextSkipOverride);
    }
    if (durationSeconds !== null) {
      await setData(`exchanger_stats:${exchanger.id}:time`, durationSeconds);
    }
    return;
  }

  error.codeExplanation = errorCodesExplanation[error.code || "unknown"];
  const { id, name, rates_link } = exchanger;
  const timeSuffix = typeof time === "string" ? ` | time: ${time}s` : "";

  mylog(
    ` ˟ ${emoji(idx)} #${id} ${name || ""} : ${
      error.code || error.autoMessage?.substring(0, 50) || ""
    } | ${error.codeExplanation} | ${rates_link}${timeSuffix}`,
    "error",
    true
  );

  await setData(`exchanger_stats:${id}:error`, error);
  if (durationSeconds !== null) {
    await setData(`exchanger_stats:${id}:time`, durationSeconds);
  }

  if (typeof nextSkipOverride === "number") {
    await setData(skipKey, nextSkipOverride);
  }
};

export const sendTotalRates = async (
  exchanger: IExchanger,
  total_rates: number,
  time: string
) => {
  const idx = parseInt(process.env.IDX || "0");
  const { id, name, rates_link } = exchanger;
  mylog(
    ` ✓ ${emoji(idx)} #${id} ${
      name || ""
    } : received ${total_rates} rates | ${rates_link} | time: ${time || "?"}s`,
    "success",
    true
  );

  // if (exchanger.status === "suspended")
  //   statusChange("suspended", "active", exchanger.id);
  await setData(`exchanger_stats:${id}:total_rates`, total_rates);
  const durationSeconds = parseDurationSeconds(time);
  if (durationSeconds !== null) {
    await setData(`exchanger_stats:${id}:time`, durationSeconds);
  }
};

export const sendExchangerWarning = async (
  exchangerId: string,
  dir: string,
  message: string
) => {
  await setData(`exchanger_stats:${exchangerId}:warnings:${dir}`, message);
};
