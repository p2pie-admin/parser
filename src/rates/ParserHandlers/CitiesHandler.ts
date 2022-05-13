
import { RateData } from "src/types/exchangerResp";
import ErrorHandler from "./ErrorHandler";
// import db from "../../db"



export default class CitiesHandler {


    groupRatesDataCities = (exchangerId: string, ratesData: RateData[]): RateData[] => {
        // {... cities: "VRN"} -> {... cities: "VRN/MSK/SPB"}
        try{
          return ratesData.reduce((groupedRatesData: RateData[], rateData: RateData) => {
            const sameDir = groupedRatesData.findIndex((rv) => rv.from._text === rateData.from._text && rv.to._text === rateData.to._text && rateData.city);
                sameDir === -1 
                ? groupedRatesData.push(rateData)
                : groupedRatesData[sameDir].city = {_text: groupedRatesData[sameDir].city?._text + "/" + rateData.city?._text}
          return groupedRatesData;
        }, []);
        }catch(err){
          const exchangerHandler = new ErrorHandler(exchangerId)
          exchangerHandler.saveError("data-error", err.message)
          return []
        }

      };

    formatCities = (cities: string, cityList: {[key: string]: string}) => {
        //  "MSCW/SPB/..." ----> "Russia" : { "Saint-Petersburg", "Moscow"}
        return cities
          .split("/")
          .reduce((accumulator: { [key: string]: string[] }, cityCode: string) => {
            let [city, country] = cityList[cityCode]
              ? cityList[cityCode].split(",")
              : [null, null];
            if (city && country) {
              country = country.replace(" ", "");
              accumulator[country] = accumulator[country]
                ? [...accumulator[country], city]
                : [city];
            }
            return accumulator;
          }, {});
      };


}