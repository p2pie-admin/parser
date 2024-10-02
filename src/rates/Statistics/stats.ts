import { mylog } from "../../helper";
import { setData, setObject } from "../../redis";
import { ErrorCode, IParsingError, IStats } from "../../types/statistics";

const sendParsingError = (error: IParsingError) => {
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
    unknown: "",
  } as { [key in ErrorCode]: string };

  error.codeExplanation =
    errorCodesExplanation?.[error?.code || "unknown"] || "";
  mylog(
    `${error.exchangerId} ${error.exchangerName} : ${error.code || ""} ${
      error.codeExplanation || error.comment || error.autoMessage
    }`,
    "error"
  );
  setObject(`parsing_errors:${error.exchangerId}`, error);
};

const sendStats = (stats: IStats) => {
  mylog(
    `${stats.exchangerId} ${stats.exchangerName} : ${stats.comment}`,
    "info"
  );
  setObject(`stats:${stats.exchangerId}`, stats);
};

export { sendParsingError, sendStats };
