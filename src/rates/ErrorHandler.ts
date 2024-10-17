import { mylog } from "../helper";
import { getData, setData } from "../redis";

import {
  IErrorCode,
  IExchanger,
  IExchangerParsingError,
  IExchangerParsingInfo,
  IRateWarning,
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
  // 10min if nothing special and 2h if 404
  setData(`exchangers:${id}:error`, error);
  setData(`exchangers:${id}:skip`, +(exchanger.skip || 1) * 2);
};

export const sendExchangerInfo = (
  exchanger: IExchanger,
  info: IExchangerParsingInfo
) => {
  const { id, name, rates_link } = exchanger;
  mylog(
    ` ✓ #${id} ${name || ""} : got ${info.rates} rates | ${rates_link}`,
    "success"
  );
  setData(`exchangers:${id}:info`, info);
  !exchanger.skip && setData(`exchangers:${id}:skip`, 0);
};

export const sendExchangerWarnings = async (
  exchanger: IExchanger,
  warnings: IRateWarning[]
) => {
  const oldWarnings = (await getData(
    `exchangers:${exchanger.id}:warnings`
  )) as IRateWarning[];
  const newWarnings = [...oldWarnings, warnings];
  setData(`exchangers:${exchanger.id}:warnings`, newWarnings);
};
