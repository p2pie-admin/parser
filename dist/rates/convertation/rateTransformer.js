"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../../db"));
const verification_1 = __importDefault(require("./verification"));
const transformRateStringsToRates = (rateStrings) => {
    let manyRatesValues = rateStrings.map((rs) => rs.split(";"));
    const isCash = db_1.default.getData(".lastDir").includes("CASH");
    if (isCash)
        manyRatesValues = groupCities(manyRatesValues);
    return manyRatesValues.reduce((rates, rateValues) => {
        const rate = formatRate(rateValues);
        const verificationResult = (0, verification_1.default)(rate);
        !verificationResult.rateErrors.length
            ? rates.push(rate)
            : addToProblematic(rate, verificationResult);
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
const formatRate = (rateValues) => {
    const [id, name, course, reserve, max_fee, from_fee, to_fee, min_amount, max_amount, mask, cities,] = rateValues;
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
    const [give, get] = extractAmountsFromCourse(+course);
    const rate = {
        id: +id,
        name,
        give,
        get,
        max_fee,
        from_fee,
        to_fee,
        min_amount: transformLimit(min_amount, +course),
        max_amount: transformLimit(max_amount, +course),
        reserve: transformLimit(`${reserve} ${db_1.default.getData(".lastDir").split("_")[1]}`, +course),
        paramIds,
        cities: formatCities(cities),
    };
    return rate;
};
const transformLimit = (limit, course) => {
    const limitCur = limit.split(" ")[1];
    const limitValue = parseFloat(limit);
    const [givePm, getPm] = db_1.default.getData(".lastDir").split("_");
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
    return { give: roundAmount(give), get: roundAmount(get) };
};
const extractAmountsFromCourse = (course) => {
    const [give, get] = course < 1 ? [1, 1 / course] : [course, 1];
    return [roundAmount(give), roundAmount(get)];
};
const roundAmount = (amount, factor = 3) => {
    if (amount === 0)
        return 0;
    const orderOfMagnitude = -Math.floor(Math.log10(amount / 10 ** factor));
    return +amount.toFixed(orderOfMagnitude < 0 ? 0 : orderOfMagnitude);
};
const formatCities = (cities) => {
    const cityList = db_1.default.getData(".preferences.cities");
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
const addToProblematic = (rate, verificationResult) => {
    const dir = db_1.default.getData(".lastDir");
    const problematicRateExists = db_1.default.exists(`.problematicRates.${dir}.${rate.name}`);
    if (!problematicRateExists)
        db_1.default.push(`.problematicRates.${dir}.${rate.name}`, {
            rate,
            verificationResult,
        });
};
exports.default = transformRateStringsToRates;
//# sourceMappingURL=rateTransformer.js.map