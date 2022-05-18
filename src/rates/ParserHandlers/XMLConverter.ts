

import { RateData, ExchangerResponse } from "src/types/exchangerResp";
import {  Limit } from "src/types/rates.json";
import ErrorHandler from "./ErrorHandler"
import CitiesHandler from "./CitiesHandler";
import db from "../../db";
import dbRates from "../../dbRates";

export default class XMLConverter {

    exchangerId: string;

    constructor(exchangerId: string) {
      this.exchangerId = exchangerId
    }

    transformLimit = (limit: string | undefined, course: number, dir: string): Limit => {
      if(!limit) return { give: 0, get: 0 }
      const limitCur = limit.split(" ")[1];
      const limitValue = parseFloat(limit);
      const [givePm, getPm] = dir.split("_");
      console.log("givePm ", givePm)
      console.log("getPm ", getPm)
      console.log("limitValue ", limitValue)
      console.log("course ", course);
      
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

          const course = Number(rate.in._text) / Number(rate.out._text)    
          const [min_fee, from_fee, to_fee, min, max] = ["minfee", "fromfee", "tofee", "min", "max"]
            .map((limit) => this.transformLimit(rate[limit as keyof RateData]?._text, +course, dir))

          const reserve = this.transformLimit(`${rate.amount._text} ${dir.split("_")[1]}`, +course, dir);
          const citiesHandler = new CitiesHandler()
          
          const convertedDirRates = {
            id: this.exchangerId,
            min_fee,
            from_fee,
            to_fee,
            course,
            min,
            max,
            reserve,
            param: rate.param?._text,
            cities: cityCodes && rate.city?._text ? citiesHandler.formatCities(rate.city?._text, cityCodes) : null
          }
          //return [dir, convertedDirRates]
          dbRates.push(`.allConvertedRates.${dir}[]`, convertedDirRates) // as ConvertedDirRates)
        } catch (err) { 
          rateDataError = true
        }       
      })
      if(rateDataError) {
        const errorHandler = new ErrorHandler(this.exchangerId)
        errorHandler.saveError('data-error')
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