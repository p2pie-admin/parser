import axios from "axios";
import db from "../../db"
import ErrorHandler from "./ErrorHandler";
// import Piscina from 'piscina';
// import {resolve} from "path"
import { ExchangerResponse } from "src/types/exchangerResp";
import CitiesHandler from "./CitiesHandler";
import RateFormatter from "./RateFormatter";
import XML2JSON from "xml-js";
import { Exchanger, ExchangerStatus } from "../../types/exchanger.json";
import { cleanRates } from '../cleaners/cleanRates';

// const pool = new Piscina({
//   filename: resolve(__dirname, "worker.js"),
//   maxQueue: 'auto'
// })

// const afterExchangerParsing = () => {
//   const leftToParse = db.getData(".left_to_parse")
//   db.push(".left_to_parse", leftToParse - 1) 
//   console.log(leftToParse, " left")

//   if(leftToParse <= 0) {
//     finishParsing()
//   }
// }

const convertXMLtoJSON = (errorHandler: ErrorHandler, data: any): ExchangerResponse => {
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

export default class Parser {

  exchangers: {[key: string]: Exchanger};

  constructor(exchangers: {[key: string]: Exchanger}) {
    this.exchangers = exchangers
  }

  _getRate = (exchangerId: string, expireIn: number, rates_link: string ) => {
    axios
    .get(rates_link) 
    .then(function (response) {
      const errorHandler = new ErrorHandler(exchangerId)
      const JSONres = convertXMLtoJSON(errorHandler, response?.data)                   
      const citiesHandler = new CitiesHandler()
      const rateFormatter = new RateFormatter(exchangerId)
      const wereRatesReceived = rateFormatter.checkForErrors(JSONres)
    
      if(wereRatesReceived && JSONres.rates?.item) {
        console.log(`\u001b[1;32m Rates received for: ${exchangerId}`)
        const ratesDataWithGroupedCities = citiesHandler.groupRatesDataCities(exchangerId, JSONres.rates?.item)
        rateFormatter.formatAndMatchRatesWithDirs(ratesDataWithGroupedCities) // пишет в JSОN файл
        db.push(`.exchangers.${exchangerId}.status`, "active")
      }
    })
    .catch(function (err){
      const {message, code, status} = err
      const numberCode = message.match(/\d+/) && message.match(/\d+/)[0]
      const errorHandler = new ErrorHandler(exchangerId)           
      errorHandler.saveError(code || status || numberCode, message)
    })
  }

  _stopOnDataChange = (intervalId: NodeJS.Timer, exchangerId: string, initialStatus: ExchangerStatus) => {
    const {rates_link, status} = db.exists(`.exchangers.${exchangerId}`) ? db.getData(`.exchangers.${exchangerId}`) : {rates_link: "", status: "disabled"}
    if(initialStatus !== status) { // статус изменился
        console.log(`\u001b[1;34m ${exchangerId} changed status from ${initialStatus} to ${status}`)
        clearInterval(intervalId)
        cleanRates(exchangerId)
        status !== "disabled" && this._runExchangerLoop(exchangerId)
        return
    } 
  }

  _runExchangerLoop = (exchangerId: string) => {
    const {rates_link, status} = db.exists(`.exchangers.${exchangerId}`) ? db.getData(`.exchangers.${exchangerId}`) : {rates_link: "", status: "disabled"}
    const timeout = db.getData(".parser_setting.timeout") || 30_000 
    if(status === "disabled") {
      cleanRates(exchangerId)
      return
    } // exit on disabled status
    const exchangerTimeout = status === "active" ? timeout : timeout * (Math.random() * 10 + 20)
    const intervalId = setInterval(() => {
      this._stopOnDataChange(intervalId, exchangerId, status)
      this._getRate(exchangerId, timeout - 2000, rates_link)
    }, exchangerTimeout)

  }

  pollExchangerLinks(gap: number) {
    
    let leftToLoop = Object.keys(this.exchangers).length

      Object.keys(this.exchangers).map(async (exchangerId, n) => {

          await new Promise(resolve => setTimeout(resolve, n * gap)); 
          // промежутки во времени между ∞ циклами четверть секунды
          console.log(`${exchangerId} requested, ${leftToLoop} left`)
          leftToLoop -= 1
        ////////////////////////////////////////////////////////////////////////////////////////
          this._runExchangerLoop(exchangerId)
        /////////////////////////////////////////////////////////////////////////////////////////
      } // время рестарта либо из CMS либо 30 сек
  )
  

  }
}



