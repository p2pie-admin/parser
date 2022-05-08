import dbRates from "../../dbRates";
import { ErrorCode, ExchangerError } from "src/types/exchangerResp"


export default class ErrorCreator {


    exchangerId: string;

    constructor(exchangerId: string) {
      this.exchangerId = exchangerId
    }

    errorCodesExplanation = {
        "404" : "Не получилось достучаться до обменника",
        "data-error": "Не хватает данных в ответе",
        "error-response" : "Обменник ответил ошибкой",
        "no-rates" : "Обменник ответил, но курсы не отдает",
        "no-permission" : "Нет разрешения на получение курсов",
        "unknown-error": "Неизвестная ошибка"
    } as {[key in ErrorCode]: string}
    
    errorDefaultMessage = "Неизвестная ошибка"

    saveError = (code: ErrorCode, serverRespMessage?: string | undefined): void  => {
        console.error(`Error! ${this.exchangerId} : ${this.errorCodesExplanation[code]}`)
        dbRates.push(`.errors.${this.exchangerId}`, {
            devMessage:  this.errorCodesExplanation[code] || this.errorDefaultMessage,
            serverRespMessage,
        } as ExchangerError)
    }

}