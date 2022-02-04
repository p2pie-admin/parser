"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../../db"));
const filterByGeneral = (rates) => {
    const filterOptions = db_1.default.getObject(".preferences.filter_options");
    const ratesWithoutFees = rates.filter((r) => r.from_fee === "0" && r.to_fee === "0" && r.min_fee === "0");
    const bestRates = filterOptions.reduce((res, { name }) => {
        switch (name) {
            case "optimal":
                const optimalProperty = (rate) => rate.course ** 20 * rate.min_amount.give;
                res[name] = findBest(ratesWithoutFees, optimalProperty);
                break;
            case "best_course":
                const courseProperty = (rate) => rate.course;
                res[name] = findBest(ratesWithoutFees, courseProperty);
                break;
            case "lowest_min":
                const minProperty = (rate) => rate.min_amount.give;
                res[name] = findBest(ratesWithoutFees, minProperty);
                break;
            case "top_max":
                const maxProperty = (rate) => rate.max_amount.give;
                res[name] = findBest(ratesWithoutFees, maxProperty, false);
                break;
            case "best_rating":
                const ratingProperty = (rate) => rate.exchanger.our_rating;
                res[name] = findBest(ratesWithoutFees, ratingProperty, false);
                break;
            default:
                return res;
        }
        return res;
    }, {});
    return bestRates;
};
const findBest = (rates, getProperty, needLowest = true) => {
    const sorted = [...rates].sort((r1, r2) => getProperty(r1) - getProperty(r2));
    return needLowest ? sorted[0] : sorted.reverse()[0];
};
exports.default = filterByGeneral;
//# sourceMappingURL=filterByGeneral.js.map