"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../../db"));
class ErrorCreator {
    constructor(exchangerId, type) {
        this.errorCodesExplanation = {
            "ENOTFOUND": "Соединение не установлено",
            "ECONNREFUSED": "По данному IP:PORT ничто не слушает",
            "ECONNRESET": "Соединение сорвалось",
            "ETIMEDOUT": "Истекло время ожидания",
            "ECONNABORTED": "Соединение сорвалось",
            "CERT_HAS_EXPIRED": "Сертификат устарел",
            "ERR_FR_TOO_MANY_REDIRECTS": "Превышено число перенаправлений",
            "EPERM": "Нет разрешения",
            "307": "Соединение перенаправлено",
            "403": "Соединение запрещено",
            "404": "Страница не найдена",
            "500": "Неизвестная ошибка",
            "503": "Сервер перегружен",
            "522": "Истекло время ожидания",
            "no-rates": "Обменник ответил, но курсы не отдает",
            "json-parsing-error": "Не удалось распарсить XML",
            "data-error": "Курсы обмена некорректны",
            "exchanger-custom-error": "Обменник сообщил об ошибке",
            "unknown-error": "Неизвестная ошибка"
        };
        this.errorDefaultMessage = "Неизвестная ошибка";
        this.saveError = (code = "unknown-error", serverRespMessage) => {
            console.error(`Error! ${this.exchangerId} : ${this.errorCodesExplanation[code]}`);
            db_1.default.push(`.${this.type}.${this.exchangerId}`, {
                code,
                isStatusChanged: false,
                devMessage: this.errorCodesExplanation[code],
                serverRespMessage,
            });
        };
        this.setErrorStatusChanged = (isChanged) => {
            db_1.default.push(`.${this.type}.${this.exchangerId}.isStatusChanged`, isChanged);
        };
        this.deleteError = () => {
            db_1.default.delete(`.${this.type}.${this.exchangerId}`);
        };
        this.exchangerId = exchangerId;
        this.type = type || "errors";
    }
}
exports.default = ErrorCreator;
//# sourceMappingURL=ErrorHandler.js.map