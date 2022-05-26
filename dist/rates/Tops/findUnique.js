"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../../db"));
const findUniqueDirRates = (dirRates) => {
    const filterOptions = db_1.default.getObject(".parser_setting.filter_options");
    const uniqueDirRates = filterOptions.split("\n").reduce((res, option) => {
        switch (option) {
            case "optimal":
                const optimalProperty = (rate) => rate.course ** 20 * rate.min.give;
                res[option] = findUnique(dirRates, optimalProperty);
                break;
            case "best_course":
                const courseProperty = (rate) => rate.course;
                res[option] = findUnique(dirRates, courseProperty);
                break;
            case "lowest_min":
                const minProperty = (rate) => rate.min.give;
                res[option] = findUnique(dirRates, minProperty);
                break;
            case "top_max":
                const maxProperty = (rate) => rate.max.give;
                res[option] = findUnique(dirRates, maxProperty, false);
                break;
            default:
                return res;
        }
        return res;
    }, {});
    return uniqueDirRates;
};
const findUnique = (dirRates, getProperty, needLowest = true) => {
    const sorted = [...Object.entries(dirRates)].sort((r1, r2) => getProperty(r1[1]) - getProperty(r2[1]));
    const [exchangerId, rate] = needLowest ? sorted[0] : sorted.reverse()[0];
    return { [exchangerId]: rate };
};
exports.default = findUniqueDirRates;
//# sourceMappingURL=findUnique.js.map