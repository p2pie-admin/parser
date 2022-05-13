

import { RateData, ExchangerResponse } from "src/types/exchangerResp";
import { ConvertedDirRates, Limit, Rate } from "src/types/rates.json";
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

    matchXMLRatesWithDirs = (rates: RateData[]): any => {
     const cityCodes = db.getData(".parser_setting.cities") 
     let rateDataError = false
     rates.map(rate => {
        try{
          const dir = `${rate.from._text.toUpperCase()}_${rate.to._text.toUpperCase()}`
          const course = Number(rate.in._text) / Number(rate.out._text)
          const min = this.transformLimit(rate.minamount._text, +course, dir);
          const max = this.transformLimit(rate.maxamount._text, +course, dir);
          const reserve = this.transformLimit(`${rate.amount._text} ${dir.split("_")[1]}`, +course, dir);

          const citiesHandler = new CitiesHandler()
          
          const convertedDirRates = {
            id: this.exchangerId,
            min_fee: rate.minfee?._text,
            from_fee: rate.fromfee?._text,
            to_fee: rate.tofee?._text,
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