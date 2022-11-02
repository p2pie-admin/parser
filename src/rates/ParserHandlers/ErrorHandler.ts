import db from "../../db";
import { ErrorCode, ExchangerError } from "../../types/exchangerResp";
import { gql, GraphQLClient } from "graphql-request";
import { ErrorTypes } from "../../types";
import callStrapi from "../../gql/callStrapi";
import { LockExchangerMutation } from "../../gql/queries";

export default class ErrorCreator {
  exchangerId: string;
  type: ErrorTypes;

  constructor(exchangerId: string, type?: ErrorTypes) {
    this.exchangerId = exchangerId;
    this.type = type || "errors";
  }

  errorCodesExplanation = {
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
    "no-rates": "Обменник ответил, но курсы не отдает",
    "json-parsing-error": "Не удалось распарсить XML",
    "data-error": "Найден некорректный курс",
    "exchanger-custom-error": "Обменник сообщил об ошибке",
    "unknown-error": "Неизвестная ошибка",
  } as { [key in ErrorCode]: string };

  errorDefaultMessage = "Неизвестная ошибка";

  saveError = (
    code: ErrorCode | undefined = "unknown-error",
    serverRespMessage?: string | undefined
  ): void => {
    //if (db.exists(`.${this.type}.${this.exchangerId}`)) return;

    console.error(
      `\u001b[1;31m ˟ ${this.exchangerId} : ${
        this.errorCodesExplanation[code] || "Код ошибки: " + code
      }`
    );
    db.push(`.${this.type}.${this.exchangerId}`, {
      code,
      devMessage: this.errorCodesExplanation[code],
      serverRespMessage,
      isStatusChanged: false,
    } as ExchangerError);

    if (this.type === "errors") this.lockExchanger(code);
  };

  setErrorStatusChanged = (isChanged: boolean) => {
    db.push(`.${this.type}.${this.exchangerId}.isStatusChanged`, isChanged);
  };

  deleteError = () => {
    db.delete(`.${this.type}.${this.exchangerId}`);
  };

  lockExchanger = (code: ErrorCode) => {
    const mutation = gql`
      mutation UpdateExchangerStatus(
        $exchangerId: ID!
        $status: ENUM_EXCHANGER_STATUS
      ) {
        updateExchanger(id: $exchangerId, data: { status: $status }) {
          data {
            id
          }
        }
      }
    `;

    const codesToDisable: ErrorCode[] = [
      "ECONNREFUSED",
      "EPERM",
      "404",
      "403",
      "unknown-error",
      "json-parsing-error",
    ];

    const status = codesToDisable.find((c) => c === code)
      ? "disabled"
      : "suspended";

    callStrapi(LockExchangerMutation, {
      exchangerId: this.exchangerId,
      status,
    });

    try {
      db.push(`.looped.${this.exchangerId}`, false);
      db.push(`.errors.${this.exchangerId}.isStatusChanged`, true);
      db.delete(`.exchangers.${this.exchangerId}`);

      return;
    } catch (err) {
      console.error("Exchanger locker failed: ", this.exchangerId, err || "");
      return;
    }
  };
}
