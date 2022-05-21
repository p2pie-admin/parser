

import { RateData, ExchangerResponse } from "src/types/exchangerResp";
import {  DirRate, Limit } from "src/types/rates.json";
import ErrorHandler from "./ErrorHandler"
import CitiesHandler from "./CitiesHandler";
import db from "../../db";
import dbRates from "../../dbRates";

export default class XMLConverter {

    exchangerId: string;

    constructor(exchangerId: string) {
      this.exchangerId = exchangerId
    }

    transformLimit = (limit: string, course: number, dir: string): Limit => {
      const limitCur = limit.split(" ")[1];
      const limitValue = parseFloat(limit);
      const [givePm, getPm] = dir.split("_");
      const give = givePm.includes(limitCur)
        ? limitValue
        : getPm.includes(limitCur)
        ? limitValue * course
        : 0;
      const get = getPm.includes(limitCur)
        ? limitValue
        : givePm.includes(limitCur)
        ? limitValue / course
        : 0;
      return { give, get };
    };

    matchXMLRatesWithDirs = (rates: RateData[]): void => {
     const cityCodes = db.getData(".parser_setting.cities") as {[key: string]: string}
     const dirs_disabled = db.getData(".parser_setting.dirs_disabled") as string
     const possible_pm_codes = db.getData(".possible_pm_codes") as string[]
     let rateDataError = false

     rates.map(rate => {
        try{
          const dir = `${rate.from._text.toUpperCase()}_${rate.to._text.toUpperCase()}`
          // если хоть одна платежка в dir не из cms, скипаем
          if(!possible_pm_codes.find(code => code === rate.from._text.toUpperCase())) return
          if(!possible_pm_codes.find(code => code === rate.to._text.toUpperCase())) return
          // если запрещенные направления, тоже скипаем
          if(dirs_disabled.split("\n").find(dir_disabled => dir_disabled.toUpperCase() === dir)) return

          const course = +rate.in._text / +rate.out._text   
          const min = this.transformLimit(rate.minamount._text, +course, dir);
          const max = this.transformLimit(rate.maxamount._text, +course, dir);
          const reserve = this.transformLimit(`${rate.amount._text} ${dir.split("_")[1]}`, +course, dir);
          const citiesHandler = new CitiesHandler()
          const cities = Object.keys(cityCodes).length && rate.city?._text && citiesHandler.formatCities(rate.city?._text, cityCodes)

          const dirRate = {
            id: this.exchangerId,
            ...(rate.minfee?._text && parseFloat(rate.minfee?._text) > 0 ? {min_fee: rate.minfee._text} : {}),
            ...(rate.fromfee?._text && parseFloat(rate.fromfee?._text) > 0 ? {from_fee: rate.fromfee._text} : {}),
            ...(rate.tofee?._text && parseFloat(rate.tofee?._text) > 0 ? {to_fee: rate.tofee._text} : {}),
            course,
            min,
            max: max.give > reserve.give ? reserve : max,
            reserve,
            ...(rate.param?._text ? {param: rate.param._text} : {}),
            ...(cities ? {cities} : {}),
          } as DirRate

          dbRates.push(`.dirRates.${dir}[]`, dirRate) // as ConvertedDirRates)

        } catch (err) { 
          rateDataError = true
        }       
      })
      if(rateDataError) {
        const errorHandler = new ErrorHandler(this.exchangerId)
        errorHandler.saveError('data-error', "Данные курсов частично отсутствуют или имеют некорректный формат")
      }   
    }


    checkForErrors = (exchangerResponse: ExchangerResponse | null): boolean => {
       
      const errorHandler = new ErrorHandler(this.exchangerId)
      
      if(!exchangerResponse) {
        errorHandler.saveError('404')
        return false
      } 
      if(exchangerResponse.error){
        errorHandler.saveError("exchanger-custom-error", exchangerResponse?.error?._text)
        return false
      }
      if(!exchangerResponse.rates?.item?.length){
        errorHandler.saveError('no-rates')
        return false
      }
      return true
    }

}