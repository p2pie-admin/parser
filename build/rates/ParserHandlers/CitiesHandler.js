"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cityCodeToCity = exports.groupRatesDataCities = void 0;
const ErrorHandler_1 = require("../ErrorHandler");
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
const groupRatesDataCities = (exchanger, ratesData) => {
    //  {... cityCourses: {"MSK": IRateData}}
    try {
        return ratesData.reduce((groupedRatesData, rateData) => {
            const sameDir = groupedRatesData.findIndex((rv) => rateData.city &&
                rv.from._text === rateData.from._text &&
                rv.to._text === rateData.to._text);
            sameDir === -1
                ? groupedRatesData.push(rateData)
                : (groupedRatesData[sameDir].cityRatesData = {
                    ...(groupedRatesData[sameDir]?.cityRatesData || {}),
                    [rateData.city?._text.toUpperCase() || "-"]: rateData,
                });
            return groupedRatesData;
        }, []);
    }
    catch (_) {
        const error = {
            autoMessage: "",
            comment: "Не смог сгруппировать города",
        };
        (0, ErrorHandler_1.sendExchangerError)(exchanger, error);
        //const exchangerHandler = new ErrorHandler(exchangerId);
        //exchangerHandler.sendError("data-error", "couldn't load cities");
        return [];
    }
};
exports.groupRatesDataCities = groupRatesDataCities;
const cityCodeToCity = (cityCode, cities) => cities.find((c) => c.codes[0] == cityCode || c.codes[1] == cityCode);
exports.cityCodeToCity = cityCodeToCity;
