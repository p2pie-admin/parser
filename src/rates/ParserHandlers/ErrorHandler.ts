import db from "../../db";
import { ErrorCode, ExchangerError } from "src/types/exchangerResp"


export default class ErrorCreator {


    exchangerId: string;
    type: "errors" | "warnings"

    constructor(exchangerId: string, type?: "errors" | "warnings") {
      this.exchangerId = exchangerId
      this.type = type || "errors"
    }

    errorCodesExplanation = {
        "ENOTFOUND" : "Соединение не установлено",
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
        "no-rates" : "Обменник ответил, но курсы не отдает",
        "json-parsing-error" : "Не удалось распарсить XML",
        "data-error": "Курсы обмена некорректны",
        "exchanger-custom-error": "Обменник сообщил об ошибке",
        "unknown-error": "Неизвестная ошибка"
    } as {[key in ErrorCode]: string}

    
    errorDefaultMessage = "Неизвестная ошибка"

    saveError = (code : ErrorCode | undefined = "unknown-error", serverRespMessage?: string | undefined): void  => {
        console.error(`\u001b[1;31m Error! ${this.exchangerId} : ${this.errorCodesExplanation[code]}`)
        if(db.exists(`.${this.type}.${this.exchangerId}`)) return
        db.push(`.${this.type}.${this.exchangerId}`, {
            code,
            devMessage:  this.errorCodesExplanation[code],
            serverRespMessage,
            isStatusChanged: false
        } as ExchangerError)
    }

    setErrorStatusChanged = (isChanged: boolean) => {
        db.push(`.${this.type}.${this.exchangerId}.isStatusChanged`, isChanged)
    }

    deleteError = () => {
        db.delete(`.${this.type}.${this.exchangerId}`)
    }

}