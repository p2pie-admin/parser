"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dbRates_1 = __importDefault(require("../../dbRates"));
class ErrorCreator {
    constructor(exchangerId) {
        this.errorCodesExplanation = {
            "404": "Не получилось достучаться до обменника",
            "data-error": "Не хватает данных в ответе",
            "error-response": "Обменник ответил ошибкой",
            "no-rates": "Обменник ответил, но курсы не отдает",
            "no-permission": "Нет разрешения на получение курсов",
            "unknown-error": "Неизвестная ошибка"
        };
        this.errorDefaultMessage = "Неизвестная ошибка";
        this.saveError = (code, serverRespMessage) => {
            console.error(`Error! ${this.exchangerId} : ${this.errorCodesExplanation[code]}`);
            dbRates_1.default.push(`.errors.${this.exchangerId}`, {
                devMessage: this.errorCodesExplanation[code] || this.errorDefaultMessage,
                serverRespMessage,
            });
        };
        this.exchangerId = exchangerId;
    }
}
exports.default = ErrorCreator;
//# sourceMappingURL=ErrorCreator.js.map