import db from "../../db";
import { ErrorCode, ExchangerError } from "src/types/exchangerResp"


export default class ErrorCreator {


    exchangerId: string;

    constructor(exchangerId: string) {
      this.exchangerId = exchangerId
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
        "data-error": "Не хватает данных в ответе",
        "exchanger-custom-error": "Обменник сообщил об ошибке",
        "unknown-error": "Неизвестная ошибка"
    } as {[key in ErrorCode]: string}

    
    errorDefaultMessage = "Неизвестная ошибка"

    saveError = (code : ErrorCode | undefined = "unknown-error", serverRespMessage?: string | undefined): void  => {
        console.error(`Error! ${this.exchangerId} : ${this.errorCodesExplanation[code]}`)
        db.push(`.errors.${this.exchangerId}`, {
            code,
            isStatusChanged: false,
            devMessage:  this.errorCodesExplanation[code],
            serverRespMessage,
        } as ExchangerError)
    }

    setErrorStatusChanged = (isChanged: boolean) => {
        db.push(`.errors.${this.exchangerId}.isStatusChanged`, isChanged)
    }

    deleteError = () => {
        db.delete(`.errors.${this.exchangerId}`)
    }

}