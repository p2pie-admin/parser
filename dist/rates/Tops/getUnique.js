"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../../db"));
const findUniqueRates = (rates) => {
    const filterOptions = db_1.default.getObject(".parser_setting.filter_options");
    const ratesWithoutFees = rates.filter((r) => !r.from_fee && !r.to_fee && !r.min_fee);
    const bestRates = filterOptions.split("\n").reduce((res, option) => {
        switch (option) {
            case "optimal":
                const optimalProperty = (rate) => rate.course ** 20 * rate.min.give;
                res[option] = findUnique(ratesWithoutFees, optimalProperty);
                break;
            case "best_course":
                const courseProperty = (rate) => rate.course;
                res[option] = findUnique(ratesWithoutFees, courseProperty);
                break;
            case "lowest_min":
                const minProperty = (rate) => rate.min.give;
                res[option] = findUnique(ratesWithoutFees, minProperty);
                break;
            case "top_max":
                const maxProperty = (rate) => rate.max.give;
                res[option] = findUnique(ratesWithoutFees, maxProperty, false);
                break;
            default:
                return res;
        }
        return res;
    }, {});
    return bestRates;
};
const findUnique = (rates, getProperty, needLowest = true) => {
    const sorted = [...rates].sort((r1, r2) => getProperty(r1) - getProperty(r2));
    return needLowest ? sorted[0] : sorted.reverse()[0];
};
exports.default = findUniqueRates;
//# sourceMappingURL=getUnique.js.map