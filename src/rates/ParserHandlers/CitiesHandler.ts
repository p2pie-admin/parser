import { IRate } from "./../../types/rates";
import { error } from "console";
import { IExchanger, IExchangerParsingError } from "../../types/exchanger";
import { IRateData } from "../../types/exchangerResp";
import { sendExchangerError } from "../ErrorHandler";
import { ICity } from "../../types";

// import db from "../../db"

// changed this

// "VORON": [
//   "Воронеж, Россия",
//   "Voronezh, Russia"
// ],

// to this

// {
//   "closest_cities": ["ANAPA","NOVOR","GDZ"],
//   "coordinates": [45.0003,37.325],
//   "en_country_name": "Russia",
//   "en_name": "Anapa",
//   "preposition": "Анапе",
//   "ru_country_name": "Россия",
//   "ru_name": "Анапа",
//   "population": 0,
//   "codes": ["AAQ","ANP"]
// },

export const convertCityRates = (cityRatesData?: {
  [key: string]: IRateData;
}): { [key: string]: { rate: IRate; city: ICity } } => {
  if (!cityRatesData) return {};
  return Object.entries(cityRatesData).reduce((res, [cityCode, rateData]) => {
    return { ...res, [cityCode]: { rate: rateData, city: cityCode } };
  }, {});
};

export const groupRatesDataCities = (
  exchanger: IExchanger,
  ratesData: IRateData[]
): IRateData[] => {
  //  {... cityCourses: {"MSK": IRateData}}
  try {
    return ratesData.reduce(
      (groupedRatesData: IRateData[], rateData: IRateData) => {
        const sameDir = groupedRatesData.findIndex(
          (rv) =>
            rateData.city &&
            rv.from._text === rateData.from._text &&
            rv.to._text === rateData.to._text
        );
        sameDir === -1
          ? groupedRatesData.push(rateData)
          : (groupedRatesData[sameDir].cityRatesData = {
              ...(groupedRatesData[sameDir]?.cityRatesData || {}),
              [rateData.city?._text.toUpperCase() || "-"]: rateData,
            });
        return groupedRatesData;
      },
      []
    );
  } catch (err) {
    const error = {
      autoMessage: err,
      comment: "Не смог сгруппировать города",
    } as IExchangerParsingError;
    sendExchangerError(exchanger, error);
    //const exchangerHandler = new ErrorHandler(exchangerId);
    //exchangerHandler.sendError("data-error", "couldn't load cities");
    return [];
  }
};
