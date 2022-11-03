"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../../db"));
const callStrapi_1 = __importDefault(require("../../gql/callStrapi"));
const queries_1 = require("../../gql/queries");
class ErrorCreator {
    constructor(exchangerId, type) {
        this.errorCodesExplanation = {
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
        };
        this.errorDefaultMessage = "Неизвестная ошибка";
        this.saveError = (code = "unknown-error", serverRespMessage) => {
            console.error(`\u001b[1;31m ˟ ${this.exchangerId} : ${this.errorCodesExplanation[code] || "Код ошибки: " + code}`);
            db_1.default.push(`.${this.type}.${this.exchangerId}`, {
                code,
                devMessage: this.errorCodesExplanation[code],
                serverRespMessage,
                isStatusChanged: false,
            });
            if (this.type === "errors")
                this.lockExchanger(code);
        };
        this.setErrorStatusChanged = (isChanged) => {
            db_1.default.push(`.${this.type}.${this.exchangerId}.isStatusChanged`, isChanged);
        };
        this.deleteError = () => {
            db_1.default.delete(`.${this.type}.${this.exchangerId}`);
        };
        this.lockExchanger = (code) => {
            const codesToDisable = [
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
            (0, callStrapi_1.default)(queries_1.LockExchangerMutation, {
                exchangerId: this.exchangerId,
                status,
            });
            try {
                db_1.default.push(`.looped.${this.exchangerId}`, false);
                db_1.default.push(`.errors.${this.exchangerId}.isStatusChanged`, true);
                db_1.default.delete(`.exchangers.${this.exchangerId}`);
                return;
            }
            catch (err) {
                console.error("Exchanger locker failed: ", this.exchangerId, err || "");
                return;
            }
        };
        this.exchangerId = exchangerId;
        this.type = type || "errors";
    }
}
exports.default = ErrorCreator;
//# sourceMappingURL=ErrorHandler.js.map