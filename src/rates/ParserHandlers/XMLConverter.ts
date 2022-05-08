

import dbRates from "../../dbRates";
import { RateData, ExchangerResponse } from "src/types/exchangerResp";
import { ConvertedDirRates, Rate } from "src/types/rates.json";
import ErrorCreator from "./ErrorCreator"
import CitiesHandler from "./CitiesHandler";
import db from "../../db";

export default class XMLConverter {

    exchangerId: string;

    constructor(exchangerId: string) {
      this.exchangerId = exchangerId
    }

    matchXMLRatesWithDirs = (rates: RateData[]): any => {
     const cityCodes = db.getData(".parser_setting.cities") 
     rates.map(rate => {
        try{
          const dir = `${rate.from._text.toUpperCase()}_${rate.to._text.toUpperCase()}`
          // const min = this.transformLimit(min_amount, +course, dir);
          // const max = this.transformLimit(max_amount, +course, dir);
          // const resv = this.transformLimit(`${reserve} ${dir.split("_")[1]}`, +course, dir);

          const citiesHandler = new CitiesHandler()
          const convertedDirRates = {
            id: this.exchangerId,
            min_fee: rate.minfee?._text,
            from_fee: rate.fromfee?._text,
            to_fee: rate.tofee?._text,
            course: Number(rate.in._text) / Number(rate.out._text),
            // min_amount: Limit;
            // max_amount: Limit;
            // reserve: Limit;
            param: rate.param?._text,
            cities: cityCodes && rate.city?._text ? citiesHandler.formatCities(rate.city?._text, cityCodes) : null
          }
          //return [dir, convertedDirRates]
          dbRates.push(`.allConvertedRates.${dir}[]`, convertedDirRates) // as ConvertedDirRates)
        } catch (err) { 
          const errorCreator = new ErrorCreator(this.exchangerId)
          errorCreator.saveError('unknown-error', err.code)
        }
      })
    }


    checkForErrors = (exchangerResponse: ExchangerResponse | null): boolean => {
       
      const errorCreator = new ErrorCreator(this.exchangerId)
        if(!exchangerResponse) {
          errorCreator.saveError('404')
          return false
        } 
        if(exchangerResponse.error){
          errorCreator.saveError('error-response', exchangerResponse?.error?._text)
          return false
        }
        if(!exchangerResponse.rates){
          errorCreator.saveError('no-rates')
          return false
        }
        return true
    }

}