"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../../db"));
const findUniqueDirRates = (dirRates) => {
    if (!Object.keys(dirRates).length)
        return {};
    try {
        const filterOptions = db_1.default.getObject(".tops");
        // const dirRatesWithoutFees = Object.fromEntries(Object.entries(dirRates).filter(
        //   ([_, rate]) => !rate.from_fee && !rate.to_fee && !rate.min_fee
        // ));
        const uniqueDirRates = filterOptions.reduce((res, { code }) => {
            switch (code) {
                case "optimal":
                    const optimalSelector = (rate) => rate.course ** 20 * rate.min.give;
                    res[code] = findUniqueDirRate(dirRates, optimalSelector);
                    break;
                case "best_course":
                    const courseSelector = (rate) => rate.course;
                    res[code] = findUniqueDirRate(dirRates, courseSelector);
                    break;
                case "low_min":
                    const minSelector = (rate) => rate.min.give;
                    res[code] = findUniqueDirRate(dirRates, minSelector);
                    break;
                case "top_max":
                    const maxSelector = (rate) => rate.max.give;
                    res[code] = findUniqueDirRate(dirRates, maxSelector, false);
                    break;
                default:
                    return res;
            }
            return res;
        }, {});
        return uniqueDirRates;
    }
    catch (err) {
        console.log(err);
        return {};
    }
};
const findUniqueDirRate = (dirRates, selector, needLowest = true) => {
    //[...Object.entries(dirRates)].sort((r1, r2) => r1[1].course - r2[1].course);
    const sorted = [...Object.entries(dirRates)].sort((r1, r2) => selector(r1[1]) - selector(r2[1]));
    const [exchangerId, rate] = needLowest ? sorted[0] : sorted.reverse()[0];
    return { [exchangerId]: rate };
};
exports.default = findUniqueDirRates;
