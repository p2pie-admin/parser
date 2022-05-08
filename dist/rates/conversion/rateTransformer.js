"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../../db"));
const exchangers = db_1.default.getObject(".exchangers");
const transformRateStringsToRates = (rateStrings, dir) => {
    let manyRatesValues = rateStrings.map((rs) => rs.split(";"));
    const [givePmName, getPmName] = dir.split("_");
    const isCash = givePmName.startsWith("CASH") || getPmName.startsWith("CASH");
    if (isCash)
        manyRatesValues = groupCities(manyRatesValues);
    return manyRatesValues.reduce((rates, rateValues) => {
        const rate = formatRate(rateValues, dir);
        rates.push(rate);
        return rates;
    }, []);
};
const groupCities = (ratesValues) => {
    return ratesValues.reduce((grouped, rateValues) => {
        const sameIndex = grouped.findIndex((rv) => rv[0] === rateValues[0]);
        sameIndex === -1
            ? grouped.push(rateValues)
            : (grouped[sameIndex][10] =
                grouped[sameIndex][10] + "/" + rateValues[10]);
        return grouped;
    }, []);
};
const formatRate = (rateValues, dir) => {
    const [id, name, course, reserve, min_fee, from_fee, to_fee, min_amount, max_amount, mask, cities,] = rateValues;
    const binParams = [
        0b000000001,
        0b000000010,
        0b000000100,
        0b000001000,
        0b000010000,
        0b000100000,
        0b001000000,
        0b010000000,
        0b100000000,
    ];
    const paramIds = binParams.reduce((res, p) => p & +mask ? [...res, binParams.indexOf(p)] : res, []);
    const min = transformLimit(min_amount, +course, dir);
    const max = transformLimit(max_amount, +course, dir);
    const resv = transformLimit(`${reserve} ${dir.split("_")[1]}`, +course, dir);
    const rate = {
        id,
        course: +course,
        exchanger: findExchanger(name),
        min_fee,
        from_fee,
        to_fee,
        min_amount: min,
        max_amount: max.give > resv.give ? resv : max,
        reserve: resv,
        paramIds,
        cities: formatCities(cities),
    };
    return rate;
};
const transformLimit = (limit, course, dir) => {
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
const formatCities = (cities) => {
    const cityList = db_1.default.getData(".parser_setting.cities");
    return cities
        .split("/")
        .reduce((accumulator, cityCode) => {
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
const findExchanger = (name) => {
    return (exchangers.find((exch) => exch.name.toLowerCase().replace(/ /g, "") ===
        name.toLowerCase().replace(/ /g, "")) || { name, our_rating: 3 });
};
exports.default = transformRateStringsToRates;
//# sourceMappingURL=rateTransformer.js.map