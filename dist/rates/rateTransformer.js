"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../../db"));
const [givePm, getPm] = db_1.default.getData(".lastDir").split("_");
const transformRateStringsToRates = (rateStrings) => {
    let ratesValues = rateStrings.map((rs) => rs.split(";"));
    const isCash = db_1.default.getData(".lastDir").includes("CASH");
    if (isCash)
        ratesValues = groupCities(ratesValues);
    return ratesValues.reduce((rates, rateValues) => {
        const rate = formatRate(rateValues);
        const verifiedRate = verifyRate(rate);
        verifiedRate ? rates.push(verifiedRate) : addToProblematic(rateValues);
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
    const [give, get] = extractAmountsFromCourse(+course, from_fee, to_fee);
    const rate = {
        id: +id,
        name,
        give,
        get,
        from_fee,
        to_fee,
        course: +course,
        reserve: +reserve,
        min_amount: min_amount.includes(givePm) ? parseFloat(min_amount) : 0,
        max_amount: max_amount.includes(givePm) ? parseFloat(max_amount) : 0,
        paramIds,
        cities: formatCities(cities),
    };
    return rate;
};
const extractAmountsFromCourse = (course, from_fee, to_fee) => {
    const feeGive = calculateFeeGive(from_fee, to_fee, course);
    const feeGet = calculateFeeGet(from_fee, to_fee, course);
    const [give, get] = course < 1 ? [1, feeGet(1 / course)] : [feeGive(course), 1];
    return [roundNumber(give), roundNumber(get)];
};
const calculateFeeGive = (from_fee, to_fee, course) => (amount) => {
    let res = amount;
    for (let fee of [from_fee, to_fee]) {
        if (fee.includes("%") && parseFloat(fee)) {
            res = res * (1 + parseFloat(fee) / 100);
        }
        else if (fee !== "0") {
            res = fee.includes(givePm)
                ? res + parseFloat(fee)
                : res + parseFloat(fee) * course;
        }
    }
    return res;
};
const calculateFeeGet = (from_fee, to_fee, course) => (amount) => {
    let res = amount;
    for (let fee of [from_fee, to_fee]) {
        if (fee.includes("%") && parseFloat(fee)) {
            res = res * (1 - parseFloat(fee) / 100);
        }
        else if (fee !== "0") {
            res = fee.includes(givePm)
                ? res - parseFloat(fee) / course
                : res - parseFloat(fee);
        }
    }
    return res;
};
const roundNumber = (num) => {
    const thousandsPart = num / 10000;
    const signsAfterPoint = Math.floor(Math.log10(thousandsPart));
    if (signsAfterPoint >= 0) {
        return +num.toFixed(0);
    }
    return +num.toFixed(-signsAfterPoint);
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
exports.default = transformRateStringsToRates;
//# sourceMappingURL=rateTransformer.js.map