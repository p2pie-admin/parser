import { mylog } from "../helper";
import { getData, setData } from "../redis";
import statusChange from "../statusChange";

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
  "500": "Неизвестная ошибка",
  "503": "Сервер перегружен",
  "522": "Истекло время ожидания",
  unknown: "Неизвестная ошибка",
} as { [key in IErrorCode]: string };

export const sendExchangerError = (
  exchanger: IExchanger,
  error: IExchangerParsingError
) => {
  error.codeExplanation = errorCodesExplanation[error.code || "unknown"];
  const { id, name, rates_link } = exchanger;
  mylog(
    ` ˟ #${id} ${name || ""} : ${
      error.code || error.autoMessage?.substring(0, 50) || ""
    } | ${error.codeExplanation} | ${rates_link}`,
    "error"
  );

  if (exchanger.status == "active")
    statusChange("active", "suspended", exchanger.id);
  setData(`exchangers:${id}:error`, error);
  setData(`exchangers:${id}:skip`, +(exchanger.skip || 1) * 2);
};

export const sendExchangerInfo = (
  exchanger: IExchanger,
  total_rates: number
) => {
  const { id, name, rates_link } = exchanger;
  mylog(
    ` ✓ #${id} ${name || ""} : получено ${total_rates} курсов | ${rates_link}`,
    "success"
  );

  if (exchanger.status === "suspended")
    statusChange("suspended", "active", exchanger.id);
  setData(`exchangers:${id}:total_rates`, total_rates);
  !exchanger.skip && setData(`exchangers:${id}:skip`, 0);
};

export const sendExchangerWarning = async (
  exchangerId: string,
  dir: string,
  message: string
) => {
  setData(`exchangers:${exchangerId}:warnings:${dir}`, message, "main", true);
};
