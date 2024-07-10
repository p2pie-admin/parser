import { RateData } from "../../types/exchangerResp";
import ErrorHandler from "./ErrorHandler";
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

export default class CitiesHandler {
  groupRatesDataCities = (
    exchangerId: string,
    ratesData: RateData[]
  ): RateData[] => {
    console.log(
      "ratesData",
      ratesData.filter((d) => d.city)
    );
    // {... cities: "VRN"} -> {... cities: "VRN/MSK/SPB"}
    try {
      return ratesData.reduce(
        (groupedRatesData: RateData[], rateData: RateData) => {
          const sameDir = groupedRatesData.findIndex(
            (rv) =>
              rv.from._text === rateData.from._text &&
              rv.to._text === rateData.to._text &&
              rateData.city
          );
          sameDir === -1
            ? groupedRatesData.push(rateData)
            : (groupedRatesData[sameDir].city = {
                _text:
                  groupedRatesData[sameDir].city?._text +
                  "/" +
                  rateData.city?._text,
              });
          return groupedRatesData;
        },
        []
      );
    } catch (err) {
      const exchangerHandler = new ErrorHandler(exchangerId);
      exchangerHandler.saveError("data-error", "couldn't load cities");
      return [];
    }
  };
}

//     //  "MSCW/SPB/..." ----> "Russia" : { "Saint-Petersburg", "Moscow"}
//   formatCities = (
//     languageIndex: number,
//     cities: string,
//     cityList: { [key: string]: string[] }
//   ) => {
//     return cities
//       .split("/")
//       .reduce((accumulator: { [key: string]: string[] }, cityCode: string) => {
//         let [city, country] = cityList[cityCode]
//           ? cityList[cityCode][languageIndex].split(",")
//           : [null, null];
//         if (city && country) {
//           country = country.replace(" ", "");
//           accumulator[country] = accumulator[country]
//             ? [...accumulator[country], city]
//             : [city];
//         }
//         return accumulator;
//       }, {});
//   };
// }
