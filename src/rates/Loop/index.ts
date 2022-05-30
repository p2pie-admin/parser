import axios from "axios";
import db from "../../db"
import XML2JSON from "xml-js";
import { ExchangerStatus } from "../../types/exchanger";
import statusChange from "../../dbRates/statusChange";
import dbRates from "../../dbRates";
import { AllDirsRates } from "src/types/rates";
import ErrorHandler from "../ParserHandlers/ErrorHandler";
import CitiesHandler from "../ParserHandlers/CitiesHandler";
import RateFormatter from "../ParserHandlers/RateFormatter";
import { ExchangerResponse } from "src/types/exchangerResp";


export default class Loop {

    exchangerId: string;
    rates_link: string;

    constructor(exchangerId: string, rates_link: string){
        this.exchangerId = exchangerId
        this.rates_link = rates_link
    }

    _getRate = (expireIn: number) => {
        const exchangerId = this.exchangerId // хз как this передать в then()
        const start = new Date().getTime();
        axios
        .get(this.rates_link, {timeout: expireIn}) 
        .then(function (response) {
            const errorHandler = new ErrorHandler(exchangerId)
            const JSONres = xmlToJson(errorHandler, response?.data)                   
            const citiesHandler = new CitiesHandler()
            const rateFormatter = new RateFormatter(exchangerId)
            const wereRatesReceived = rateFormatter.checkForErrors(JSONres)
      
            if(wereRatesReceived && JSONres.rates?.item) {
            //status === "suspended" && statusChange("suspended", "active", exchangerId)
            console.log(`\u001b[1;32m ✔ ${exchangerId} : Курсы получены ${JSONres.rates?.item.length}`)
            const ratesDataWithGroupedCities = citiesHandler.groupRatesDataCities(exchangerId, JSONres.rates?.item)
            rateFormatter.formatAndMatchRatesWithDirs(ratesDataWithGroupedCities) // пишет в JSОN файл
            }
        })
        .catch(function (err){
            const {message, code, status} = err
            const numberCode = message.match(/\d+/) && message.match(/\d+/)[0]
            const errorHandler = new ErrorHandler(exchangerId)           
            errorHandler.saveError(code || status || numberCode, message)
            const end = new Date().getTime();
            const time = end - start;
            console.log('Execution time: ' + time);
        })
    }

    _validateInterval = (intervalId: NodeJS.Timer) => {
        
        if(!db.exists(`.exchangers.${this.exchangerId}`)) {
          // либо потому что автоматом сменился статус, либо вручную
            console.log(`\u001b[1;34m ⓘ ${this.exchangerId} : перестанет опрашиваться!`)
            clearInterval(intervalId)
            this._clearAllAssociatedRates()
        } 
    }

    _clearAllAssociatedRates = () => {
        const allDirsRates = dbRates.getData(".allDirsRates") as AllDirsRates
        Object.entries(allDirsRates).map(([_, dirRates]) => delete dirRates[this.exchangerId])
        dbRates.push(".dirRates", allDirsRates)
    }

    run = () => {
        // ВЫПОЛНЯЕТСЯ ОДИН РАЗ, exchanger точно существует и active
        const timeout = db.getData(".parser_setting.timeout") || 30_000 
        // забираем timeout каждый раз заново, чтобы подхватить изменения
        db.push(`.exchangers.${this.exchangerId}.isLooped`, true)
        // единственный способ узнать опрашивается ли обменник

        //const exchangerTimeout = status === "active" ? timeout : timeout * +(Math.random() * 10 + 10).toFixed(1) // x10 to x20 pause
        const intervalId = setInterval(() => {
          this._validateInterval(intervalId)
          this._getRate(timeout - 2000)
        }, timeout)
    } 
}
/////////////// + helper: 

const xmlToJson = (errorHandler: ErrorHandler, data: any): ExchangerResponse => {
    const options = {
      compact: true,
      ignoreComment: true,
      alwaysChildren: true,
    }; 
    let res = {} as ExchangerResponse
    try{
      res = JSON.parse(XML2JSON.xml2json(data, options)) as ExchangerResponse
    }catch({message}){
      errorHandler.saveError("json-parsing-error", message)
    }
    return res
}