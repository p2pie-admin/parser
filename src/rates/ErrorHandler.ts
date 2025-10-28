import { emoji, mylog } from "../utils/logger.ts";
import { getData, setData } from "../utils/redis";
import statusChange from "../utils/statusChange";

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

export const sendExchangerError = async (
  exchanger: IExchanger,
  error?: IExchangerParsingError
) => {
  const idx = parseInt(process.env.IDX || "0");

  if (!error) {
    await setData(`exchanger_stats:${exchanger.id}:error`, {});
    return;
  }

  error.codeExplanation = errorCodesExplanation[error.code || "unknown"];
  const { id, name, rates_link } = exchanger;

  mylog(
    ` ˟ ${emoji(idx)} #${id} ${name || ""} : ${
      error.code || error.autoMessage?.substring(0, 50) || ""
    } | ${error.codeExplanation} | ${rates_link}`,
    "error"
  );

  await setData(`exchanger_stats:${id}:error`, error);

  // --- 👇 Новая логика подсчета скипов ---
  const prevSkipRaw = await getData(`exchanger_stats:${id}:skip`);
  const prevSkip = Number(prevSkipRaw) || 0;

  // если обменник уже не первый раз падает — приумножаем экспоненциально
  // но ограничиваем максимумом, чтобы не уходило в бесконечность
  const nextSkip = Math.min(
    prevSkip > 0 ? prevSkip * 2 : (exchanger.skip || 1) * 2,
    64
  );

  await setData(`exchanger_stats:${id}:skip`, nextSkip);
};

export const sendExchangerInfo = (
  exchanger: IExchanger,
  total_rates: number
) => {
  const idx = parseInt(process.env.IDX || "0");
  const { id, name, rates_link } = exchanger;
  mylog(
    ` ✓ ${emoji(idx)} #${id} ${
      name || ""
    } : получено ${total_rates} курсов | ${rates_link}`,
    "success"
  );

  // if (exchanger.status === "suspended")
  //   statusChange("suspended", "active", exchanger.id);
  setData(`exchanger_stats:${id}:total_rates`, total_rates);
  setData(`exchanger_stats:${id}:skip`, 0);
};

export const sendExchangerWarning = async (
  exchangerId: string,
  dir: string,
  message: string
) => {
  setData(
    `exchanger_stats:${exchangerId}:warnings:${dir}`,
    message,
    "main",
    true
  );
};
