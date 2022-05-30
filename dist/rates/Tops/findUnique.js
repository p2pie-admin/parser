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
                const optimalSelector = (rate) => rate.course ** 20 * rate.min.give;
                res[option] = findUnique(dirRates, optimalSelector);
                break;
            case "best_course":
                const courseSelector = (rate) => rate.course;
                res[option] = findUnique(dirRates, courseSelector);
                break;
            case "lowest_min":
                const minSelector = (rate) => rate.min.give;
                res[option] = findUnique(dirRates, minSelector);
                break;
            case "top_max":
                const maxSelector = (rate) => rate.max.give;
                res[option] = findUnique(dirRates, maxSelector, false);
                break;
            default:
                return res;
        }
        return res;
    }, {});
    return uniqueDirRates;
};
const findUnique = (dirRates, selector, needLowest = true) => {
    const sorted = [...Object.entries(dirRates)].sort((r1, r2) => selector(r1[1]) - selector(r2[1]));
    const [exchangerId, rate] = needLowest ? sorted[0] : sorted.reverse()[0];
    return { [exchangerId]: rate };
};
exports.default = findUniqueDirRates;
//# sourceMappingURL=findUnique.js.map