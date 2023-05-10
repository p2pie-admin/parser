"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../../db"));
const addTopParameter = (prevUniqueDirRates, topParameter, [exchId, rate]) => {
    var _a;
    return Object.assign(Object.assign({}, prevUniqueDirRates), { [exchId]: Object.assign(Object.assign({}, rate), { parameters: [
                ...(((_a = prevUniqueDirRates[exchId]) === null || _a === void 0 ? void 0 : _a.parameters) || []),
                topParameter,
            ] }) });
};
const findUniqueDirRates = (dirRates) => {
    if (!Object.keys(dirRates).length)
        return {};
    try {
        const filterOptions = db_1.default.getObject(".topCodes");
        const uniqueDirRates = filterOptions.reduce((res, code) => {
            switch (code) {
                case "optimal":
                    const optimalSelector = (rate) => rate.course ** 20 * rate.min.give;
                    res = addTopParameter(res, "optimal", findUniqueDirRate(dirRates, optimalSelector));
                    break;
                case "best_course":
                    const courseSelector = (rate) => rate.course;
                    res = addTopParameter(res, "best_course", findUniqueDirRate(dirRates, courseSelector));
                    break;
                case "low_min":
                    const minSelector = (rate) => rate.min.give;
                    res = addTopParameter(res, "low_min", findUniqueDirRate(dirRates, minSelector));
                    break;
                case "top_max":
                    const maxSelector = (rate) => rate.max.give;
                    res = addTopParameter(res, "top_max", findUniqueDirRate(dirRates, maxSelector, false));
                    break;
                case "top_rating":
                    const topRatingSelector = (rate) => rate.admin_rating;
                    res = addTopParameter(res, "top_rating", findUniqueDirRate(dirRates, topRatingSelector));
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
    const sorted = [...Object.entries(dirRates)].sort((r1, r2) => selector(r1[1]) - selector(r2[1]));
    const [exchangerId, rate] = needLowest ? sorted[0] : sorted.reverse()[0];
    return [exchangerId, rate];
};
exports.default = findUniqueDirRates;
//# sourceMappingURL=findUnique.js.map