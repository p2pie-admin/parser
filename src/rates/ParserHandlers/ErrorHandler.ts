import db from "../../db";
import callStrapi from "../../gql/callStrapi";
import { updateExchangerStatus } from "../../gql/queries";
import { mylog } from "../../helper";

// export default class ErrorCreator {
//   error: IError;

//   constructor(error: IError) {
//     this.error = error;
//   }

//   errorCodesExplanation = {
//     ENOTFOUND: "Соединение не установлено",
//     ECONNREFUSED: "По данному IP:PORT ничто не слушает",
//     ECONNRESET: "Соединение сорвалось",
//     ETIMEDOUT: "Истекло время ожидания",
//     ECONNABORTED: "Соединение сорвалось",
//     CERT_HAS_EXPIRED: "Сертификат устарел",
//     ERR_FR_TOO_MANY_REDIRECTS: "Превышено число перенаправлений",
//     EPERM: "Нет разрешения",
//     "307": "Соединение перенаправлено",
//     "403": "Соединение запрещено",
//     "404": "Страница не найдена",
//     "500": "Неизвестная ошибка",
//     "503": "Сервер перегружен",
//     "522": "Истекло время ожидания",
//     unknown: "Неизвестная ошибка",
//   } as { [key in ErrorCode]: string };

//   errorDefaultMessage = "Неизвестная ошибка";

//   sendError = async (
//     code: ErrorCode = "unknown",
//     message?: string | undefined
//   ): Promise<void> => {
//     //if (await db.exists(`.${this.type}.${this.exchangerId}`)) return;
//     this.error.autoMessage = this.errorCodesExplanation?.[code] || "Код ошибки: " + code
//     mylog(
//       `˟ ${this.error.exchangerId} ${this.error.exchangerName} : ${

//       }`,
//       "error"
//     );
//     // await db.push(`.${this.type}.${this.exchangerId}`, {
//     //   code,
//     //   devMessage: this.errorCodesExplanation[code],
//     //   message,
//     //   isStatusChanged: false,
//     // } as ExchangerError);

//     if (this.type === "errors") this.lockExchanger(code);
//   };

//   // setErrorStatusChanged = async (isChanged: boolean) => {
//   //   await db.push(
//   //     `.${this.type}.${this.exchangerId}.isStatusChanged`,
//   //     isChanged
//   //   );
//   // };

//   // deleteError = async () => {
//   //   await db.delete(`.${this.type}.${this.exchangerId}`);
//   // };

//   lockExchanger = async (code: ErrorCode) => {
//     const codesToDisable: ErrorCode[] = [
//       "ECONNREFUSED",
//       "EPERM",
//       "404",
//       "403",
//       "unknown-error",
//       "json-parsing-error",
//     ];

//     const status = codesToDisable.find((c) => c === code)
//       ? "disabled"
//       : "suspended";
//   };
// }
