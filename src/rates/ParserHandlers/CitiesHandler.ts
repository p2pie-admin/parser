import { IRate } from "./../../types/rates";
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

export const groupRatesDataCities = async (
  exchanger: IExchanger,
  ratesData: IRateData[]
): Promise<IRateData[]> => {
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
  } catch (_) {
    const error = {
      autoMessage: "",
      comment: "Не смог сгруппировать города",
    } as IExchangerParsingError;
    await sendExchangerError(exchanger, error);
    //const exchangerHandler = new ErrorHandler(exchangerId);
    //exchangerHandler.sendError("data-error", "couldn't load cities");
    return [];
  }
};

export const cityCodeToCity = (
  cityCode: string,
  cities: ICity[]
): ICity | undefined =>
  cities.find((c) => c.codes[0] == cityCode || c.codes[1] == cityCode);
